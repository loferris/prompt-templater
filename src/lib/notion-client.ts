import { Client } from '@notionhq/client';
import { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { ParsedTemplate, Keyword, Platform, PlatformParams } from './types';

function getNotionClient() {
  return new Client({
    auth: process.env.NOTION_API_KEY,
  });
}

function getDatabaseId() {
  return process.env.NOTION_DATABASE_ID!;
}

// --- Helper functions for parsing Notion properties ---

function getTitle(page: PageObjectResponse): string {
  const title = page.properties.name;
  return title.type === 'title' ? title.title[0]?.plain_text ?? '' : '';
}

function getText(page: PageObjectResponse, propName: string): string {
  const prop = page.properties[propName];
  if (prop?.type === 'rich_text') {
    return prop.rich_text[0]?.plain_text ?? '';
  }
  return '';
}

function getSelect(page: PageObjectResponse, propName: string): string {
  const prop = page.properties[propName];
  if (prop?.type === 'select') {
    return prop.select?.name ?? '';
  }
  return '';
}

function getMultiSelect(page: PageObjectResponse, propName: string): string[] {
  const prop = page.properties[propName];
  if (prop?.type === 'multi_select') {
    return prop.multi_select.map(option => option.name);
  }
  return [];
}

function getNumber(page: PageObjectResponse, propName: string): number {
  const prop = page.properties[propName];
  if (prop?.type === 'number') {
    return prop.number ?? 0;
  }
  return 0;
}

function parsePlatformParams(params: string): PlatformParams | undefined {
  try {
    return JSON.parse(params);
  } catch (e) {
    return undefined;
  }
}

// --- Main data fetching functions ---

/**
 * Fetches all templates from the Notion database.
 */
export async function getTemplates(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
}> {
  const notion = getNotionClient();
  const DATABASE_ID = getDatabaseId();
  
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const dataSourceId = (db as any).data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error('Could not find data source in the Notion database.');
  }

  const response = await (notion.dataSources as any).query({
    data_source_id: dataSourceId,
  });

  const pages = response.results as PageObjectResponse[];

  const keywords: Keyword[] = [];
  const platforms: Platform[] = [];

  const templates = pages.map(page => parseTemplate(page, keywords, platforms));

  return { templates, keywords, platforms };
}

/**
 * Parses a Notion page object into a ParsedTemplate.
 */
function parseTemplate(page: PageObjectResponse, allKeywords: Keyword[], allPlatforms: Platform[]): ParsedTemplate {
  const name = getTitle(page);
  const description = getText(page, 'description');
  const base_prompt = getText(page, 'base_prompt');
  const variablesText = getText(page, 'variables');
  const variables = variablesText ? variablesText.split(',').map(v => v.trim()).filter(v => v) : [];
  const example_values = getText(page, 'example_values');
  const category = getText(page, 'category') as ParsedTemplate['category'];

  // Parse keywords from rich text
  const keywordsText = getText(page, 'keywords');
  const keywords: Keyword[] = [];
  if (keywordsText) {
    const keywordNames = keywordsText.split(',').map(k => k.trim()).filter(k => k);
    keywordNames.forEach((keywordName, index) => {
      keywords.push({
        id: 1000 + index, // Generate temporary IDs
        keyword: keywordName,
        category: 'Style', // Default category
        description: `Keyword: ${keywordName}`
      });
    });
  }

  const platformParams: ParsedTemplate['platformParams'] = {};
  const mjParams = getText(page, 'mj_params');
  if (mjParams) {
    platformParams.midjourney = mjParams;
  }
  const sdParams = getText(page, 'sd_params');
  if (sdParams) {
    platformParams.stable_diffusion = parsePlatformParams(sdParams);
  }
  const fluxParams = getText(page, 'flux_params');
  if (fluxParams) {
    platformParams.flux = parsePlatformParams(fluxParams);
  }

  return {
    id: page.id,
    name,
    description,
    base_prompt,
    variables,
    example_values,
    category,
    platformParams,
    keywords,
  };
}