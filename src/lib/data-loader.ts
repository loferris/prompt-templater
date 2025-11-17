import { ParsedTemplate, Keyword, Platform } from './types';
import { getTemplates } from './notion-client';
import { loadAllTemplateData } from './csv-utils';

type DataSource = 'notion' | 'csv' | 'fallback';

/**
 * Default fallback templates when both Notion and CSV fail
 */
function getDefaultTemplates(): ParsedTemplate[] {
  return [
    {
      id: 'default-1',
      name: 'Fantasy Character',
      description: 'A template for creating fantasy character portraits',
      base_prompt: 'A [character_type] with [features], [style] art style',
      variables: ['character_type', 'features', 'style'],
      example_values: 'character_type: warrior, features: glowing eyes and silver armor, style: fantasy',
      category: 'Character',
      platformParams: {
        midjourney: '--ar 2:3 --v 6',
        stable_diffusion: { steps: 30, cfg_scale: 7, width: 512, height: 768 },
        flux: { steps: 25, cfg_scale: 7 }
      }
    },
    {
      id: 'default-2',
      name: 'Landscape Scene',
      description: 'A template for creating beautiful landscape scenes',
      base_prompt: 'A [landscape_type] with [weather] weather, [time_of_day]',
      variables: ['landscape_type', 'weather', 'time_of_day'],
      example_values: 'landscape_type: mountain range, weather: dramatic clouds, time_of_day: golden hour sunset',
      category: 'Landscape',
      platformParams: {
        midjourney: '--ar 16:9 --v 6',
        stable_diffusion: { steps: 30, cfg_scale: 7, width: 768, height: 512 },
        flux: { steps: 25, cfg_scale: 7 }
      }
    }
  ];
}

/**
 * Load all template data with graceful fallback.
 * Priority: Notion -> CSV -> Default templates
 */
export async function loadTemplateData(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
  source: DataSource;
}> {
  const defaultPlatforms: Platform[] = [
    { id: 1, name: 'midjourney', description: 'Discord-based AI image generator' },
    { id: 2, name: 'stable_diffusion', description: 'Open source diffusion model' },
    { id: 3, name: 'flux', description: 'High-quality image generation' }
  ];

  // Try Notion first if configured
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    try {
      console.log('Attempting to load templates from Notion...');
      const notionData = await getTemplates();

      if (notionData.templates && notionData.templates.length > 0) {
        console.log(`Successfully loaded ${notionData.templates.length} templates from Notion`);
        return {
          ...notionData,
          source: 'notion'
        };
      }

      console.warn('Notion returned no templates, falling back to CSV');
    } catch (error) {
      console.error('Failed to load from Notion, falling back to CSV:', error);
    }
  } else {
    console.log('Notion not configured, using CSV data source');
  }

  // Try CSV fallback
  try {
    console.log('Attempting to load templates from CSV...');
    const csvData = await loadAllTemplateData();

    if (csvData.templates && csvData.templates.length > 0) {
      console.log(`Successfully loaded ${csvData.templates.length} templates from CSV`);
      return {
        ...csvData,
        platforms: csvData.platforms.length > 0 ? csvData.platforms : defaultPlatforms,
        source: 'csv'
      };
    }

    console.warn('CSV returned no templates, using default templates');
  } catch (error) {
    console.error('Failed to load from CSV, using default templates:', error);
  }

  // Final fallback to default templates
  console.log('Using default fallback templates');
  return {
    templates: getDefaultTemplates(),
    keywords: [],
    platforms: defaultPlatforms,
    source: 'fallback'
  };
}
