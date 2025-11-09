# Setting Up Real Google Meet Links

This guide explains how to set up real Google Meet link generation for meetings.

## Current Implementation

Currently, the system generates **realistic-looking Google Meet links** like:
- `https://meet.google.com/abc-defg-hij`

These links follow Google Meet's format but are **not actual active meeting rooms**.

## To Get Real Google Meet Links

You need to complete the Google Calendar API OAuth setup:

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Calendar API
   - Google Meet API (if available)

### Step 2: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   ```
   https://lxnsgbwscjwhcjvmyqim.supabase.co/functions/v1/google-calendar-sync
   ```
5. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Secrets

The secrets `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are already configured in your Supabase project.

### Step 4: Implement OAuth Flow

The `google-calendar-sync` edge function handles:
- OAuth authorization URL generation
- Code exchange for access tokens
- Calendar event creation with Google Meet links
- Token storage in `manager_profile` table

### Step 5: User Authorization

When a user clicks "Create Meet Link":
1. They're redirected to Google for authorization
2. They grant calendar access
3. The app receives an authorization code
4. The code is exchanged for an access token
5. The access token is used to create calendar events

## How It Works

```typescript
// 1. Get auth URL
const { data } = await supabase.functions.invoke('google-calendar-sync', {
  body: { action: 'get_auth_url' }
});

// 2. Redirect user to Google
window.location.href = data.authUrl;

// 3. After authorization, exchange code
const { data: tokens } = await supabase.functions.invoke('google-calendar-sync', {
  body: { action: 'exchange_code', code: authCode }
});

// 4. Create calendar event
const { data: event } = await supabase.functions.invoke('google-calendar-sync', {
  body: { 
    action: 'create_event', 
    meetingId: 'xxx',
    accessToken: tokens.access_token 
  }
});

// event.hangoutLink contains the real Google Meet link
```

## Database Schema

The `manager_profile` table stores:
```sql
calendar_sync_token: jsonb  -- Stores refresh_token and access_token
```

## Testing Locally

For local testing without full OAuth:
1. The system generates format-compliant Meet links
2. These won't create actual meeting rooms
3. Use for UI/UX testing and demos

## Production Setup Checklist

- [ ] Google Cloud project created
- [ ] Calendar API enabled
- [ ] OAuth credentials created
- [ ] Redirect URI configured
- [ ] Client ID and Secret added to Supabase
- [ ] OAuth flow tested
- [ ] Token refresh implemented
- [ ] Error handling for expired tokens

## Security Notes

- **Never expose** Client Secret in frontend code
- **Always** exchange tokens on the backend
- **Implement** token refresh logic
- **Validate** all API responses
- **Handle** OAuth errors gracefully

## Limitations

- Requires user authorization for each Google account
- Tokens expire and need refresh
- Calendar API has rate limits
- Meet links created through Calendar API only

## Alternative: Direct Meet API

Google also offers a direct Meet API, but it requires:
- Google Workspace account
- Meet API enabled
- Different OAuth scopes
- Additional setup

For most use cases, the Calendar API approach (creating events with Meet links) is simpler and more reliable.

## Support

For issues:
1. Check edge function logs: `supabase functions logs google-calendar-sync`
2. Verify OAuth credentials in Google Cloud Console
3. Test redirect URI matches exactly
4. Review Google Calendar API quotas
