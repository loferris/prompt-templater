/**
 * Server-side session utilities
 * Gets API key from request headers sent by the client
 */

import { NextRequest } from 'next/server';

/**
 * Get API key from request headers
 * Client should send the API key in the X-API-Key header
 */
export function getApiKeyFromRequest(req: NextRequest): string | null {
  // Check for API key in header
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return null;
  }

  return apiKey;
}

/**
 * Validate that request has a valid API key
 */
export function validateRequest(req: NextRequest): { valid: boolean; apiKey: string | null; error?: string } {
  const apiKey = getApiKeyFromRequest(req);

  if (!apiKey) {
    return {
      valid: false,
      apiKey: null,
      error: 'No API key provided. Please log in again.',
    };
  }

  if (!apiKey.startsWith('sk-or-v1-')) {
    return {
      valid: false,
      apiKey: null,
      error: 'Invalid API key format',
    };
  }

  return {
    valid: true,
    apiKey,
  };
}
