# Gemini Live & Google Calendar Integration Setup

This document explains the new real-time voice calling and Google Calendar integration features.

## Features Implemented

### 1. Gemini Live Voice Calls
Real-time voice conversations with leads using Google's Gemini Live API:
- **Two-way audio streaming** at 16kHz PCM format
- **Natural conversation flow** with AI agent
- **Function calling support** for alerting managers
- **Real-time transcription** of conversations
- **Automatic audio queue management** for smooth playback

### 2. Google Calendar Integration
Seamless calendar synchronization:
- **OAuth2 authentication** with Google Calendar API
- **Automatic event creation** with Google Meet links
- **Meeting invitations** sent to leads
- **Calendar sync button** in Active Meetings view

## How It Works

### Live Voice Call Flow

1. **Meeting Creation**: Create or schedule a meeting with a lead
2. **AI Preparation**: AI agent generates talking points and objection responses
3. **Live Call Start**: Manager clicks "Join Live Call" to start Gemini Live session
4. **Real-time Conversation**: 
   - AI agent speaks naturally with the lead
   - Audio is streamed bidirectionally
   - Manager can listen and take over if needed
5. **Manager Alert**: If conversation goes poorly, AI can alert manager
6. **Call Summary**: AI generates meeting summary and next steps

### Google Calendar Sync Flow

1. **Authorization**: Click "Sync Calendar" to authorize Google Calendar access
2. **OAuth Flow**: Authenticate with your Google account
3. **Event Creation**: Calendar event is automatically created with:
   - Meeting title and description
   - Lead email as attendee
   - Google Meet link
   - 30-minute duration
4. **Update Meeting**: Google Meet link is saved to the meeting record

## Edge Functions

### `gemini-live-session`
- Creates Gemini Live session for real-time voice
- Generates system instructions based on lead context
- Returns API configuration for WebSocket connection

### `google-calendar-sync`
- Handles OAuth2 flow for Google Calendar
- Creates calendar events with Google Meet links
- Manages access token exchange and storage

### `meeting-voice-agent`
- Prepares AI agent with talking points
- Handles meeting join/leave events
- Analyzes transcripts for sentiment and confidence
- Triggers manager alerts when needed

## Components

### `GeminiLiveVoice`
Main component for live voice calls:
- Manages WebSocket connection to Gemini Live
- Handles audio recording and playback
- Displays call duration and controls
- Shows conversation log

### `LiveMeetingDemo`
Dedicated page for live voice meetings:
- Full-screen call interface
- Meeting context display
- Call controls (mute, end call)

### `ActiveMeetingsView`
Updated to include:
- "Join Live Call" button for in-progress meetings
- "Sync Calendar" button for Google Calendar integration
- Real-time updates via Supabase realtime

## Setup Instructions

### 1. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth2 credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add your Supabase function URL
5. Copy Client ID and Client Secret
6. Add them as secrets: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 2. Gemini API Setup

1. Ensure `GEMINI_API_KEY` is configured in Supabase secrets
2. The key must have access to Gemini 2.0 Flash model
3. API should have quota for real-time streaming

### 3. Required Secrets

The following secrets must be configured:
- ✅ `GEMINI_API_KEY` - For Gemini Live API
- ✅ `GOOGLE_CLIENT_ID` - For Google Calendar OAuth
- ✅ `GOOGLE_CLIENT_SECRET` - For Google Calendar OAuth
- ✅ `SUPABASE_URL` - Auto-configured
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

## Usage

### Starting a Live Call

1. Navigate to Active Meetings
2. Find an in-progress meeting
3. Click "Join Live Call"
4. Allow microphone access when prompted
5. Click "Start Live Call"
6. Speak naturally - the AI will respond in real-time

### Syncing with Google Calendar

1. Click "Sync Calendar" on any meeting
2. Authorize Google Calendar access (first time only)
3. Calendar event is created automatically
4. Google Meet link is added to the meeting

## Technical Details

### Audio Format
- **Input**: 16kHz, 16-bit PCM, mono
- **Output**: 16kHz, 16-bit PCM, mono
- **Encoding**: Base64 for transmission

### WebSocket Protocol
- **Endpoint**: `wss://generativelanguage.googleapis.com/ws/...`
- **Format**: JSON messages with audio data
- **Reconnection**: Automatic on disconnect

### Function Calling
AI can call these functions:
- `alert_manager`: Request manager intervention
- `schedule_followup`: Set next meeting

## Troubleshooting

### No Audio
- Check microphone permissions
- Ensure browser supports Web Audio API
- Verify GEMINI_API_KEY has correct permissions

### Calendar Sync Fails
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure Calendar API is enabled in Google Cloud

### WebSocket Connection Issues
- Check network connectivity
- Verify Gemini API quota
- Look for CORS errors in console

## Next Steps

Potential enhancements:
- **Screen sharing** during live calls
- **Call recording** and playback
- **Multi-party calls** with manager and lead
- **Calendar event editing** and cancellation
- **Automated follow-up scheduling** via AI
- **Integration with other calendar systems** (Outlook, etc.)
