import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { screenFromPathname, screenToPath, type Screen, type NavigateOptions } from './navigation';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = screenFromPathname(location.pathname);

  const navigateTo = (screen: Screen, options?: NavigateOptions) => {
    navigate(screenToPath(screen, options));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentScreen={currentScreen} navigateTo={navigateTo} />
      <Outlet />
    </div>
  );
}