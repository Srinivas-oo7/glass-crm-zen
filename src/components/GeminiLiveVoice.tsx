import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GeminiLiveChat } from "@/utils/GeminiLiveAudio";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  type: 'text' | 'function_call' | 'tool_call';
  text?: string;
  functionCall?: any;
  toolCall?: any;
  timestamp: Date;
}

interface GeminiLiveVoiceProps {
  meetingId: string;
  leadName: string;
  onCallEnd?: () => void;
}

const GeminiLiveVoice = ({ meetingId, leadName, onCallEnd }: GeminiLiveVoiceProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [duration, setDuration] = useState(0);
  const chatRef = useRef<GeminiLiveChat | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      chatRef.current?.disconnect();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMessage = (message: any) => {
    console.log('Received message:', message);
    
    const newMessage: Message = {
      ...message,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, newMessage]);

    // Handle function calls
    if (message.type === 'function_call' && message.functionCall?.name === 'alert_manager') {
      toast({
        title: "Manager Alert",
        description: "AI is requesting manager intervention",
        variant: "destructive",
      });
      
      // Update meeting to trigger manager alert
      supabase
        .from('meetings')
        .update({
          manager_alert_triggered: true,
          manager_alert_reason: message.functionCall.args?.reason || 'AI agent requested assistance'
        })
        .eq('id', meetingId)
        .then(() => {
          console.log('Manager alert triggered');
        });
    }
  };

  const handleError = (error: Error) => {
    console.error('Gemini Live error:', error);
    toast({
      title: "Connection Error",
      description: error.message,
      variant: "destructive",
    });
    setIsConnected(false);
    setIsConnecting(false);
  };

  const startCall = async () => {
    setIsConnecting(true);
    
    try {
      // Update meeting status
      await supabase
        .from('meetings')
        .update({
          agent_joined_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', meetingId);

      chatRef.current = new GeminiLiveChat(handleMessage, handleError, meetingId);
      await chatRef.current.init();
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // Start duration counter
      durationIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      toast({
        title: "Call Connected",
        description: `Live conversation with ${leadName} started`,
      });
    } catch (error) {
      console.error('Error starting call:', error);
      handleError(error instanceof Error ? error : new Error('Failed to start call'));
    }
  };

  const endCall = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    chatRef.current?.disconnect();
    setIsConnected(false);
    setDuration(0);

    // Update meeting status
    await supabase
      .from('meetings')
      .update({
        status: 'completed',
        meeting_duration: duration
      })
      .eq('id', meetingId);

    toast({
      title: "Call Ended",
      description: `Duration: ${formatDuration(duration)}`,
    });

    onCallEnd?.();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute/unmute logic here
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-primary" />
            Live Voice Call with {leadName}
          </div>
          {isConnected && (
            <Badge variant="default" className="animate-pulse">
              {formatDuration(duration)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button
            onClick={startCall}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to {leadName}...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-5 w-5" />
                Start Live Call
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleMute}
                className="flex-1"
              >
                {isMuted ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Mute
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={endCall}
                className="flex-1"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                End Call
              </Button>
            </div>

            {messages.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Conversation Log</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto text-sm">
                  {messages.map((msg, i) => (
                    <div key={i} className="text-muted-foreground">
                      [{msg.timestamp.toLocaleTimeString()}] {msg.type === 'text' && msg.text}
                      {msg.type === 'function_call' && `Function: ${msg.functionCall?.name}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeminiLiveVoice;
