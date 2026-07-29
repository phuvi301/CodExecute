import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemEditorPage } from './pages/ProblemEditorPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { SearchPage } from './pages/SearchPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SubmissionHistoryPage } from './pages/SubmissionHistoryPage';
import { StreakPage } from './pages/StreakPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProblemsPage } from './pages/AdminProblemsPage';
import { AdminProblemFormPage } from './pages/AdminProblemFormPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      
      {/* Protected Routes - require login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<HomeFeedPage />} />
          <Route path="problems" element={<ProblemListPage />} />
          <Route path="problems/:problemId" element={<ProblemEditorPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="submissions" element={<SubmissionHistoryPage />} />
          <Route path="streak" element={<StreakPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="settings" element={<EditProfilePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile/edit" element={<Navigate to="/settings" replace />} />

          {/* Admin Routes - require Admin role */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/problems" element={<AdminProblemsPage />} />
            <Route path="admin/problems/new" element={<AdminProblemFormPage />} />
            <Route path="admin/problems/:problemId/edit" element={<AdminProblemFormPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}