# Autonomous AI Sales Agent System - Implementation Guide

## Overview
This CRM now features a fully autonomous AI sales agent system that handles email responses, follow-ups, meeting preparation, and provides real-time activity monitoring.

## What's Been Implemented

### 1. Agent Activity Dashboard
**Location:** New tile on the main dashboard (bottom row)
**Features:**
- Real-time monitoring of all background agent runs
- Shows pending manager approvals
- Displays recent agent activity with status indicators
- Auto-refreshes when new agent actions occur

**What You'll See:**
- Lead Scoring Agent running every 6 hours
- Email Monitoring Agent checking every 30 minutes
- Follow-up Agent running daily at 9 AM
- Meeting Preparation Agent checking every 15 minutes
- Deal Pipeline Agent running every 6 hours

### 2. Email Reply Management
**Location:** Top nav "Emails" button → "Pending Replies" tab
**Features:**
- Automatically detects incoming email replies (when integrated with your email provider)
- AI analyzes sentiment (Positive/Neutral/Negative)
- AI drafts appropriate responses
- Manager reviews and approves before sending
- Voice command: "Review pending email replies" or "Approve reply to [Lead Name]"

### 3. Active Meetings View
**Location:** Top nav "Emails" button → "Active Meetings" tab
**Features:**
- Shows all scheduled, prepared, and in-progress meetings
- Real-time AI confidence scores
- Manager alerts when AI needs help (red border)
- Quick join button for managers
- Meeting summaries and status tracking

### 4. Automated Follow-up System
**Features:**
- Tracks unresponsive leads automatically
- Sends follow-up emails after 7 days of no response
- Escalates priority after 14 days
- Creates draft emails for manager approval
- Voice command: "Show me unresponsive leads" or "Approve weekly follow-ups"

### 5. Meeting Voice Agent (Gemini Live API)
**Edge Function:** `meeting-voice-agent`
**Features:**
- Automatically prepares meeting context 1 hour before scheduled time
- Generates talking points and objection responses
- Can join meetings and conduct conversations (requires Gemini Live integration)
- Real-time sentiment analysis during calls
- Alerts manager when confidence drops below 50%
- Generates meeting summaries after completion

**Actions:**
- `prepare`: Generates context and talking points before meeting
- `join`: Initializes Gemini Live session for voice conversation
- `analyze_transcript`: Real-time analysis of conversation confidence
- `complete`: Generates summary when meeting ends

### 6. Background Agent Orchestrator
**Edge Function:** `agent-orchestrator`
**Manages 5 specialized agents:**

1. **Lead Scoring Agent** (every 6 hours)
   - Analyzes engagement metrics
   - Updates lead scores
   - Prioritizes hot leads

2. **Email Monitoring Agent** (every 30 minutes)
   - Checks for new replies
   - Triggers sentiment analysis
   - Creates draft responses

3. **Meeting Preparation Agent** (every 15 minutes)
   - Prepares context 1 hour before meetings
   - Generates talking points
   - Updates agent notes

4. **Follow-up Agent** (daily at 9 AM)
   - Identifies leads needing follow-up
   - Drafts personalized emails
   - Creates approval tasks

5. **Deal Pipeline Agent** (every 6 hours)
   - Updates deal stages
   - Identifies stalled deals
   - Suggests next actions

### 7. Voice Commands
All integrated with the existing voice assistant:

**Email Commands:**
- "Review pending email replies"
- "Approve reply to [Lead Name]"
- "Approve and send email to [Lead Name]"

**Follow-up Commands:**
- "Show me unresponsive leads"
- "Approve follow-up emails"

**Agent Commands:**
- "Run follow-up agent"
- "Run background agents"
- "What are the agents working on?"
- "Show agent activity"

**Meeting Commands:**
- "Show active meetings"
- "Show meetings where AI needs help"

## Automated Scheduling

### Cron Jobs Setup
All background agents run automatically:

| Agent | Schedule | Purpose |
|-------|----------|---------|
| Email Reply Handler | Every 30 minutes | Process incoming emails |
| Follow-up Scheduler | Daily at 9 AM | Draft follow-up emails |
| Agent Orchestrator | Every 6 hours | Run all background agents |
| Meeting Preparation | Every 15 minutes | Prepare upcoming meetings |

### How to Trigger Manually
You can also trigger agents manually via:
1. Voice commands (see above)
2. Calling the edge functions directly from code
3. Database triggers when certain conditions are met

## Real-Time Updates

All components use Supabase Realtime to automatically update when:
- New leads are added
- Email replies arrive
- Agent runs complete
- Meetings change status
- Agent actions are created

## Database Tables

### New Tables:
1. **email_replies**: Tracks incoming emails and draft responses
2. **agent_runs**: Logs all background agent executions
3. **agent_actions**: Pending approvals and manager tasks

### Updated Tables:
1. **meetings**: Added AI confidence, sentiment, transcripts
2. **email_campaigns**: Added follow-up tracking fields
3. **leads**: Added unresponsive days tracking

## Integration Points

### Email Provider Integration (Next Step)
To fully enable email reply detection:
1. Set up Resend webhook for incoming emails
2. Configure webhook to call `email-reply-handler` edge function
3. Emails will be automatically processed and analyzed

