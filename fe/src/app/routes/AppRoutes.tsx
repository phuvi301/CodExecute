import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemEditorPage } from './pages/ProblemEditorPage';
import { UserProfilePage } from './pages/UserProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/problems" replace />} />
        <Route path="feed" element={<HomeFeedPage />} />
        <Route path="problems" element={<ProblemListPage />} />
        <Route path="problems/:problemId" element={<ProblemEditorPage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/problems" replace />} />
      </Route>
    </Routes>
  );
}