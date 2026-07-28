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
import { sendOtpApi } from '../../services/api';

type AuthMode = 'login' | 'register';

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
    if (pass.length < 8) return 'Mật khẩu phải chứa ít nhất 8 ký tự';
    if (!/[A-Z]/.test(pass)) return 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa';
    if (!/[0-9]/.test(pass)) return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    if (!/[!@#$%^&*(),.?":{}|<>_\-\=\+\[\]\\\/]/.test(pass)) return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (e.g., !@#$%^&*)';
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
      setError(emailVal.error || 'Email không đúng định dạng dạng user@domain.com');
      return;
    }

    if (isLogin) {
      if (!password) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }
      setIsSubmitting(true);
      try {
        await login({ email: sanitized, password });
        navigate('/feed');
      } catch (err: any) {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Process Register Request: Step 1 Send OTP
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
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
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
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
      setError(err.message || 'Không thể gửi lại mã OTP');
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
      setError('Vui lòng nhập đủ 6 chữ số mã OTP');
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
      setError(err.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại.');
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
            Mã xác minh 6 chữ số đã được gửi tới email:
          </p>
          <p className="font-semibold text-foreground break-all">{sanitizeEmail(email)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp-code">Mã xác thực OTP (6 chữ số)</Label>
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
              Đang xác thực tài khoản...
            </>
          ) : (
            <>
              Xác thực & Tạo tài khoản
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
            <ArrowLeft className="size-3" /> Quay lại sửa thông tin
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || isSubmitting}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã OTP'}
          </button>
        </div>
      </form>
    );
  }

  return (
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Định dạng yêu cầu: user@domain.com (tự động hạ chữ thường & xóa khoảng trắng)
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
          disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isLogin ? 'Signing in...' : 'Đang gửi mã OTP...'}
          </>
        ) : (
          <>
            {isLogin ? 'Sign in to CodExecute' : 'Gửi mã OTP xác thực'}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
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