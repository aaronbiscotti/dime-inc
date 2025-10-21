/**
 * Centralized Fetch Utilities
 * 
 * Provides helper functions for making authenticated API calls with:
 * - Cookie-based authentication (httpOnly secure cookies)
 * - CORS credentials handling
 * - Standard error handling
 */

/**
 * Get common fetch options with credentials for cookie-based auth
 * Cookies are automatically sent with each request (httpOnly, secure)
 */
export function getAuthFetchOptions(additionalOptions: RequestInit = {}): RequestInit {
  return {
    credentials: 'include' as RequestCredentials, // Send httpOnly cookies with requests
    ...additionalOptions,
    headers: {
      'Content-Type': 'application/json',
      ...additionalOptions.headers
    }
  };
}

/**
 * Make an authenticated GET request
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  return fetch(url, getAuthFetchOptions(options));
}

/**
 * Make an authenticated POST request
 */
export async function authPost(url: string, body: unknown, options: RequestInit = {}) {
  return fetch(url, getAuthFetchOptions({
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  }));
}

/**
 * Make an authenticated PUT request
 */
export async function authPut(url: string, body: unknown, options: RequestInit = {}) {
  return fetch(url, getAuthFetchOptions({
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  }));
}

/**
 * Make an authenticated DELETE request
 */
export async function authDelete(url: string, options: RequestInit = {}) {
  return fetch(url, getAuthFetchOptions({
    ...options,
    method: 'DELETE'
  }));
}

/**
 * Handle API response and throw errors if needed
 */
export async function handleApiResponse<T = unknown>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'An error occurred');
  }
  
  return data;
}

