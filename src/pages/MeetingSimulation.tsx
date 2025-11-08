import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Loader2, CheckCircle, AlertTriangle, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const MeetingSimulation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0.9);
  const [managerAlerted, setManagerAlerted] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setStep(0);
    setLogs([]);
    setConfidence(0.9);
    setManagerAlerted(false);

    try {
      // Step 1: Create a test lead
      setStep(1);
      addLog("Creating test lead 'Sarah Johnson'...");
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          company: 'Tech Innovations Inc',
          industry: 'Technology',
          status: 'new',
          source: 'manual',
          lead_score: 75
        })
        .select()
        .single();

      if (leadError) throw leadError;
      setLeadId(newLead.id);
      addLog(`✓ Lead created: ${newLead.name} (ID: ${newLead.id.substring(0, 8)}...)`);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 2: Schedule meeting
      setStep(2);
      addLog("Scheduling meeting in 2 minutes...");
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 2);

      const { data: newMeeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: `Product Demo with ${newLead.name}`,
          lead_id: newLead.id,
          scheduled_at: scheduledTime.toISOString(),
          status: 'scheduled',
          google_meet_link: `https://meet.google.com/sim-${Date.now()}`
        })
        .select()
        .single();

      if (meetingError) throw meetingError;
      setMeetingId(newMeeting.id);
      addLog(`✓ Meeting scheduled for ${scheduledTime.toLocaleTimeString()}`);
      addLog(`  Meeting link: ${newMeeting.google_meet_link}`);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: Prepare AI agent
      setStep(3);
      addLog("Preparing AI agent to join meeting...");
      const { error: prepError } = await supabase.functions.invoke('meeting-voice-agent', {
        body: { action: 'prepare', meetingId: newMeeting.id }
      });

      if (prepError) throw prepError;
      addLog("✓ AI agent prepared with talking points and objection responses");
      await new Promise((r) => setTimeout(r, 2000));

      // Step 4: AI agent joins
      setStep(4);
      addLog("AI agent joining meeting...");
      const { error: joinError } = await supabase.functions.invoke('meeting-voice-agent', {
        body: { action: 'join', meetingId: newMeeting.id }
      });

      if (joinError) throw joinError;
      addLog("✓ AI agent joined the call");
      await new Promise((r) => setTimeout(r, 1500));

      // Step 5: Simulate conversation
      setStep(5);
      addLog("Simulating conversation...");
      addLog("  AI: Hello Sarah! Thank you for joining. I'm excited to show you our product.");
      await new Promise((r) => setTimeout(r, 2000));
      addLog("  Lead: Hi! Yes, I'm interested but concerned about the pricing.");
      setConfidence(0.7);
      await new Promise((r) => setTimeout(r, 2000));
      addLog("  AI: I understand. Let me show you our ROI calculator...");
      await new Promise((r) => setTimeout(r, 2000));
      addLog("  Lead: Hmm, I'm not sure this fits our budget right now.");
      setConfidence(0.45);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 6: Manager alert
      setStep(6);
      addLog("⚠ Confidence dropped below 50% - alerting manager!");
      setManagerAlerted(true);

      const transcript = [
        { speaker: "AI", text: "Hello Sarah! Thank you for joining. I'm excited to show you our product." },
        { speaker: "Lead", text: "Hi! Yes, I'm interested but concerned about the pricing." },
        { speaker: "AI", text: "I understand. Let me show you our ROI calculator..." },
        { speaker: "Lead", text: "Hmm, I'm not sure this fits our budget right now." }
      ];

      await supabase.functions.invoke('meeting-voice-agent', {
        body: {
          action: 'analyze_transcript',
          meetingId: newMeeting.id,
          transcript,
          duration: 180
        }
      });

      addLog("✓ Manager alert sent with meeting summary");
      await new Promise((r) => setTimeout(r, 2000));

      // Step 7: Manager joins
      setStep(7);
      addLog("Manager joining call...");
      await supabase
        .from('meetings')
        .update({
          manager_joined_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', newMeeting.id);

      addLog("✓ Manager joined - AI agent briefed manager on:");
      addLog("  • Lead expressed budget concerns");
      addLog("  • Confidence score: 45%");
      addLog("  • Suggested approach: Offer flexible payment terms");
      await new Promise((r) => setTimeout(r, 2000));
      addLog("  Manager: Hi Sarah! I understand you have some budget concerns...");
      setConfidence(0.75);
      await new Promise((r) => setTimeout(r, 2000));
      addLog("  Lead: Yes! If you can offer quarterly payments, we're interested.");
      setConfidence(0.95);
      await new Promise((r) => setTimeout(r, 2000));

      // Step 8: Complete meeting
      setStep(8);
      addLog("Meeting concluding...");
      const finalTranscript = [
        ...transcript,
        { speaker: "Manager", text: "Hi Sarah! I understand you have some budget concerns..." },
        { speaker: "Lead", text: "Yes! If you can offer quarterly payments, we're interested." },
        { speaker: "Manager", text: "Absolutely! Let me send you a custom proposal." }
      ];

      await supabase.functions.invoke('meeting-voice-agent', {
        body: {
          action: 'complete',
          meetingId: newMeeting.id,
          transcript: finalTranscript,
          outcome: 'Deal closed with quarterly payment terms'
        }
      });

      addLog("✓ Meeting completed successfully");
      addLog("✓ Final outcome: Deal closed with quarterly payment terms");
      addLog("✓ AI generated meeting summary and next steps");

      toast({
        title: "Simulation Complete!",
        description: "Check the Active Meetings view to see the results",
      });

    } catch (error) {
      console.error('Simulation error:', error);
      addLog(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Simulation Error",
        description: "Something went wrong during the simulation",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stepTitles = [
    "Ready to start",
    "Creating test lead",
    "Scheduling meeting",
    "Preparing AI agent",
    "AI agent joining",
    "Conversation in progress",
    "Manager alert triggered",
    "Manager joining",
    "Meeting completed"
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PhoneCall className="h-6 w-6 text-primary" />
              Meeting Simulation
            </CardTitle>
            <p className="text-muted-foreground">
              Watch a simulated meeting where the AI agent handles a sales call, detects issues, and alerts the manager to join
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Simulation Flow:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Create a test lead (Sarah Johnson)</li>
                <li>Schedule a meeting in 2 minutes</li>
                <li>AI agent prepares talking points</li>
                <li>AI agent joins the call automatically</li>
                <li>Conversation starts - lead expresses concerns</li>
                <li>AI confidence drops → Manager is alerted</li>
                <li>Manager joins with AI-generated briefing</li>
                <li>Deal closes successfully</li>
              </ol>
            </div>

            {step > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stepTitles[step]}</span>
                  <span className="text-muted-foreground">{step}/8</span>
                </div>
                <Progress value={(step / 8) * 100} className="h-2" />
              </div>
            )}

            {managerAlerted && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive text-sm">Manager Alert Triggered</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI confidence: {(confidence * 100).toFixed(0)}% - Manager intervention needed
                  </p>
                </div>
              </div>
            )}

            {confidence < 1 && step >= 5 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">AI Confidence Score</span>
                  <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <Progress value={confidence * 100} className="h-2" />
              </div>
            )}

            <div className="bg-background/50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Simulation Log</h3>
                {logs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {logs.length} events
                  </Badge>
                )}
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Click "Start Simulation" to begin
                  </p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              onClick={runSimulation}
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Simulation
                </>
              )}
            </Button>

            {step === 8 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <div>
                  <p className="font-semibold text-success text-sm">Simulation Complete!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check Active Meetings to see the full details
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeetingSimulation;
