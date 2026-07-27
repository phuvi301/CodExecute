import { useParams, Navigate } from 'react-router-dom';
import { UserProfile } from '../../components/community/UserProfile';
import { useAuth } from '../../context/AuthContext';

export function UserProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();

  if (userId === 'edit') {
    return <Navigate to="/settings" replace />;
  }

  if (!userId) {
    const targetUserId = user?.user_id || 'me';
    return <Navigate to={`/profile/${targetUserId}`} replace />;
  }

  if (userId === 'me' && user?.user_id) {
    return <Navigate to={`/profile/${user.user_id}`} replace />;
  }

  return <UserProfile />;
}