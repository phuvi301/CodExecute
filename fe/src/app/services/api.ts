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

