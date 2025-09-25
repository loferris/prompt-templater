import { NextRequest, NextResponse } from 'next/server';
import { loadTemplatePlatformParamsFromCSV, loadPlatformsFromCSV } from '@/src/lib/csv-utils';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    console.log(`[/api/templates/${templateId}/platforms] Fetching platform parameters...`);
    
    // Load platform parameters and platforms data directly from CSV
    const projectRoot = process.cwd();
    const dataPath = path.join(projectRoot, 'data/normalized');
    
    const [platformParams, platforms] = await Promise.all([
      loadTemplatePlatformParamsFromCSV(path.join(dataPath, 'template_platform_parameters.csv')),
      loadPlatformsFromCSV(path.join(dataPath, 'platforms.csv'))
    ]);
    
    // Filter platform parameters for this specific template
    const templatePlatformParams = platformParams.filter(p => p.template_id === templateId);
    
    // Join with platform names to get readable platform names
    const templatePlatforms = templatePlatformParams.map(param => {
      const platform = platforms.find(p => p.id === param.platform_id);
      return {
        ...param,
        platform_name: platform?.name || `platform_${param.platform_id}`
      };
    });
    
    console.log(`[/api/templates/${templateId}/platforms] Found ${templatePlatforms.length} platform configurations`);
    
    return NextResponse.json(templatePlatforms);
  } catch (error) {
    console.error('[/api/templates/platforms] Error loading platform data:', error);
    return NextResponse.json({ error: 'Failed to load platform data' }, { status: 500 });
  }
}