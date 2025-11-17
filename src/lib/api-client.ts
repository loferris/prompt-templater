/**
 * Client-side API utilities that automatically include authentication
 */

import { getApiKey } from './session';

/**
 * Authenticated fetch wrapper that automatically includes API key
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Not authenticated. Please log in.');
  }

  const headers = new Headers(options.headers);
  headers.set('X-API-Key', apiKey);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for GET requests
 */
export async function apiGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * Helper for POST requests
 */
export async function apiPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'DELETE' });
}
