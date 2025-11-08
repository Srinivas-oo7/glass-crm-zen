export class WakeWordDetector {
  private recognition: any;
  private isListening = false;
  private onWakeWord: () => void;
  private onEndCommand?: () => void;

  constructor(onWakeWord: () => void, onEndCommand?: () => void) {
    this.onWakeWord = onWakeWord;
    this.onEndCommand = onEndCommand;
    
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      console.log('Heard:', transcript);

      // Check for end command
      if (
        transcript.includes('end crm') ||
        transcript.includes('end see are em') ||
        transcript.includes('end c r m')
      ) {
        console.log('End command detected!');
        if (this.onEndCommand) {
          this.onEndCommand();
        }
        return;
      }

      // Check for wake word variations
      if (
        transcript.includes('hey crm') ||
        transcript.includes('hey see are em') ||
        transcript.includes('hey c r m')
      ) {
        console.log('Wake word detected!');
        this.onWakeWord();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart listening after no-speech error
        if (this.isListening) {
          setTimeout(() => this.start(), 100);
        }
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we're supposed to be listening
      if (this.isListening) {
        console.log('Recognition ended, restarting...');
        setTimeout(() => this.start(), 100);
      }
    };
  }

  start() {
    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        console.log('Wake word detection started');
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }

  stop() {
    this.isListening = false;
    try {
      this.recognition.stop();
      console.log('Wake word detection stopped');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }
}
