export type Screen =
  | 'home-feed'
  | 'instructor-dashboard'
  | 'course-builder'
  | 'user-profile'
  | 'groups-discovery'
  | 'group-feed'
  | 'problem-list'
  | 'problem-editor';

export type NavigateOptions = {
  problemId?: string;
  groupId?: string;
  userId?: string;
  resetCourseBuilder?: boolean;
};

export function screenFromPathname(pathname: string): Screen {
  if (pathname.startsWith('/feed')) {
    return 'home-feed';
  }

  if (pathname.startsWith('/problems/')) {
    return 'problem-editor';
  }

  if (pathname.startsWith('/problems')) {
    return 'problem-list';
  }

  if (pathname.startsWith('/instructor/course-builder')) {
    return 'course-builder';
  }

  if (pathname.startsWith('/instructor')) {
    return 'instructor-dashboard';
  }

  if (pathname.startsWith('/groups/')) {
    return 'group-feed';
  }

  if (pathname.startsWith('/groups')) {
    return 'groups-discovery';
  }

  if (pathname.startsWith('/profile')) {
    return 'user-profile';
  }

  return 'problem-list';
}

export function screenToPath(screen: Screen, options?: NavigateOptions) {
  switch (screen) {
    case 'home-feed':
      return '/feed';
    case 'problem-list':
      return '/problems';
    case 'problem-editor':
      return `/problems/${options?.problemId ?? '1'}`;
    case 'instructor-dashboard':
      return '/instructor';
    case 'course-builder':
      return '/instructor/course-builder';
    case 'user-profile':
      return `/profile/${options?.userId ?? 'john-doe'}`;
    case 'groups-discovery':
      return '/groups';
    case 'group-feed':
      return `/groups/${options?.groupId ?? 'react-developers'}`;
    default:
      return '/problems';
  }
}