import { NextRequest, NextResponse } from 'next/server';
import { getFavorites } from '@/src/lib/prompt-history';

/**
 * GET /api/history/favorites
 * Get all favorite prompts
 */
export async function GET(req: NextRequest) {
  try {
    // Get user ID from session when authentication is implemented
    const userId = undefined; // TODO: Get from session

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
