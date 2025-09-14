import { ParsedTemplate, Keyword, Platform } from './types';

/**
 * Load all template data from Notion.
 */
export async function loadTemplateData(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
  source: 'notion' | 'fallback';
}> {
  if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
    try {
      const { getTemplates } = await import('./notion-client');
      const notionData = await getTemplates();
      return {
        templates: notionData.templates,
        keywords: notionData.keywords,
        platforms: notionData.platforms,
        source: 'notion'
      };
    } catch (notionError) {
      console.error('Failed to fetch data from Notion:', notionError);
    }
  }

  // Return empty data if Notion is not configured or fails
  return {
    templates: [],
    keywords: [],
    platforms: [],
    source: 'fallback'
  };
}
