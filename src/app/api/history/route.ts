import { NextRequest, NextResponse } from 'next/server';
import {
  getPrompts,
  savePrompt,
  searchPrompts,
  getStats,
} from '@/src/lib/prompt-history';
import { GeneratedPrompt } from '@/src/lib/types';

/**
 * GET /api/history
 * Get prompt history with optional search
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');
    const statsOnly = searchParams.get('stats');

    // Get user ID from session when authentication is implemented
    const userId = undefined; // TODO: Get from session

    if (statsOnly === 'true') {
      const stats = await getStats(userId);
      return NextResponse.json({ stats });
    }

    let prompts;
    if (query) {
      prompts = await searchPrompts(query, userId);
    } else {
      prompts = await getPrompts(userId, limit ? parseInt(limit) : undefined);
    }

    return NextResponse.json({ prompts, total: prompts.length });
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/history
 * Save a new prompt to history
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, values, platform, parameters, enhanced, templateId, tags } = body;

    // Validate required fields
    if (!prompt || !platform) {
      return NextResponse.json(
        { error: 'prompt and platform are required' },
        { status: 400 }
      );
    }

    // Get user ID from session when authentication is implemented
    const userId = undefined; // TODO: Get from session

    const generatedPrompt: GeneratedPrompt = {
      templateId: templateId || 'custom',
      platform,
      prompt,
      parameters,
      values: values || {},
      enhanced,
      timestamp: new Date().toISOString(),
    };

    const savedPrompt = await savePrompt(generatedPrompt, userId, tags || []);

    return NextResponse.json({ prompt: savedPrompt }, { status: 201 });
  } catch (error) {
    console.error('Error saving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}
