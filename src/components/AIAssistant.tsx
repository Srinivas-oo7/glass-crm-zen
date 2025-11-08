import { useState, useEffect, useRef } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WakeWordDetector } from "@/utils/WakeWordDetection";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type AssistantState = 'listening-wake' | 'active' | 'processing';

interface HighlightedTile {
  id: string;
  name: string;
}

const AIAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [assistantState, setAssistantState] = useState<AssistantState>('listening-wake');
  const [highlightedTile, setHighlightedTile] = useState<HighlightedTile | null>(null);
  const { toast } = useToast();
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const voiceRecognitionRef = useRef<any>(null);
  const queryRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Start listening for wake word immediately on mount
    try {
      wakeWordDetectorRef.current = new WakeWordDetector(() => {
        console.log('Wake word "Hey CRM" detected - listening for query');
        setAssistantState('active');
        setIsActive(true);
        setUserQuery("");
        setCurrentMessage("");
        startQueryRecognition();
      });
      wakeWordDetectorRef.current.start();
      setAssistantState('listening-wake');
      console.log('Wake word detection active - say "Hey CRM" to activate');
    } catch (error) {
      console.error('Error starting wake word detection:', error);
      toast({
        title: "Error",
        description: "Voice activation not supported in your browser",
        variant: "destructive"
      });
    }

    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
      }
      if (queryRecognitionRef.current) {
        queryRecognitionRef.current.stop();
      }
    };
  }, []);

  const startQueryRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description: "Speech recognition not supported",
        variant: "destructive"
      });
      setIsActive(false);
      setAssistantState('listening-wake');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Query:', transcript);
      
      if (event.results[0].isFinal) {
        setUserQuery(transcript);
        await handleQuery(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsActive(false);
      setAssistantState('listening-wake');
    };

    recognition.onend = () => {
      console.log('Query recognition ended');
    };

    queryRecognitionRef.current = recognition;
    recognition.start();
  };

  const handleQuery = async (query: string) => {
    setAssistantState('processing');

    try {
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: { 
          message: query,
          conversationHistory: []
        }
      });

      if (error) throw error;

      setCurrentMessage(data.message);
      
      // Determine which tile to highlight based on the query
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('lead') || lowerQuery.includes('contact')) {
        setHighlightedTile({ id: 'contacts', name: 'Contacts' });
      } else if (lowerQuery.includes('deal') || lowerQuery.includes('proposal')) {
        setHighlightedTile({ id: 'deals', name: 'Deals' });
      } else if (lowerQuery.includes('follow') || lowerQuery.includes('followup')) {
        setHighlightedTile({ id: 'followups', name: 'Follow-ups' });
      } else if (lowerQuery.includes('task') || lowerQuery.includes('today')) {
        setHighlightedTile({ id: 'tasks', name: 'Tasks' });
      } else if (lowerQuery.includes('meeting') || lowerQuery.includes('calendar')) {
        setHighlightedTile({ id: 'calendar', name: 'Calendar' });
      } else if (lowerQuery.includes('dashboard') || lowerQuery.includes('overview')) {
        setHighlightedTile({ id: 'dashboard', name: 'Dashboard' });
      }

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        handleDismiss();
      }, 8000);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive"
      });
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsActive(false);
    setCurrentMessage("");
    setUserQuery("");
    setHighlightedTile(null);
    setAssistantState('listening-wake');
    
    if (queryRecognitionRef.current) {
      queryRecognitionRef.current.stop();
    }
  };

  const getStateIndicator = () => {
    switch (assistantState) {
      case 'listening-wake':
        return { color: 'bg-blue-500', text: 'Say "Hey CRM" to activate', pulse: true };
      case 'active':
        return { color: 'bg-green-500', text: 'Listening for your query...', pulse: true };
      case 'processing':
        return { color: 'bg-yellow-500', text: 'Processing...', pulse: false };
    }
  };

  const stateIndicator = getStateIndicator();

  return (
    <>
      {/* Status Indicator - Always visible */}
      <div className="fixed top-24 right-6 z-40 glass-tile px-4 py-2 rounded-full">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${stateIndicator.color} ${stateIndicator.pulse ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium">{stateIndicator.text}</span>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full space-y-6">
              {/* User Query Display */}
              {userQuery && (
                <div className="glass-tile p-6 rounded-2xl animate-in slide-in-from-top duration-300">
                  <p className="text-sm text-muted-foreground mb-2">You asked:</p>
                  <p className="text-2xl font-semibold">{userQuery}</p>
                </div>
              )}

              {/* AI Response Display */}
              {currentMessage && (
                <div className="glass-tile gradient-ai p-8 rounded-2xl animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg leading-relaxed">{currentMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Highlighted Tile Info */}
              {highlightedTile && (
                <div className="glass-tile p-6 rounded-2xl border-2 border-primary animate-in zoom-in duration-300">
                  <p className="text-sm text-muted-foreground mb-2">Relevant section:</p>
                  <p className="text-xl font-semibold text-primary">{highlightedTile.name}</p>
                </div>
              )}

              {/* Processing State */}
              {assistantState === 'processing' && !currentMessage && (
                <div className="glass-tile p-8 rounded-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <Button
              onClick={handleDismiss}
              size="icon"
              variant="ghost"
              className="absolute top-6 right-6 h-12 w-12 rounded-full hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Apply highlight effect to tiles */}
      {highlightedTile && (
        <style>{`
          [data-tile-id="${highlightedTile.id}"] {
            animation: highlight-pulse 2s ease-in-out infinite;
            box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.5);
          }
          @keyframes highlight-pulse {
            0%, 100% { box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.5); }
            50% { box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0.8); }
          }
        `}</style>
      )}
    </>
  );
};

export default AIAssistant;
