import { NextRequest, NextResponse } from 'next/server';
import {
  getPromptById,
  updatePrompt,
  deletePrompt,
} from '@/src/lib/prompt-history';
import { validateRequest } from '@/src/lib/server-session';

/**
 * GET /api/history/[id]
 * Get a single prompt by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    const prompt = await getPromptById(params.id);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Verify ownership (API key match)
    if (prompt.userId && prompt.userId !== validation.apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/history/[id]
 * Update a prompt (favorite status, tags)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    // Verify ownership before update
    const existingPrompt = await getPromptById(params.id);
    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    if (existingPrompt.userId && existingPrompt.userId !== validation.apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isFavorite, tags } = body;

    const updates: Parameters<typeof updatePrompt>[1] = {};

    if (isFavorite !== undefined) {
      updates.isFavorite = isFavorite;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: 'tags must be an array' },
          { status: 400 }
        );
      }
      updates.tags = tags;
    }

    const updatedPrompt = await updatePrompt(params.id, updates);

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history/[id]
 * Delete a prompt
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    // Verify ownership before delete
    const existingPrompt = await getPromptById(params.id);
    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    if (existingPrompt.userId && existingPrompt.userId !== validation.apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const success = await deletePrompt(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
