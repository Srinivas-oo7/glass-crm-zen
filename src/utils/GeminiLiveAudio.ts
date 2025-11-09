export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForGemini = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

class AudioQueue {
  private queue: ArrayBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: ArrayBuffer) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext(); // Continue with next segment
    }
  }

  clear() {
    this.queue = [];
  }
}

export class GeminiLiveChat {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  private meetingId: string;

  constructor(
    private onMessage: (message: any) => void,
    private onError: (error: Error) => void,
    meetingId: string
  ) {
    this.meetingId = meetingId;
  }

  async init() {
    try {
      console.log('Initializing Gemini Live session...');
      
      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Get session from edge function
      const { data, error } = await (window as any).supabase.functions.invoke('gemini-live-session', {
        body: { meetingId: this.meetingId }
      });

      if (error) throw error;

      const apiKey = data.apiKey;
      const model = 'gemini-2.0-flash-exp';

      // Connect to Gemini Live WebSocket
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('Gemini Live WebSocket connected');
        
        // Send setup message
        this.ws?.send(JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: "audio",
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Charon"
                  }
                }
              }
            }
          }
        }));

        // Start audio recording
        this.audioRecorder = new AudioRecorder((audioData) => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: "audio/pcm;rate=16000",
                  data: encodeAudioForGemini(audioData)
                }]
              }
            }));
          }
        });

        await this.audioRecorder.start();
        console.log('Audio recording started');
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Gemini Live message:', message);

          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              // Handle audio response
              if (part.inlineData?.mimeType === 'audio/pcm' && part.inlineData?.data) {
                const audioData = atob(part.inlineData.data);
                const bytes = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                  bytes[i] = audioData.charCodeAt(i);
                }
                await this.audioQueue?.addToQueue(bytes.buffer);
              }

              // Handle text response
              if (part.text) {
                this.onMessage({ type: 'text', text: part.text });
              }

              // Handle function calls
              if (part.functionCall) {
                this.onMessage({ type: 'function_call', functionCall: part.functionCall });
              }
            }
          }

          // Handle tool calls/responses
          if (message.toolCall) {
            this.onMessage({ type: 'tool_call', toolCall: message.toolCall });
          }

        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.cleanup();
      };

    } catch (error) {
      console.error('Error initializing Gemini Live:', error);
      this.onError(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text }]
        }],
        turnComplete: true
      }
    }));
  }

  private cleanup() {
    this.audioRecorder?.stop();
    this.audioQueue?.clear();
    this.audioContext?.close();
  }

  disconnect() {
    this.cleanup();
    this.ws?.close();
  }
}
