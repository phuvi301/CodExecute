import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/button';

export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-6 bg-background">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          This page is reserved for System Administrators. You do not have sufficient permissions to access it.
        </p>
        <Button onClick={() => window.location.href = '/feed'} variant="default">
          Return to Home Feed
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
