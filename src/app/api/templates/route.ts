
import { NextResponse } from 'next/server';
import { loadTemplateData } from '@/src/lib/data-loader';

export async function GET() {
  console.log('[/api/templates] Fetching template data...');
  try {
    const { templates, source } = await loadTemplateData();
    console.log(`[/api/templates] Loaded ${templates.length} templates from ${source}`);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[/api/templates] Error loading template data:', error);
    return NextResponse.json({ error: 'Failed to load template data' }, { status: 500 });
  }
}
