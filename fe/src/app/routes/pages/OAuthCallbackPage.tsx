import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { oauthLogin } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Authenticating account details...');
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const code = searchParams.get('code');
    let provider = searchParams.get('provider') || searchParams.get('state');

    if (!code) {
      setError('OAuth authorization code is missing or expired.');
      return;
    }

    if (!provider || (provider !== 'google' && provider !== 'github')) {
      // Default fallback if provider is not explicitly set in state/query
      provider = 'google';
    }

    const handleOAuth = async () => {
      try {
        setStatusText(`Signing in with ${provider.toUpperCase()} account...`);
        await oauthLogin(provider as 'google' | 'github', code);
        setStatusText('Authentication successful! Redirecting...');
        setTimeout(() => {
          navigate('/feed', { replace: true });
        }, 500);
      } catch (err: any) {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleOAuth();
  }, [searchParams, oauthLogin, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-xl backdrop-blur">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Sign In Failed</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {statusText.includes('successful') ? (
                <CheckCircle2 className="size-8 text-emerald-500 animate-bounce" />
              ) : (
                <Loader2 className="size-8 animate-spin" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">OAuth 2.0 Authentication</h2>
              <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