### Calendar Integration (Future)
For automated meeting scheduling:
1. Add Google Calendar API credentials
2. Implement OAuth flow for manager calendar
3. Enable automated time slot selection

### Gemini Live Voice Integration (In Progress)
The meeting voice agent is ready to integrate with Gemini Live API:
1. Uses `gemini-2.0-flash-exp` model
2. Real-time audio transcription
3. Sentiment analysis during conversations
4. Manager alerts on low confidence

## UI Navigation

**Main Dashboard:**
- Agent Activity Tile (new) - shows real-time agent status
- All existing tiles remain functional

**Top Navigation:**
- "Emails" button opens multi-tab view:
  - Campaigns: Draft and sent emails
  - Pending Replies: Email responses needing review
  - Active Meetings: Current and upcoming meetings

**Voice Control:**
All features accessible via "Hey CRM" wake word commands

## Monitoring & Debugging

### Check Agent Activity:
1. Open Agent Activity tile on dashboard
2. View recent runs and their status
3. See pending approvals count

### Check Email Replies:
1. Click "Emails" → "Pending Replies" tab
2. Review sentiment scores
3. Approve/reject AI-drafted responses

### Check Active Meetings:
1. Click "Emails" → "Active Meetings" tab
2. Monitor AI confidence scores
3. Look for red borders (alerts)

### Database Queries:
```sql
-- Check recent agent runs
SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 10;

-- Check pending actions
SELECT * FROM agent_actions WHERE status = 'pending';

-- Check email replies
SELECT * FROM email_replies WHERE status = 'pending';

-- View cron job status
SELECT * FROM cron.job;
```

## Testing the System

### Test Email Reply Flow:
1. Manually insert a test email reply:
```sql
INSERT INTO email_replies (lead_id, reply_content, sentiment_score, requires_manager_review)
VALUES ((SELECT id FROM leads LIMIT 1), 'Thanks for reaching out! I am interested.', 0.8, true);
```
2. Open "Emails" → "Pending Replies"
3. Review AI draft response
4. Approve or reject

### Test Agent Runs:
1. Say "Hey CRM, run background agents"
2. Watch Agent Activity tile update
3. Check agent_runs table for results

### Test Meeting Preparation:
1. Create a meeting scheduled for 1 hour from now
2. Wait 15 minutes for prep agent to run
3. Check meeting's agent_notes field

## Next Steps

### Priority 1: Email Integration
Set up Resend webhook to enable automatic email reply detection

### Priority 2: Calendar Integration
Connect Google Calendar for automated scheduling

### Priority 3: Gemini Live Integration
Complete the voice agent integration for real meeting participation

### Priority 4: SMS Alerts (Optional)
Add Twilio integration for urgent manager notifications

## Troubleshooting

### Agents Not Running?
- Check cron jobs: `SELECT * FROM cron.job;`
- Verify edge functions are deployed
- Check edge function logs in Supabase

### Email Replies Not Appearing?
- Ensure email webhook is configured
- Check email_reply_handler logs
- Verify GEMINI_API_KEY is set

### Voice Commands Not Working?
- Check voice assistant logs
- Verify wake word detection is active
- Ensure microphone permissions granted

### UI Not Updating?
- Check browser console for errors
- Verify Supabase Realtime is connected
- Refresh the page

## API Documentation

### Meeting Voice Agent Endpoints

**Prepare Meeting:**
```typescript
await supabase.functions.invoke('meeting-voice-agent', {
  body: { meetingId: 'uuid', action: 'prepare' }
});
```

**Join Meeting:**
```typescript
await supabase.functions.invoke('meeting-voice-agent', {
  body: { meetingId: 'uuid', action: 'join' }
});
```

**Analyze Transcript:**
```typescript
await supabase.functions.invoke('meeting-voice-agent', {
  body: { 
    meetingId: 'uuid', 
    action: 'analyze_transcript',
    transcript: [...],
    duration: 1200
  }
});
```

**Complete Meeting:**
```typescript
await supabase.functions.invoke('meeting-voice-agent', {
  body: { 
    meetingId: 'uuid', 
    action: 'complete',
    transcript: [...],
    outcome: 'successful'
  }
});
```

## Security & Permissions

All edge functions use RLS policies:
- Email replies: Only accessible by authenticated users
- Agent runs: Public read, restricted write
- Agent actions: Full access for authenticated users
- Meetings: Full access for authenticated users

## Performance Optimization

- Realtime subscriptions are scoped to specific tables
- Agent runs are limited by frequency (cron schedules)
- Database queries use indexes on key fields
- Edge functions use efficient batch operations

## Cost Considerations

**Gemini API Usage:**
- Email sentiment analysis: ~100 tokens per email
- Meeting preparation: ~500 tokens per meeting
- Transcript analysis: ~1000 tokens per analysis

**Supabase:**
- Database storage for logs and transcripts
- Edge function invocations (cron + manual)
- Realtime connections

**Future Integrations:**
- Resend: Email sending costs
- Google Calendar: Free API usage
- Twilio: SMS costs (if implemented)
