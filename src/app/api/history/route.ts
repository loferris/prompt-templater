import { NextRequest, NextResponse } from 'next/server';
import {
  getPrompts,
  savePrompt,
  searchPrompts,
  getStats,
} from '@/src/lib/prompt-history';
import { GeneratedPrompt } from '@/src/lib/types';
import { validateRequest } from '@/src/lib/server-session';

/**
 * GET /api/history
 * Get prompt history with optional search
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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');
    const statsOnly = searchParams.get('stats');

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
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    const userId = validation.apiKey; // Use API key as user ID

    const body = await req.json();
    const { prompt, values, platform, parameters, enhanced, templateId, tags } = body;

    // Validate required fields
    if (!prompt || !platform) {
      return NextResponse.json(
        { error: 'prompt and platform are required' },
        { status: 400 }
      );
    }

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
