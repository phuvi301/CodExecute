import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemEditorPage } from './pages/ProblemEditorPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { SearchPage } from './pages/SearchPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes - require login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<HomeFeedPage />} />
          <Route path="problems" element={<ProblemListPage />} />
          <Route path="problems/:problemId" element={<ProblemEditorPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="settings" element={<EditProfilePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile/edit" element={<Navigate to="/settings" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}