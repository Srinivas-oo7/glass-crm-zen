import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const GoogleAuthCallback = () => {
  useEffect(() => {
    // Get the authorization code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      window.close();
      return;
    }

    if (code) {
      // Send the code back to the parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'google-oauth-code', code },
          window.location.origin
        );
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authorization...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
