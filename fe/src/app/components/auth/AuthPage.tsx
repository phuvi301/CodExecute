import { ArrowRight, Code2, Moon, ShieldCheck, Sparkles, Sun, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../shared/ThemeProvider';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" type="text" placeholder="Enter your full name" autoComplete="name" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter your password" autoComplete={isLogin ? 'current-password' : 'new-password'} />
      </div>

      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" placeholder="Repeat your password" autoComplete="new-password" />
        </div>
      )}

      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {isLogin ? 'Sign in to CodExecute' : 'Create account'}
        <ArrowRight className="size-4" />
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