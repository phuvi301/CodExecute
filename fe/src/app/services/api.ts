const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// --- RUNTIME TOKEN STORAGE (Biến lưu ở RAM, không dùng localStorage) ---
let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

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
  can_edit?: boolean;
  can_follow?: boolean;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
}

// --- TỰ ĐỘNG REFRESH TOKEN VÀ GỬI REQUEST CÓ AUTHENTICATION ---
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  // 1. Nếu runtime chưa có accessToken, thử silent refresh bằng cookie refreshToken
  if (!token) {
    try {
      const res = await refreshApi();
      token = res.access_token;
    } catch {
      // Không có cookie hoặc refreshToken hết hạn
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  options.headers = headers;
  options.credentials = 'include';

  let response = await fetch(url, options);

  // 2. Nếu accessToken mất hoặc hết hạn (HTTP 401), tự động gọi refresh token mới
  if (response.status === 401) {
    try {
      const refreshRes = await refreshApi();
      const newToken = refreshRes.access_token;

      const newHeaders = new Headers(options.headers || {});
      newHeaders.set('Authorization', `Bearer ${newToken}`);
      options.headers = newHeaders;

      // Retry lại API request gốc với accessToken vừa cấp mới
      response = await fetch(url, options);
    } catch {
      clearAccessToken();
    }
  }

  return response;
}

// --- API AUTHENTICATION ---

export async function loginApi(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Để trình duyệt lưu HTTP-only refreshToken cookie từ server
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || 'Login failed'
      : data.detail || 'Incorrect email or password';
    throw new Error(errorMsg);
  }

  setAccessToken(data.access_token);
  return data;
}

export async function refreshApi(): Promise<AuthTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Gửi HTTP-only refreshToken cookie lên backend
  });

  const data = await response.json();

  if (!response.ok) {
    clearAccessToken();
    throw new Error(data.detail || 'Phiên đăng nhập đã hết hạn');
  }

  setAccessToken(data.access_token);
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Lỗi đăng xuất:', err);
  } finally {
    clearAccessToken();
  }
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

export async function getProfileApi(userId: string): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Không thể lấy thông tin trang cá nhân');
  }

  return data;
}

export async function followUserApi(userId: string): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Không thể follow người dùng');
  }

  return data;
}

export async function unfollowUserApi(userId: string): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}/unfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Không thể bỏ follow người dùng');
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

export async function updateProfileApi(_token: string, payload: UpdateProfilePayload): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
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

export async function uploadAvatarApi(_token: string, file: File): Promise<{ message: string; avatar_url: string; user: UserProfile }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAuth(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
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


// --- SUBMISSIONS & RUN CODE APIs ---

export interface RunCodePayload {
  problem_id: string;
  language: string;
  code: string;
}

export interface RunCodeResponse {
  status: string;
  execution_time: number;
  memory_used: number;
  passed_testcases: number;
  total_testcases: number;
  error_message: string;
  testcases?: Array<{ testcase_id?: string; input: string; output: string }>;
  is_run_only: boolean;
}

export interface SubmissionResponseData {
  submission_id: string;
  user_id: string;
  problem_id: string;
  language: string;
  code: string;
  status: string;
  execution_time: number;
  memory_used: number;
  passed_testcases: number;
  total_testcases: number;
  error_message: string;
  submitted_at: string;
}

export async function runCodeApi(payload: RunCodePayload, _token?: string): Promise<RunCodeResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/submissions/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Lỗi khi chạy thử code');
  }

  return data;
}

export async function submitCodeApi(payload: RunCodePayload, _token?: string): Promise<SubmissionResponseData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Lỗi khi nộp bài');
  }

  return data;
}

export async function getSubmissionResultApi(submissionId: string, _token?: string): Promise<SubmissionResponseData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/submissions/${submissionId}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Lỗi lấy kết quả bài nộp');
  }

  return data;
}

export async function getMySubmissionsApi(problemId?: string): Promise<SubmissionResponseData[]> {
  const url = problemId
    ? `${API_BASE_URL}/submissions/me?problem_id=${encodeURIComponent(problemId)}`
    : `${API_BASE_URL}/submissions/me`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Lỗi khi lấy danh sách bài nộp');
  }

  return data;
}

