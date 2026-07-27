export type Screen =
  | 'home-feed'
  | 'user-profile'
  | 'problem-list'
  | 'problem-editor'
  | 'settings';

export type NavigateOptions = {
  problemId?: string;
  userId?: string;
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

  if (pathname.startsWith('/settings')) {
    return 'settings';
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
    case 'user-profile':
      return '/profile';
    case 'settings':
      return '/settings';
    default:
      return '/problems';
  }
}