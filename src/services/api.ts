import { API_URL, USE_MOCK_DATA } from '../config/env';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiGet<T>(path: string, mockFallback: () => T): Promise<T> {
  if (USE_MOCK_DATA || !API_URL) {
    return mockFallback();
  }

  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status);
  }
  return (await response.json()) as T;
}
