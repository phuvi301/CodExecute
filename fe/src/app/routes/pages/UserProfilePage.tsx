import { useParams, Navigate } from 'react-router-dom';
import { UserProfile } from '../../components/community/UserProfile';

export function UserProfilePage() {
  const { userId } = useParams<{ userId?: string }>();

  if (userId === 'edit') {
    return <Navigate to="/settings" replace />;
  }

  return <UserProfile />;
}