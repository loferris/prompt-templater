import { NextResponse } from 'next/server';
import { loadTemplateData } from '@/src/lib/data-loader';

export async function GET() {
  try {
    const { platforms } = await loadTemplateData();
    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('[/api/platforms] Error loading platform data:', error);
    return NextResponse.json(
      { error: 'Failed to load platform data' },
      { status: 500 }
    );
  }
}
