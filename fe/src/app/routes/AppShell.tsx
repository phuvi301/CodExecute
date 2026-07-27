import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { screenFromPathname, screenToPath, type Screen, type NavigateOptions } from './navigation';
import { ProblemProvider } from '../context/ProblemContext';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScreen = screenFromPathname(location.pathname);

  const navigateTo = (screen: Screen, options?: NavigateOptions) => {
    navigate(screenToPath(screen, options));
  };

  return (
    <ProblemProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header currentScreen={currentScreen} navigateTo={navigateTo} />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </ProblemProvider>
  );
}