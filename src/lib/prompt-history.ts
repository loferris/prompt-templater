import fs from 'fs/promises';
import path from 'path';
import { GeneratedPrompt } from './types';

const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');
const HISTORY_FILE = path.join(HISTORY_DIR, 'prompts.json');

export interface SavedPrompt extends GeneratedPrompt {
  id: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  tags: string[];
}

/**
 * Ensure history directory and file exist
 */
async function ensureHistoryFile(): Promise<void> {
  try {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
    try {
      await fs.access(HISTORY_FILE);
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring history file:', error);
    throw new Error('Failed to initialize prompt history storage');
  }
}

/**
 * Read all prompts from history
 */
async function readHistory(): Promise<SavedPrompt[]> {
  try {
    await ensureHistoryFile();
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

/**
 * Write prompts to history
 */
async function writeHistory(prompts: SavedPrompt[]): Promise<void> {
  try {
    await ensureHistoryFile();
    await fs.writeFile(HISTORY_FILE, JSON.stringify(prompts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing history:', error);
    throw new Error('Failed to save prompt history');
  }
}

/**
 * Save a generated prompt to history
 */
export async function savePrompt(
  prompt: GeneratedPrompt,
  userId?: string,
  tags: string[] = []
): Promise<SavedPrompt> {
  const history = await readHistory();

  const savedPrompt: SavedPrompt = {
    ...prompt,
    id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags,
  };

  history.unshift(savedPrompt);

  // Keep only last 1000 prompts to prevent file from growing too large
  if (history.length > 1000) {
    history.splice(1000);
  }

  await writeHistory(history);
  return savedPrompt;
}

/**
 * Get all prompts for a user (or all if no userId provided)
 */
export async function getPrompts(userId?: string, limit?: number): Promise<SavedPrompt[]> {
  const history = await readHistory();

  let filtered = userId
    ? history.filter(p => p.userId === userId)
    : history;

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: string): Promise<SavedPrompt | null> {
  const history = await readHistory();
  return history.find(p => p.id === id) || null;
}

/**
 * Update a prompt
 */
export async function updatePrompt(
  id: string,
  updates: Partial<Pick<SavedPrompt, 'isFavorite' | 'tags'>>
): Promise<SavedPrompt | null> {
  const history = await readHistory();
  const index = history.findIndex(p => p.id === id);

  if (index === -1) {
    return null;
  }

  history[index] = {
    ...history[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeHistory(history);
  return history[index];
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const history = await readHistory();
  const index = history.findIndex(p => p.id === id);

  if (index === -1) {
    return false;
  }

  history.splice(index, 1);
  await writeHistory(history);
  return true;
}

/**
 * Get favorites
 */
export async function getFavorites(userId?: string): Promise<SavedPrompt[]> {
  const history = await readHistory();

  return history.filter(p =>
    p.isFavorite && (userId ? p.userId === userId : true)
  );
}

/**
 * Search prompts
 */
export async function searchPrompts(
  query: string,
  userId?: string
): Promise<SavedPrompt[]> {
  const history = await readHistory();
  const lowerQuery = query.toLowerCase();

  return history.filter(p => {
    const matchesUser = userId ? p.userId === userId : true;
    const matchesQuery =
      p.prompt.toLowerCase().includes(lowerQuery) ||
      p.values && Object.values(p.values).some(v =>
        v.toLowerCase().includes(lowerQuery)
      ) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

    return matchesUser && matchesQuery;
  });
}

/**
 * Get statistics
 */
export async function getStats(userId?: string): Promise<{
  total: number;
  favorites: number;
  byPlatform: Record<string, number>;
  recent: number;
}> {
  const history = await readHistory();
  const filtered = userId ? history.filter(p => p.userId === userId) : history;

  const byPlatform: Record<string, number> = {};
  filtered.forEach(p => {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
  });

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 7);
  const recent = filtered.filter(p => new Date(p.createdAt) > recentCutoff).length;

  return {
    total: filtered.length,
    favorites: filtered.filter(p => p.isFavorite).length,
    byPlatform,
    recent,
  };
}
