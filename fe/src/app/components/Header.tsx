import { Bell, Search, Code2, BookOpen, Users, User, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from './ThemeProvider';
import type { Screen } from '../App';

interface HeaderProps {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
}

export function Header({ currentScreen, navigateTo }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home-feed')}>
            <div className="w-10 h-10 bg-[#1A237E] dark:bg-[#00BCD4] rounded-lg flex items-center justify-center">
              <Code2 className="w-6 h-6 text-[#00BCD4] dark:text-[#1A237E]" />
            </div>
            <span className="text-[#1A237E] dark:text-white">CodeLearn</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigateTo('home-feed')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentScreen === 'home-feed' 
                  ? 'bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Feed</span>
            </button>
            <button
              onClick={() => navigateTo('problem-list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentScreen === 'problem-list' || currentScreen === 'problem-editor' 
                  ? 'bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Code2 className="w-5 h-5" />
              <span>Problems</span>
            </button>
            <button
              onClick={() => navigateTo('instructor-dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentScreen === 'instructor-dashboard' || currentScreen === 'course-builder'
                  ? 'bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Teach</span>
            </button>
            <button
              onClick={() => navigateTo('groups-discovery')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentScreen === 'groups-discovery' || currentScreen === 'group-feed'
                  ? 'bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Groups</span>
            </button>
          </nav>

          {/* Search */}
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

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#00BCD4] rounded-full"></span>
            </Button>
            <Avatar className="cursor-pointer" onClick={() => navigateTo('user-profile')}>
              <AvatarFallback className="bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
