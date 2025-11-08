import { useState, useEffect, useRef } from "react";
import { MessageCircle, Mic, MicOff, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WakeWordDetector } from "@/utils/WakeWordDetection";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type AssistantState = 'idle' | 'listening-wake' | 'active' | 'processing';

const AIAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Say 'Hey CRM' to activate me, or click to chat. I can analyze leads, draft emails, and schedule meetings!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const { toast } = useToast();
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const voiceRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isVoiceEnabled && !wakeWordDetectorRef.current) {
      try {
        wakeWordDetectorRef.current = new WakeWordDetector(() => {
          console.log('Wake word detected - activating assistant');
          setAssistantState('active');
          setIsExpanded(true);
          startVoiceRecognition();
          
          toast({
            title: "Listening",
            description: "I'm ready to help!",
          });
        });
        wakeWordDetectorRef.current.start();
        setAssistantState('listening-wake');
        console.log('Wake word detection active');
      } catch (error) {
        console.error('Error starting wake word detection:', error);
        toast({
          title: "Error",
          description: "Voice activation not supported in your browser",
          variant: "destructive"
        });
        setIsVoiceEnabled(false);
      }
    } else if (!isVoiceEnabled && wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current.stop();
      wakeWordDetectorRef.current = null;
      setAssistantState('idle');
    }

    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
      }
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
    };
  }, [isVoiceEnabled]);

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description: "Speech recognition not supported",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice input:', transcript);
      setInput(transcript);
      await handleSend(transcript);
      
      // Return to wake word listening
      setTimeout(() => {
        setAssistantState('listening-wake');
      }, 1000);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setAssistantState('listening-wake');
    };

    recognition.onend = () => {
      setAssistantState('listening-wake');
    };

    voiceRecognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setAssistantState('processing');
    
    // Add user message immediately
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: { 
          message: userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { 
        role: "assistant", 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      if (isVoiceEnabled) {
        setAssistantState('listening-wake');
      } else {
        setAssistantState('idle');
      }
    }
  };

  const toggleVoiceMode = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled) {
      toast({
        title: "Voice Mode Active",
        description: "Say 'Hey CRM' to activate",
      });
    } else {
      toast({
        title: "Voice Mode Off",
        description: "Use text input or click the mic icon",
      });
    }
  };

  const getStateIndicator = () => {
    switch (assistantState) {
      case 'listening-wake':
        return { color: 'bg-blue-500', text: 'Listening for "Hey CRM"' };
      case 'active':
        return { color: 'bg-green-500', text: 'Listening...' };
      case 'processing':
        return { color: 'bg-yellow-500', text: 'Processing...' };
      default:
        return { color: 'bg-gray-500', text: 'Ready' };
    }
  };

  const stateIndicator = getStateIndicator();

  return (
    <>
      {!isExpanded ? (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsExpanded(true)}
            className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all flex items-center justify-center group relative"
            style={{
              boxShadow: "0 0 40px rgba(0, 122, 255, 0.4)",
            }}
          >
            <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
            {isVoiceEnabled && (
              <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${stateIndicator.color} animate-pulse`} />
            )}
          </button>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] glass-tile gradient-ai z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${stateIndicator.color} animate-pulse`} />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">{stateIndicator.text}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/60 border border-white/40"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/60 border border-white/40 rounded-2xl px-4 py-2">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/30">
            <div className="flex gap-2">
              <Button
                variant={isVoiceEnabled ? "default" : "ghost"}
                size="icon"
                className="shrink-0 rounded-full"
                disabled={isLoading}
                onClick={toggleVoiceMode}
                title={isVoiceEnabled ? "Voice mode active - say 'Hey CRM'" : "Enable voice mode"}
              >
                {isVoiceEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isVoiceEnabled ? "Say 'Hey CRM' or type..." : "Ask me anything..."}
                className="bg-white/60 border-white/40 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                size="icon"
                className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
