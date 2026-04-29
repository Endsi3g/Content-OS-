import { toast } from 'sonner';
import { auth } from './firebase';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (data && typeof data === 'object' && data.error) || data?.message || response.statusText || 'An unexpected error occurred';
    console.error(`API Error [${response.status}]:`, message);

    if (response.status === 401) {
      toast.error('Session expired. Please log in again.');
    } else if (response.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (response.status >= 500) {
      toast.error('Server error. Our team has been notified.');
    } else {
      toast.error(message);
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export const api = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      toast.error(message);
      throw error;
    }
  },

  async post<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      toast.error(message);
      throw error;
    }
  },

  async patch<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      toast.error(message);
      throw error;
    }
  },

  async put<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      toast.error(message);
      throw error;
    }
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      toast.error(message);
      throw error;
    }
  },
};
