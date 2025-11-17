'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './ui/Button';

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  // Don't show nav on login page
  if (pathname === '/login') {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">AI Prompt Builder</span>
            </Link>
            {isAuthenticated && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  href="/prompt-builder"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive('/prompt-builder')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Build
                </Link>
                <Link
                  href="/templates"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive('/templates')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Templates
                </Link>
                <Link
                  href="/history"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive('/history')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  History
                </Link>
              </div>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
