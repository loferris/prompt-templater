import { ParsedTemplate, Keyword, Platform } from './types';
import { getTemplates } from './notion-client';
import { loadAllTemplateData } from './csv-utils';

/**
 * Load all template data from Notion.
 * Fails fast if Notion is not configured or unavailable.
 */
export async function loadTemplateData(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
  source: 'notion';
}> {
  if (!process.env.NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY environment variable is required');
  }
  
  if (!process.env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID environment variable is required');
  }

  const notionData = await getTemplates();
  return {
    ...notionData,
    source: 'notion'
  };
}
