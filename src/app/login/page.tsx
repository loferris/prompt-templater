'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { validateAppPassphrase, validateApiKeyFormat, testApiKey } from '@/src/lib/session';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/src/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [passphrase, setPassphrase] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'passphrase' | 'apikey'>('passphrase');

  const handlePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAppPassphrase(passphrase)) {
      setError('Incorrect passphrase. Please try again.');
      return;
    }

    setStep('apikey');
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate format first
    const formatValidation = validateApiKeyFormat(apiKey);
    if (!formatValidation.valid) {
      setError(formatValidation.error || 'Invalid API key');
      setLoading(false);
      return;
    }

    // Test the API key
    const testResult = await testApiKey(apiKey);
    if (!testResult.valid) {
      setError(testResult.error || 'Invalid API key');
      setLoading(false);
      return;
    }

    // Create session
    login(apiKey, remember);
    setLoading(false);

    // Redirect to home
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader
          title="Welcome to AI Prompt Builder"
          description={
            step === 'passphrase'
              ? 'Enter the app passphrase to continue'
              : 'Enter your OpenRouter API key'
          }
        />
        <CardContent>
          {step === 'passphrase' ? (
            <form onSubmit={handlePassphraseSubmit} className="space-y-4">
              <Input
                type="password"
                label="App Passphrase"
                placeholder="Enter passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                error={error}
                fullWidth
                autoFocus
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>First time?</strong> The default passphrase is set in your environment variables.
                  Check <code className="bg-blue-100 px-1 rounded">.env.local</code> for <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_APP_PASSPHRASE</code>
                </p>
              </div>

              <Button type="submit" fullWidth>
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <Input
                type="password"
                label="OpenRouter API Key"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={error}
                helperText="Your API key is stored locally and never sent to our servers"
                fullWidth
                autoFocus
              />

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me (keep me logged in)
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Don't have an API key?</strong><br />
                  Get one at{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('passphrase');
                    setError('');
                  }}
                >
                  Back
                </Button>
                <Button type="submit" loading={loading} fullWidth>
                  {loading ? 'Verifying...' : 'Login'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• App passphrase prevents unauthorized access</li>
              <li>• Your API key is used for all AI requests</li>
              <li>• History and favorites are tied to your API key</li>
              <li>• All data is stored locally in your browser</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
