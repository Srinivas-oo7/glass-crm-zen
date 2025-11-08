import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Processing voice command:', message);

    // Initialize Supabase client to fetch data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data from database
    const [leadsData, campaignsData, meetingsData, actionsData] = await Promise.all([
      supabase.from('leads').select('*').order('lead_score', { ascending: false }).limit(20),
      supabase.from('email_campaigns').select('*, leads(name, company)').order('created_at', { ascending: false }).limit(10),
      supabase.from('meetings').select('*, leads(name, company)').order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('agent_actions').select('*').eq('status', 'pending').limit(5)
    ]);

    // Detect and execute action items
    const lowerMessage = message.toLowerCase();
    let actionResults: string[] = [];
    
    // 1. Add tasks/reminders
    if (lowerMessage.includes('remind') || lowerMessage.includes('add task') || lowerMessage.includes('todo')) {
      const taskTitle = message.replace(/remind me to|add task to|create task to|todo:/gi, '').trim();
      if (taskTitle) {
        const today = new Date();
        today.setHours(today.getHours() + 1);
        const { error } = await supabase.from('meetings').insert({
          title: taskTitle,
          scheduled_at: today.toISOString(),
          status: 'scheduled',
          lead_id: leadsData.data?.[0]?.id || '00000000-0000-0000-0000-000000000000'
        });
        if (!error) actionResults.push('Task added successfully');
      }
    }
    
    // 2. Mark tasks complete
    if (lowerMessage.includes('complete') || lowerMessage.includes('done') || lowerMessage.includes('finish')) {
      if (lowerMessage.includes('task') || lowerMessage.includes('today')) {
        const { data: todayTasks } = await supabase
          .from('meetings')
          .select('*')
          .gte('scheduled_at', new Date().toISOString().split('T')[0])
          .eq('status', 'scheduled');
        
        if (todayTasks && todayTasks.length > 0) {
          for (const task of todayTasks) {
            await supabase.from('meetings').update({ status: 'completed' }).eq('id', task.id);
          }
          actionResults.push(`Marked ${todayTasks.length} task(s) as complete`);
        }
      }
    }
    
    // 3. Set follow-ups
    if (lowerMessage.includes('follow up') || lowerMessage.includes('followup')) {
      const leadName = message.match(/with\s+([A-Za-z\s]+)/i)?.[1]?.trim();
      const dateMatch = message.match(/on\s+(\w+\s+\d+)/i)?.[1];
      
      if (leadName) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .ilike('name', `%${leadName}%`)
          .single();
        
        if (lead) {
          const followupDate = dateMatch ? new Date(dateMatch) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await supabase.from('leads').update({ next_followup_at: followupDate.toISOString() }).eq('id', lead.id);
          actionResults.push(`Follow-up scheduled with ${lead.name}`);
        }
      }
    }
    
    // 4. Draft emails
    if (lowerMessage.includes('draft') || lowerMessage.includes('email')) {
      const leadName = message.match(/to\s+([A-Za-z\s]+)/i)?.[1]?.trim();
      
      if (leadName) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .ilike('name', `%${leadName}%`)
          .single();
        
        if (lead) {
          const { data: campaignData, error: draftError } = await supabase.functions.invoke('draft-email', {
            body: { leadId: lead.id, context: message }
          });
          
          if (!draftError && campaignData) {
            actionResults.push(`Email draft created for ${lead.name}. Say "approve and send email to ${lead.name}" to send it.`);
          }
        }
      }
    }
    
    // 5. Approve and send emails
    if ((lowerMessage.includes('approve') || lowerMessage.includes('send')) && lowerMessage.includes('email')) {
      const leadName = message.match(/to\s+([A-Za-z\s]+)/i)?.[1]?.trim();
      
      if (leadName) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .ilike('name', `%${leadName}%`)
          .single();
        
        if (lead) {
          const { data: campaign } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('lead_id', lead.id)
            .eq('draft_status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (campaign) {
            await supabase.from('email_campaigns').update({ draft_status: 'approved' }).eq('id', campaign.id);
            
            const { error: sendError } = await supabase.functions.invoke('send-email', {
              body: { campaignId: campaign.id }
            });
            
            if (!sendError) {
              actionResults.push(`Email sent to ${lead.name} successfully`);
            }
          }
        }
      }
    }
    
    // 6. Find/search leads
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('show me')) {
      if (lowerMessage.includes('lead')) {
        const industry = message.match(/in\s+([A-Za-z\s]+)/i)?.[1]?.trim();
        const status = message.match(/status\s+(\w+)/i)?.[1]?.trim();
        
        let query = supabase.from('leads').select('*');
        if (industry) query = query.ilike('industry', `%${industry}%`);
        if (status) query = query.eq('status', status);
        
        const { data: foundLeads } = await query.limit(5);
        if (foundLeads && foundLeads.length > 0) {
          actionResults.push(`Found ${foundLeads.length} lead(s)`);
        }
      }
    }
    
    // 7. Add new leads
    if (lowerMessage.includes('add lead') || lowerMessage.includes('new lead')) {
      const nameMatch = message.match(/(?:named?|called)\s+([A-Za-z\s]+)/i)?.[1]?.trim();
      const emailMatch = message.match(/email\s+([\w.@]+)/i)?.[1]?.trim();
      const companyMatch = message.match(/(?:from|at|company)\s+([A-Za-z\s]+)/i)?.[1]?.trim();
      
      if (nameMatch) {
        const { error } = await supabase.from('leads').insert({
          name: nameMatch,
          email: emailMatch || null,
          company: companyMatch || null,
          status: 'new',
          source: 'voice_assistant',
          lead_score: 50
        });
        
        if (!error) {
          actionResults.push(`Lead ${nameMatch} added successfully`);
        }
      }
    }

    // Build context with actual data
    const dataContext = `
Current Sales Data:

LEADS (${leadsData.data?.length || 0} total, showing top 20):
${leadsData.data?.map(lead => 
  `- ${lead.name} (${lead.company || 'Unknown Company'})
    Status: ${lead.status} | Score: ${lead.lead_score} | Industry: ${lead.industry || 'N/A'}
    Email: ${lead.email || 'N/A'} | Source: ${lead.source}
    ${lead.notes ? `Notes: ${lead.notes}` : ''}`
).join('\n') || 'No leads yet'}

EMAIL CAMPAIGNS (${campaignsData.data?.length || 0} recent):
${campaignsData.data?.map(c => 
  `- To: ${c.leads?.name} (${c.leads?.company})
    Subject: ${c.subject}
    Status: ${c.draft_status}
    ${c.sent_at ? `Sent: ${c.sent_at}` : 'Not sent yet'}`
).join('\n') || 'No campaigns yet'}

MEETINGS (${meetingsData.data?.length || 0} upcoming):
${meetingsData.data?.map(m => 
  `- ${m.title} with ${m.leads?.name} (${m.leads?.company})
    Scheduled: ${m.scheduled_at}
    Status: ${m.status}`
).join('\n') || 'No meetings scheduled'}

PENDING ACTIONS (${actionsData.data?.length || 0}):
${actionsData.data?.map(a => 
  `- ${a.action_type} (${a.agent_type}): ${a.status}`
).join('\n') || 'No pending actions'}

${actionResults.length > 0 ? `\n[ACTIONS COMPLETED: ${actionResults.join('; ')}]` : ''}
`;

    console.log('Data context prepared with live database info');

    // Build conversation context
    const messages = conversationHistory || [];
    messages.push({
      role: 'user',
      parts: [{ text: `${dataContext}\n\nUser query: ${message}` }]
    });

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          systemInstruction: {
            parts: [{
            text: `You are an AI sales assistant with full access to real-time sales data and ability to execute actions. You help managers with:
- Analyzing leads and their scores
- Finding and adding new leads
- Setting follow-ups automatically
- Drafting emails to leads
- Approving and sending emails
- Creating and completing tasks
- Managing meeting schedules
- Providing actionable insights from the sales pipeline

IMPORTANT CAPABILITIES:
- You can ADD tasks/reminders when asked
- You can MARK tasks complete when requested
- You can SET follow-ups with leads
- You can DRAFT emails to leads
- You can SEND emails after voice approval
- You can FIND and SEARCH leads
- You can ADD new leads to the system

When actions are performed, you'll see [ACTIONS COMPLETED] in the context - acknowledge what was done.
Always be proactive in suggesting and executing actions.
Be concise, actionable, and professional. Keep responses under 2-3 sentences.
Reference actual lead names and numbers when available.`
            }]
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not process that.';

    console.log('Assistant response:', assistantMessage);

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
