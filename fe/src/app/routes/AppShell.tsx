import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { ThemeProvider } from '../components/shared/ThemeProvider';
import { screenFromPathname, screenToPath, type Screen, type NavigateOptions } from './navigation';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = screenFromPathname(location.pathname);

  const navigateTo = (screen: Screen, options?: NavigateOptions) => {
    navigate(screenToPath(screen, options));
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-900">
        <Header currentScreen={currentScreen} navigateTo={navigateTo} />
        <Outlet />
      </div>
    </ThemeProvider>
  );
}