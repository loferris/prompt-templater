/**
 * Session management utilities for browser-based authentication
 * Uses sessionStorage for temporary session and localStorage for "remember me"
 */

export interface Session {
  apiKey: string;
  createdAt: string;
  expiresAt: string;
}

const SESSION_KEY = 'prompt_builder_session';
const APP_PASSPHRASE_KEY = 'prompt_builder_authenticated';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validate app passphrase (set in environment variable)
 */
export function validateAppPassphrase(passphrase: string): boolean {
  const correctPassphrase = process.env.NEXT_PUBLIC_APP_PASSPHRASE || 'demo-passphrase-2024';
  return passphrase === correctPassphrase;
}

/**
 * Create a new session
 */
export function createSession(apiKey: string, remember: boolean = false): Session {
  const now = new Date();
  const session: Session = {
    apiKey,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION).toISOString(),
  };

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));

  // Mark as authenticated
  storage.setItem(APP_PASSPHRASE_KEY, 'true');

  return session;
}

/**
 * Get current session
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  // Check both storages
  const sessionData = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  const isAuthenticated = sessionStorage.getItem(APP_PASSPHRASE_KEY) || localStorage.getItem(APP_PASSPHRASE_KEY);

  if (!sessionData || !isAuthenticated) return null;

  try {
    const session: Session = JSON.parse(sessionData);

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    clearSession();
    return null;
  }
}

/**
 * Get API key from current session
 */
export function getApiKey(): string | null {
  const session = getSession();
  return session?.apiKey || null;
}

/**
 * Clear session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(APP_PASSPHRASE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(APP_PASSPHRASE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Validate OpenRouter API key format
 */
export function validateApiKeyFormat(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  if (!apiKey.startsWith('sk-or-v1-')) {
    return { valid: false, error: 'Invalid API key format. OpenRouter keys start with "sk-or-v1-"' };
  }

  if (apiKey.length < 20) {
    return { valid: false, error: 'API key is too short' };
  }

  return { valid: true };
}

/**
 * Test API key by making a request to OpenRouter
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return { valid: false, error: 'Unable to verify API key' };
    }
  } catch (error) {
    return { valid: false, error: 'Network error - unable to verify API key' };
  }
}
