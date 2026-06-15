import { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Header } from './components/Header';
import { InstructorDashboard } from './components/InstructorDashboard';
import { CourseBuilder } from './components/CourseBuilder';
import { HomeFeed } from './components/HomeFeed';
import { UserProfile } from './components/UserProfile';
import { GroupsDiscovery } from './components/GroupsDiscovery';
import { GroupFeed } from './components/GroupFeed';
import { ProblemList } from './components/ProblemList';
import { ProblemEditor } from './components/ProblemEditor';

export type Screen = 
  | 'home-feed'
  | 'instructor-dashboard'
  | 'course-builder'
  | 'user-profile'
  | 'groups-discovery'
  | 'group-feed'
  | 'problem-list'
  | 'problem-editor';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home-feed');
  const [courseBuilderStep, setCourseBuilderStep] = useState(1);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  const navigateTo = (screen: Screen, options?: { problemId?: string; resetCourseBuilder?: boolean }) => {
    setCurrentScreen(screen);
    
    if (options?.problemId) {
      setSelectedProblem(options.problemId);
    }
    
    if (options?.resetCourseBuilder) {
      setCourseBuilderStep(1);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home-feed':
        return <HomeFeed navigateTo={navigateTo} />;
      case 'instructor-dashboard':
        return <InstructorDashboard navigateTo={navigateTo} />;
      case 'course-builder':
        return <CourseBuilder step={courseBuilderStep} setStep={setCourseBuilderStep} navigateTo={navigateTo} />;
      case 'user-profile':
        return <UserProfile navigateTo={navigateTo} />;
      case 'groups-discovery':
        return <GroupsDiscovery navigateTo={navigateTo} />;
      case 'group-feed':
        return <GroupFeed navigateTo={navigateTo} />;
      case 'problem-list':
        return <ProblemList navigateTo={navigateTo} />;
      case 'problem-editor':
        return <ProblemEditor problemId={selectedProblem} navigateTo={navigateTo} />;
      default:
        return <HomeFeed navigateTo={navigateTo} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-gray-900">
        <Header currentScreen={currentScreen} navigateTo={navigateTo} />
        {renderScreen()}
      </div>
    </ThemeProvider>
  );
}
