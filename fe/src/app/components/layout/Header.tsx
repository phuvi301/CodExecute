import { Bell, Search, Code2, Moon, Sun } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useTheme } from '../shared/ThemeProvider';
import type { Screen } from '../../routes/navigation';

interface HeaderProps {
	currentScreen: Screen;
}

export function Header({ currentScreen }: HeaderProps) {
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();

	const navItemClass = (active: boolean) =>
		`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
			active
				? 'bg-primary text-primary-foreground'
				: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
		}`;

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
						<NavLink to="/problems" className={({ isActive }) => navItemClass(isActive || currentScreen === 'problem-list' || currentScreen === 'problem-editor')}>
							<Code2 className="w-5 h-5" />
							<span>Problems</span>
						</NavLink>
					</nav>

					<div className="flex-1 max-w-md">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search courses, problems, people..."
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
						<Button variant="ghost" size="icon" className="relative">
							<Bell className="w-5 h-5 text-muted-foreground" />
							<span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
						</Button>
						<Avatar className="cursor-pointer" onClick={() => navigate('/profile/john-doe')}>
							<AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>
		</header>
	);
}