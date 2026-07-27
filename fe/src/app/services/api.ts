const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  title?: string;
  address?: string;
  bio?: string;
  created_at?: string;
  role: string;
}

export async function loginApi(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || 'Login failed'
      : data.detail || 'Incorrect email or password';
    throw new Error(errorMsg);
  }

  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<{ message: string; user_id: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || 'Registration failed'
      : data.detail || 'Email is already in use or the data is invalid';
    throw new Error(errorMsg);
  }

  return data;
}

export async function getMeApi(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Session expired');
  }

  return data;
}

export interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
  title?: string;
  address?: string;
  bio?: string;
  old_password?: string;
  new_password?: string;
}

export async function updateProfileApi(token: string, payload: UpdateProfilePayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || 'Failed to update profile'
      : data.detail || 'Failed to update profile';
    throw new Error(errorMsg);
  }

  return data;
}

export async function uploadAvatarApi(token: string, file: File): Promise<{ message: string; avatar_url: string; user: UserProfile }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || 'Failed to upload avatar'
      : data.detail || 'Failed to upload avatar';
    throw new Error(errorMsg);
  }

  return data;
}

export interface CommentItem {
  comment_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface PostItem {
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_title?: string;
  content: string;
  type: 'discussion' | 'code-share' | 'achievement';
  code_snippet?: {
    filename?: string;
    language?: string;
    code: string;
    runtime?: string;
    beats?: string;
  };
  achievement?: string;
  tags?: string[];
  created_at: string;
  likes_count: number;
  liked_by?: string[];
  comments: CommentItem[];
}

export interface CreatePostPayload {
  content: string;
  type?: 'discussion' | 'code-share' | 'achievement';
  code_snippet?: {
    filename?: string;
    language?: string;
    code: string;
    runtime?: string;
    beats?: string;
  };
  achievement?: string;
  tags?: string[];
}

export async function getPostsApi(): Promise<PostItem[]> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch posts');
  }
  return data;
}

export async function createPostApi(token: string, payload: CreatePostPayload): Promise<PostItem> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail) ? data.detail[0]?.msg || 'Failed to create post' : data.detail || 'Failed to create post';
    throw new Error(errorMsg);
  }
  return data;
}

export async function addCommentApi(token: string, postId: string, content: string): Promise<PostItem> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail) ? data.detail[0]?.msg || 'Failed to add comment' : data.detail || 'Failed to add comment';
    throw new Error(errorMsg);
  }
  return data;
}

export async function toggleLikePostApi(token: string, postId: string): Promise<PostItem> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to toggle like');
  }
  return data;
}

export async function updatePostApi(token: string, postId: string, content: string): Promise<PostItem> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail) ? data.detail[0]?.msg || 'Failed to update post' : data.detail || 'Failed to update post';
    throw new Error(errorMsg);
  }
  return data;
}

export async function deletePostApi(token: string, postId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to delete post');
  }
}

export async function deleteCommentApi(token: string, postId: string, commentId: string): Promise<PostItem> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to delete comment');
  }
  return data;
}


