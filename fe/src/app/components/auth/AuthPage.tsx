import { useState, FormEvent, useEffect } from 'react';
import { ArrowRight, Code2, Moon, ShieldCheck, Sparkles, Sun, Loader2, AlertCircle, Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../shared/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { sanitizeEmail, validateEmailFormat } from '../../utils/email';
import { sendOtpApi, getOAuthUrlApi } from '../../services/api';

type AuthMode = 'login' | 'register';

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GithubIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const featureItems = [
  {
    title: 'Code reviews built in',
    description: 'Share solutions, discuss tradeoffs, and keep feedback in one place.',
    icon: Code2,
  },
  {
    title: 'Safe by default',
    description: 'Roles, submissions, and authentication patterns are ready to extend.',
    icon: ShieldCheck,
  },
];

function AuthForm({ mode }: { mode: AuthMode }) {
  const isLogin = mode === 'login';
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Verification state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setError(null);
      setOauthLoading(provider);
      const res = await getOAuthUrlApi(provider);
      window.location.href = res.url;
    } catch (err: any) {
      setError(err.message || `Không thể khởi động đăng nhập với ${provider}`);
      setOauthLoading(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validatePasswordStrength = (pass: string) => {
    if (pass.length < 8) return 'Password must contain at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least 1 uppercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least 1 number';
    if (!/[!@#$%^&*(),.?":{}|<>_\-\=\+\[\]\\\/]/.test(pass)) return 'Password must contain at least 1 special character (e.g., !@#$%^&*)';
    return null;
  };

  const handleRequestOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const sanitized = sanitizeEmail(email);
    setEmail(sanitized);

    const emailVal = validateEmailFormat(sanitized);
    if (!emailVal.isValid) {
      setError(emailVal.error || 'Email must be formatted as user@domain.com');
      return;
    }

    if (isLogin) {
      if (!password) {
        setError('Please enter your password');
        return;
      }
      setIsSubmitting(true);
      try {
        await login({ email: sanitized, password });
        navigate('/feed');
      } catch (err: any) {
        setError(err.message || 'Sign in failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Process Register Request: Step 1 Send OTP
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtpApi(sanitized);
      setSuccessMessage(res.message);
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Could not send verification code. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const sanitized = sanitizeEmail(email);
      const res = await sendOtpApi(sanitized);
      setSuccessMessage(res.message);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Could not resend verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const sanitized = sanitizeEmail(email);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: sanitized,
        password,
        full_name: fullName.trim(),
        otp_code: otpCode.trim()
      });
      navigate('/feed');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'otp' && !isLogin) {
    return (
      <form className="space-y-5" onSubmit={handleVerifyAndRegister}>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            A 6-digit verification code has been sent to:
          </p>
          <p className="font-semibold text-foreground break-all">{sanitizeEmail(email)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification Code (6 digits)</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              id="otp-code"
              type="text"
              maxLength={6}
              placeholder="123456"
              className="pl-10 text-center font-mono text-lg tracking-[0.3em] uppercase"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              disabled={isSubmitting}
              autoFocus
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying account...
            </>
          ) : (
            <>
              Verify & Create Account
              <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>

        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            disabled={isSubmitting}
          >
            <ArrowLeft className="size-3" /> Back to edit info
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || isSubmitting}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <form className="space-y-5" onSubmit={handleRequestOTP}>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting || oauthLoading !== null}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@domain.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmail(sanitizeEmail(email))}
            disabled={isSubmitting || oauthLoading !== null}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Required format: user@domain.com (auto lowercased & trimmed)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder={isLogin ? "Enter your password" : "Enter your password"}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting || oauthLoading !== null}
            required
          />
          {!isLogin && (
            <p className="text-[11px] text-muted-foreground">
              Requires at least 8 characters, 1 uppercase letter, 1 number, and 1 special symbol (!@#$%^&*).
            </p>
          )}
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || oauthLoading !== null}
              required
            />
          </div>
        )}

        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting || oauthLoading !== null}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLogin ? 'Signing in...' : 'Sending verification code...'}
            </>
          ) : (
            <>
              {isLogin ? 'Sign in to CodExecute' : 'Send Verification Code'}
              <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Social Login Divider & Buttons placed at the bottom */}
      <div className="relative flex items-center justify-center pt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          OR CONTINUE WITH
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-border/80 bg-background/50 hover:bg-accent hover:text-accent-foreground py-2.5 transition-all"
          disabled={isSubmitting || oauthLoading !== null}
          onClick={() => handleSocialLogin('google')}
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          <span className="text-xs font-semibold">Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-border/80 bg-background/50 hover:bg-accent hover:text-accent-foreground py-2.5 transition-all"
          disabled={isSubmitting || oauthLoading !== null}
          onClick={() => handleSocialLogin('github')}
        >
          {oauthLoading === 'github' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GithubIcon className="size-4" />
          )}
          <span className="text-xs font-semibold">GitHub</span>
        </Button>
      </div>
    </div>
  );
}


export function AuthPage({ mode }: { mode: AuthMode }) {
  const { theme, toggleTheme } = useTheme();
  const isLogin = mode === 'login';

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(26, 35, 126, 0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(0, 188, 212, 0.16), transparent 30%)',
        }}
      />
      <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col gap-10 p-10 lg:flex">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Code2 className="size-6" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  Cod<span className="text-primary">Execute</span>
                </p>
                <p className="text-xs font-medium text-muted-foreground">Build, learn, ship.</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
          </div>

          <div className="max-w-xl space-y-5">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-4 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
                <Sparkles className="size-4" />
                One place for coding practice, sharing, and feedback
              </span>
              <div className="space-y-2">
                <h2 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight text-foreground">
                  Keep your learning flow focused and collaborative.
                </h2>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {featureItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/20">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-0">
          <div className="w-full max-w-xl space-y-6">
            <div className="flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">CodExecute</p>
                  <p className="text-lg font-semibold text-foreground">{isLogin ? 'Sign in' : 'Create account'}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
              </Button>
            </div>

            <Card className="border-border/80 bg-card/90 shadow-2xl shadow-black/10 backdrop-blur-xl">
              <CardContent className="space-y-6 p-8 sm:p-10">
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Sparkles className="size-4" />
                    {isLogin ? 'Welcome back' : 'Join the workspace'}
                  </p>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                      {isLogin ? 'Sign in to continue' : 'Create your CodExecute account'}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {isLogin
                        ? 'Use your email and password to get back to problems and progress.'
                        : 'Set up your account to start solving and reviewing code with your team.'}
                    </p>
                  </div>
                </div>

                <AuthForm mode={mode} />

                <p className="text-center text-sm text-muted-foreground">
                  {isLogin ? 'No account yet?' : 'Already have an account?'}{' '}
                  <Link className="font-semibold text-primary hover:underline" to={isLogin ? '/register' : '/login'}>
                    {isLogin ? 'Create one' : 'Sign in'}
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}