export type Screen =
  | 'home-feed'
  | 'user-profile'
  | 'problem-list'
  | 'problem-editor'
  | 'leaderboard'
  | 'submissions'
  | 'streak'
  | 'settings'
  | 'search'
  | 'admin-dashboard'
  | 'admin-problems'
  | 'admin-problem-form'
  | 'admin-users';

export type NavigateOptions = {
  problemId?: string;
  userId?: string;
  query?: string;
};

export function screenFromPathname(pathname: string): Screen {
  if (pathname.startsWith('/admin/problems')) {
    return pathname.includes('/new') || pathname.includes('/edit') ? 'admin-problem-form' : 'admin-problems';
  }

  if (pathname.startsWith('/admin/users')) {
    return 'admin-users';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin-dashboard';
  }

  if (pathname.startsWith('/feed')) {
    return 'home-feed';
  }

  if (pathname.startsWith('/problems/')) {
    return 'problem-editor';
  }

  if (pathname.startsWith('/problems')) {
    return 'problem-list';
  }

  if (pathname.startsWith('/submissions')) {
    return 'submissions';
  }

  if (pathname.startsWith('/streak')) {
    return 'streak';
  }

  if (pathname.startsWith('/leaderboard')) {
    return 'leaderboard';
  }

  if (pathname.startsWith('/settings')) {
    return 'settings';
  }

  if (pathname.startsWith('/profile')) {
    return 'user-profile';
  }

  if (pathname.startsWith('/search')) {
    return 'search';
  }

  return 'problem-list';
}

export function screenToPath(screen: Screen, options?: NavigateOptions) {
  switch (screen) {
    case 'admin-dashboard':
      return '/admin';
    case 'admin-problems':
      return '/admin/problems';
    case 'admin-problem-form':
      return options?.problemId ? `/admin/problems/${options.problemId}/edit` : '/admin/problems/new';
    case 'admin-users':
      return '/admin/users';
    case 'home-feed':
      return '/feed';
    case 'problem-list':
      return '/problems';
    case 'problem-editor':
      return `/problems/${options?.problemId ?? '1'}`;
    case 'submissions':
      return '/submissions';
    case 'streak':
      return '/streak';
    case 'leaderboard':
      return '/leaderboard';
    case 'user-profile':
      return `/profile/${options?.userId ?? 'me'}`;
    case 'settings':
      return '/settings';
    case 'search':
      return `/search${options?.query ? `?q=${encodeURIComponent(options.query)}` : ''}`;
    default:
      return '/problems';
  }
}
