import { Bell, Search, Code2, Moon, Sun, LogOut, User, Settings, ArrowLeft, Play, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTheme } from '../shared/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { useProblem, PROBLEMS_LIST } from '../../context/ProblemContext';
import type { Screen } from '../../routes/navigation';

interface HeaderProps {
	currentScreen: Screen;
	navigateTo?: (screen: Screen, options?: any) => void;
}

export function Header({ currentScreen }: HeaderProps) {
	const { theme, toggleTheme } = useTheme();
	const { user, isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();
	const profileUrl = user?.user_id ? `/profile/${user.user_id}` : '/profile';

	const { problem, language, setLanguage, runCode, submitCode, isRunning, isSubmitting } = useProblem();

	const navItemClass = (active: boolean) =>
		`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
			active
				? 'bg-primary text-primary-foreground'
				: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
		}`;

	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const currentIndex = PROBLEMS_LIST.findIndex((p) => p.id === (problem?.id || '1'));
	const handlePrevProblem = () => {
		const prevIndex = (currentIndex - 1 + PROBLEMS_LIST.length) % PROBLEMS_LIST.length;
		navigate(`/problems/${PROBLEMS_LIST[prevIndex].id}`);
	};

	const handleNextProblem = () => {
		const nextIndex = (currentIndex + 1) % PROBLEMS_LIST.length;
		navigate(`/problems/${PROBLEMS_LIST[nextIndex].id}`);
	};

	const isProblemEditor = currentScreen === 'problem-editor';

	if (isProblemEditor) {
		return (
			<header className="sticky top-0 z-50 h-14 border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
				<div className="w-full h-full px-4 flex items-center justify-between gap-4">
					{/* Left Section: Logo & Problem Info */}
					<div className="flex items-center gap-3 overflow-hidden">
						<button className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => navigate('/feed')}>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-transform group-hover:scale-105">
								<Code2 className="w-4 h-4" />
							</div>
							<span className="text-base font-bold tracking-tight text-foreground hidden sm:inline">
								Cod<span className="text-primary">Execute</span>
							</span>
						</button>

						<div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

						<Button
							variant="ghost"
							size="sm"
							className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-2 text-xs font-medium shrink-0"
							onClick={() => navigate('/problems')}
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Problems</span>
						</Button>

						<div className="flex items-center gap-0.5 shrink-0">
							<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handlePrevProblem} title="Previous problem">
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleNextProblem} title="Next problem">
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>

						<div className="h-4 w-px bg-border shrink-0" />

						<div className="flex items-center gap-2 truncate">
							<span className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-[250px] md:max-w-[350px]">
								{problem.id}. {problem.title}
							</span>
							<Badge
								variant="outline"
								className={`shrink-0 text-xs px-2 py-0.5 font-medium border ${
									problem.difficulty === 'Easy'
										? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
										: problem.difficulty === 'Medium'
										? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
										: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
								}`}
							>
								{problem.difficulty}
							</Badge>
						</div>
					</div>

					{/* Center Section: Code Actions */}
					<div className="flex items-center gap-2 shrink-0">
						<Select value={language} onValueChange={setLanguage}>
							<SelectTrigger className="h-8 w-32 bg-background border-border text-xs font-medium focus:ring-1 focus:ring-primary">
								<SelectValue placeholder="Language" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="javascript">JavaScript</SelectItem>
								<SelectItem value="python">Python</SelectItem>
								<SelectItem value="cpp">C++</SelectItem>
								<SelectItem value="java">Java</SelectItem>
							</SelectContent>
						</Select>

						<Button
							variant="outline"
							size="sm"
							onClick={runCode}
							disabled={isRunning || isSubmitting}
							className="h-8 gap-1.5 text-xs font-medium border-border bg-background hover:bg-accent text-foreground"
						>
							<Play className={`w-3.5 h-3.5 text-emerald-500 ${isRunning ? 'animate-spin' : ''}`} />
							<span>{isRunning ? 'Running...' : 'Run'}</span>
						</Button>

						<Button
							size="sm"
							onClick={submitCode}
							disabled={isRunning || isSubmitting}
							className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20"
						>
							<Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
							<span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
						</Button>
					</div>

					{/* Right Section: Utilities & User */}
					<div className="flex items-center gap-2 shrink-0">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							className="h-8 w-8 text-muted-foreground"
						>
							{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
						</Button>

						{isAuthenticated ? (
							<>
								<Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground">
									<Bell className="w-4 h-4" />
									<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="flex items-center gap-2 rounded-full ring-2 ring-primary/20 transition-all hover:ring-primary/40 focus:outline-none cursor-pointer">
											<Avatar className="h-8 w-8">
												<AvatarImage src={user?.avatar_url} alt={user?.full_name} />
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
													{getInitials(user?.full_name)}
												</AvatarFallback>
											</Avatar>
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" sideOffset={12} className="w-72 p-3 rounded-2xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl space-y-1">
										<DropdownMenuLabel
											className="font-normal p-2 cursor-pointer hover:bg-accent/50 rounded-xl transition-colors"
											onClick={() => navigate(profileUrl)}
										>
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarImage src={user?.avatar_url} alt={user?.full_name} />
													<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-base">
														{getInitials(user?.full_name)}
													</AvatarFallback>
												</Avatar>
												<div className="flex flex-col space-y-0.5 overflow-hidden">
													<p className="text-sm font-semibold leading-tight text-foreground truncate">
														{user?.full_name || 'User'}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{user?.email || 'user@codexecute.dev'}
													</p>
													<span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
														{user?.role || 'User'}
													</span>
												</div>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator className="my-2" />
										<DropdownMenuGroup className="space-y-1">
											<DropdownMenuItem
												className="cursor-pointer gap-3 p-2 rounded-xl font-medium text-foreground hover:bg-accent transition-colors"
												onClick={() => navigate(profileUrl)}
											>
												<User className="h-4 w-4 text-muted-foreground" />
												<span>Profile</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer gap-3 p-2 rounded-xl font-medium text-foreground hover:bg-accent transition-colors"
												onClick={() => navigate('/settings')}
											>
												<Settings className="h-4 w-4 text-muted-foreground" />
												<span>Settings</span>
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator className="my-2" />
										<DropdownMenuItem
											variant="destructive"
											className="cursor-pointer gap-3 p-2 rounded-xl font-medium text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 transition-colors"
											onClick={() => {
												logout();
												navigate('/login');
											}}
										>
											<LogOut className="h-4 w-4 text-destructive" />
											<span>Log Out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
									Sign In
								</Button>
								<Button size="sm" onClick={() => navigate('/register')}>
									Sign Up
								</Button>
							</div>
						)}
					</div>
				</div>
			</header>
		);
	}

	// Standard Header for non-problem-editor pages
	return (
		<header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between gap-8">
					<button className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/feed')}>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
							<Code2 className="w-6 h-6" />
						</div>
						<span className="text-xl font-bold tracking-tight text-foreground">
							Cod<span className="text-primary">Execute</span>
						</span>
					</button>

					<nav className="flex items-center gap-6">
						<NavLink to="/feed" className={({ isActive }) => navItemClass(isActive || currentScreen === 'home-feed')}>
							<Bell className="w-5 h-5" />
							<span>Feed</span>
						</NavLink>
						<NavLink to="/problems" className={({ isActive }) => navItemClass(isActive || currentScreen === 'problem-list')}>
							<Code2 className="w-5 h-5" />
							<span>Problems</span>
						</NavLink>
					</nav>

					<div className="flex-1 max-w-md">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search"
								className="pl-10 bg-input-background border-border text-foreground placeholder:text-muted-foreground"
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							className="text-muted-foreground"
						>
							{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
						</Button>

						{isAuthenticated ? (
							<>
								<Button variant="ghost" size="icon" className="relative">
									<Bell className="w-5 h-5 text-muted-foreground" />
									<span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="flex items-center gap-2 rounded-full ring-2 ring-primary/20 transition-all hover:ring-primary/40 focus:outline-none cursor-pointer">
											<Avatar className="h-10 w-10">
												<AvatarImage src={user?.avatar_url} alt={user?.full_name} />
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-base">
													{getInitials(user?.full_name)}
												</AvatarFallback>
											</Avatar>
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" sideOffset={32} className="w-72 p-3 rounded-2xl border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl space-y-1">
										<DropdownMenuLabel
											className="font-normal p-2 cursor-pointer hover:bg-accent/50 rounded-xl transition-colors"
											onClick={() => navigate(profileUrl)}
										>
											<div className="flex items-center gap-3">
												<Avatar className="h-11 w-11">
													<AvatarImage src={user?.avatar_url} alt={user?.full_name} />
													<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
														{getInitials(user?.full_name)}
													</AvatarFallback>
												</Avatar>
												<div className="flex flex-col space-y-0.5 overflow-hidden">
													<p className="text-sm font-semibold leading-tight text-foreground truncate">
														{user?.full_name || 'User'}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{user?.email || 'user@codexecute.dev'}
													</p>
													<span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
														{user?.role || 'User'}
													</span>
												</div>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator className="my-2" />
										<DropdownMenuGroup className="space-y-1">
											<DropdownMenuItem
												className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium text-foreground hover:bg-accent transition-colors"
												onClick={() => navigate(profileUrl)}
											>
												<User className="h-4 w-4 text-muted-foreground" />
												<span>Profile</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium text-foreground hover:bg-accent transition-colors"
												onClick={() => navigate('/settings')}
											>
												<Settings className="h-4 w-4 text-muted-foreground" />
												<span>Settings</span>
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator className="my-2" />
										<DropdownMenuItem
											variant="destructive"
											className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 transition-colors"
											onClick={() => {
												logout();
												navigate('/login');
											}}
										>
											<LogOut className="h-4 w-4 text-destructive" />
											<span>Log Out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<div className="flex items-center gap-2">
								<Button variant="ghost" onClick={() => navigate('/login')}>
									Sign In
								</Button>
								<Button onClick={() => navigate('/register')}>
									Sign Up
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}