import { NextRequest, NextResponse } from 'next/server';
import { getFavorites } from '@/src/lib/prompt-history';
import { validateRequest } from '@/src/lib/server-session';

/**
 * GET /api/history/favorites
 * Get all favorite prompts
 */
export async function GET(req: NextRequest) {
  try {
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    const userId = validation.apiKey; // Use API key as user ID

    const favorites = await getFavorites(userId);

    return NextResponse.json({ prompts: favorites, total: favorites.length });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
