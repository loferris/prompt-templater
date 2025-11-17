'use client';

import { useState, useEffect } from 'react';
import { SavedPrompt } from '@/src/lib/prompt-history';
import { Card, CardHeader, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { authenticatedFetch } from '@/src/lib/api-client';

export default function HistoryPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const url = filter === 'favorites'
        ? '/api/history/favorites'
        : '/api/history';

      const response = await authenticatedFetch(url);
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authenticatedFetch('/api/history?stats=true');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/history?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      await authenticatedFetch(`/api/history/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });
      loadHistory();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      await authenticatedFetch(`/api/history/${id}`, { method: 'DELETE' });
      loadHistory();
      loadStats();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Prompt History
          </h1>
          <p className="text-lg text-gray-600">
            View and manage your saved prompts
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card padding="sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Prompts</div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.favorites}</div>
                <div className="text-sm text-gray-600">Favorites</div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.recent}</div>
                <div className="text-sm text-gray-600">Last 7 Days</div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Object.keys(stats.byPlatform).length}
                </div>
                <div className="text-sm text-gray-600">Platforms Used</div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                fullWidth
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'favorites' ? 'primary' : 'outline'}
                onClick={() => setFilter('favorites')}
              >
                Favorites
              </Button>
            </div>
          </div>
        </Card>

        {/* Prompts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading prompts...</p>
          </div>
        ) : prompts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No prompts found</p>
              <p className="text-gray-500 mt-2">
                {filter === 'favorites'
                  ? 'You have not favorited any prompts yet'
                  : 'Start creating prompts to see them here'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {prompt.platform.replace('_', ' ')}
                      </span>
                      {prompt.enhanced && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          AI Enhanced
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md mb-2">
                      <p className="text-sm text-gray-800 break-words">{prompt.prompt}</p>
                    </div>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {prompt.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(prompt.id, prompt.isFavorite)}
                      title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {prompt.isFavorite ? '★' : '☆'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(prompt.prompt)}
                    >
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deletePrompt(prompt.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
