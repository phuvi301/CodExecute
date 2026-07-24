import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeFeedPage } from './pages/HomeFeedPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemEditorPage } from './pages/ProblemEditorPage';
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { CourseBuilderPage } from './pages/CourseBuilderPage';
import { GroupsDiscoveryPage } from './pages/GroupsDiscoveryPage';
import { GroupFeedPage } from './pages/GroupFeedPage';
import { UserProfilePage } from './pages/UserProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/problems" replace />} />
        <Route path="feed" element={<HomeFeedPage />} />
        <Route path="problems" element={<ProblemListPage />} />
        <Route path="problems/:problemId" element={<ProblemEditorPage />} />
        <Route path="instructor" element={<InstructorDashboardPage />} />
        <Route path="instructor/course-builder" element={<CourseBuilderPage />} />
        <Route path="groups" element={<GroupsDiscoveryPage />} />
        <Route path="groups/:groupId" element={<GroupFeedPage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/problems" replace />} />
      </Route>
    </Routes>
  );
}