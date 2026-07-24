import { Bell, Search, Code2, BookOpen, Users, User, Moon, Sun } from 'lucide-react';
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
				? 'bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900'
				: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
		}`;

	return (
		<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between gap-8">
					<button className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
						<div className="w-10 h-10 bg-[#1A237E] dark:bg-[#00BCD4] rounded-lg flex items-center justify-center">
							<Code2 className="w-6 h-6 text-[#00BCD4] dark:text-[#1A237E]" />
						</div>
						<span className="text-[#1A237E] dark:text-white">CodeLearn</span>
					</button>

					<nav className="flex items-center gap-6">
						<NavLink to="/feed" className={({ isActive }) => navItemClass(isActive || currentScreen === 'home-feed')}>
							<Users className="w-5 h-5" />
							<span>Feed</span>
						</NavLink>
						<NavLink to="/problems" className={({ isActive }) => navItemClass(isActive || currentScreen === 'problem-list' || currentScreen === 'problem-editor')}>
							<Code2 className="w-5 h-5" />
							<span>Problems</span>
						</NavLink>
						<NavLink to="/instructor" className={({ isActive }) => navItemClass(isActive || currentScreen === 'instructor-dashboard' || currentScreen === 'course-builder')}>
							<BookOpen className="w-5 h-5" />
							<span>Teach</span>
						</NavLink>
						<NavLink to="/groups" className={({ isActive }) => navItemClass(isActive || currentScreen === 'groups-discovery' || currentScreen === 'group-feed')}>
							<Users className="w-5 h-5" />
							<span>Groups</span>
						</NavLink>
					</nav>

					<div className="flex-1 max-w-md">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
							<Input
								type="text"
								placeholder="Search courses, problems, people..."
								className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleTheme}
							className="text-gray-600 dark:text-gray-300"
						>
							{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
						</Button>
						<Button variant="ghost" size="icon" className="relative">
							<Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
							<span className="absolute top-1 right-1 w-2 h-2 bg-[#00BCD4] rounded-full"></span>
						</Button>
						<Avatar className="cursor-pointer" onClick={() => navigate('/profile/john-doe')}>
							<AvatarFallback className="bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900">JD</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>
		</header>
	);
}