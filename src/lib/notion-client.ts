import { Client } from '@notionhq/client';
import { Template, ParsedTemplate, PlatformParams, TemplateListResponse, ErrorResponse } from './types';
import { validateTemplate, extractVariablesFromPrompt } from './validation';
import { isNotNull } from './type-guards';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

/**
 * Parse Notion database properties into our Template type
 */
function parseNotionTemplate(page: any): Template {
  const props = page.properties;
  
  return {
    id: props.id?.number || 0,
    name: props.name?.title?.[0]?.plain_text || '',
    description: props.description?.rich_text?.[0]?.plain_text || '',
    base_prompt: props.base_prompt?.rich_text?.[0]?.plain_text || '',
    variables: props.variables?.rich_text?.[0]?.plain_text || '',
    example_values: props.example_values?.rich_text?.[0]?.plain_text || '',
    category: props.category?.select?.name || 'Character',
    mj_params: props.mj_params?.rich_text?.[0]?.plain_text || '',
    sd_params: props.sd_params?.rich_text?.[0]?.plain_text || '',
    flux_params: props.flux_params?.rich_text?.[0]?.plain_text || '',
  };
}

/**
 * Parse platform parameters from string to object
 */
function parsePlatformParams(paramsString: string): PlatformParams | string {
  if (!paramsString || paramsString.trim() === '') {
    return {};
  }

  try {
    // Handle JSON-like strings for SD/Flux
    if (paramsString.includes('"steps"') || paramsString.includes('"sampler"') || paramsString.includes('"cfg_scale"')) {
      // Clean up the string and parse as JSON
      let cleaned = paramsString;
      
      // Handle various malformed JSON patterns
      if (!cleaned.startsWith('{')) {
        cleaned = `{${cleaned}}`;
      }
      
      // Fix common issues with escaped quotes
      cleaned = cleaned.replace(/\\\"/g, '"');
      cleaned = cleaned.replace(/\"\"/g, '"');
      
      return JSON.parse(cleaned);
    }
    
    // Handle Midjourney parameters (--ar 2:3 --s 250 --v 6.1)
    if (paramsString.includes('--')) {
      return paramsString; // Return as string for Midjourney
    }

    // Try to parse as JSON for other cases
    if (paramsString.startsWith('{') && paramsString.endsWith('}')) {
      return JSON.parse(paramsString);
    }

    // Return as string if can't parse
    return paramsString;
    
  } catch (error) {
    console.warn('Failed to parse platform params:', paramsString, error);
    return paramsString; // Return original string if parsing fails
  }
}

/**
 * Transform Template into ParsedTemplate with processed data
 */
function parseTemplate(template: Template): ParsedTemplate {
  // Parse variables from comma-separated string
  const variablesArray = template.variables 
    ? template.variables.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  // Also extract variables from the base prompt as fallback
  const promptVariables = extractVariablesFromPrompt(template.base_prompt);
  const allVariables = [...new Set([...variablesArray, ...promptVariables])];

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    base_prompt: template.base_prompt,
    example_values: template.example_values,
    category: template.category,
    variables: allVariables,
    platformParams: {
      midjourney: template.mj_params || undefined,
      stable_diffusion: template.sd_params ? parsePlatformParams(template.sd_params) as PlatformParams : undefined,
      flux: template.flux_params ? parsePlatformParams(template.flux_params) as PlatformParams : undefined,
    },
  };
}

/**
 * Fetch all templates from Notion database
 */
export async function getTemplates(options?: {
  category?: string;
  search?: string;
  limit?: number;
  startCursor?: string;
}): Promise<TemplateListResponse> {
  try {
    const filters: any[] = [];
    
    // Add category filter if specified
    if (options?.category) {
      filters.push({
        property: 'category',
        select: {
          equals: options.category,
        },
      });
    }

    // Add search filter if specified
    if (options?.search) {
      filters.push({
        or: [
          {
            property: 'name',
            title: {
              contains: options.search,
            },
          },
          {
            property: 'description',
            rich_text: {
              contains: options.search,
            },
          },
        ],
      });
    }

    const queryOptions: any = {
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'category',
          direction: 'ascending',
        },
        {
          property: 'name',
          direction: 'ascending',
        },
      ],
    };

    // Add filters if any
    if (filters.length > 0) {
      queryOptions.filter = filters.length === 1 ? filters[0] : { and: filters };
    }

    // Add pagination
    if (options?.limit) {
      queryOptions.page_size = Math.min(options.limit, 100);
    }

    if (options?.startCursor) {
      queryOptions.start_cursor = options.startCursor;
    }

    const response = await notion.databases.query(queryOptions);

    const templates = response.results
      .map(parseNotionTemplate)
      .filter(template => {
        const validation = validateTemplate(template);
        if (!validation.isValid) {
          console.warn(`Invalid template ${template.name}:`, validation.errors);
          return false;
        }
        return true;
      })
      .map(parseTemplate);

    // Get categories for the response
    const categories = await getCategories();

    return {
      templates,
      categories,
      keywords: [], // Not available from Notion directly
      platforms: [], // Not available from Notion directly
      total: templates.length,
    };
  } catch (error) {
    console.error('Failed to fetch templates from Notion:', error);
    throw new Error('Failed to fetch templates from Notion database');
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string): Promise<ParsedTemplate[]> {
  try {
    const response = await getTemplates({ category });
    return response.templates;
  } catch (error) {
    console.error('Failed to fetch templates by category:', error);
    throw new Error(`Failed to fetch templates for category: ${category}`);
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: number): Promise<ParsedTemplate | null> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'id',
        number: {
          equals: id,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const template = parseNotionTemplate(response.results[0]);
    
    // Validate template
    const validation = validateTemplate(template);
    if (!validation.isValid) {
      console.error(`Invalid template ${template.name}:`, validation.errors);
      return null;
    }

    return parseTemplate(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return null;
  }
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    // Get database schema to extract categories from select options
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    const categoryProperty = database.properties.category;
    if (categoryProperty && 'select' in categoryProperty && categoryProperty.select?.options) {
      return categoryProperty.select.options.map(option => option.name).sort();
    }

    // Fallback: get categories from actual data
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    const categories = [...new Set(
      response.results
        .map(page => parseNotionTemplate(page).category)
        .filter(isNotNull)
    )];

    return categories.sort();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return ['Character', 'Portrait', 'Landscape', 'Interior', 'Object', 'Style']; // Default fallback
  }
}

/**
 * Search templates by text
 */
export async function searchTemplates(query: string, options?: {
  category?: string;
  limit?: number;
}): Promise<ParsedTemplate[]> {
  try {
    const response = await getTemplates({
      search: query,
      category: options?.category,
      limit: options?.limit,
    });

    return response.templates;
  } catch (error) {
    console.error('Failed to search templates:', error);
    throw new Error('Failed to search templates');
  }
}

/**
 * Create a new template in Notion
 */
export async function createTemplate(template: Omit<Template, 'id'>): Promise<ParsedTemplate> {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        name: {
          title: [
            {
              text: {
                content: template.name,
              },
            },
          ],
        },
        description: {
          rich_text: [
            {
              text: {
                content: template.description,
              },
            },
          ],
        },
        base_prompt: {
          rich_text: [
            {
              text: {
                content: template.base_prompt,
              },
            },
          ],
        },
        variables: {
          rich_text: [
            {
              text: {
                content: template.variables,
              },
            },
          ],
        },
        example_values: {
          rich_text: [
            {
              text: {
                content: template.example_values,
              },
            },
          ],
        },
        category: {
          select: {
            name: template.category,
          },
        },
        mj_params: {
          rich_text: [
            {
              text: {
                content: template.mj_params || '',
              },
            },
          ],
        },
        sd_params: {
          rich_text: [
            {
              text: {
                content: template.sd_params || '',
              },
            },
          ],
        },
        flux_params: {
          rich_text: [
            {
              text: {
                content: template.flux_params || '',
              },
            },
          ],
        },
      },
    });

    const createdTemplate = parseNotionTemplate(response);
    return parseTemplate(createdTemplate);
  } catch (error) {
    console.error('Failed to create template:', error);
    throw new Error('Failed to create template in Notion');
  }
}

/**
 * Update an existing template in Notion
 */
export async function updateTemplate(pageId: string, updates: Partial<Omit<Template, 'id'>>): Promise<ParsedTemplate> {
  try {
    const properties: any = {};

    // Only include properties that are being updated
    if (updates.name) {
      properties.name = {
        title: [{ text: { content: updates.name } }],
      };
    }

    if (updates.description) {
      properties.description = {
        rich_text: [{ text: { content: updates.description } }],
      };
    }

    if (updates.base_prompt) {
      properties.base_prompt = {
        rich_text: [{ text: { content: updates.base_prompt } }],
      };
    }

    if (updates.variables) {
      properties.variables = {
        rich_text: [{ text: { content: updates.variables } }],
      };
    }

    if (updates.example_values) {
      properties.example_values = {
        rich_text: [{ text: { content: updates.example_values } }],
      };
    }

    if (updates.category) {
      properties.category = {
        select: { name: updates.category },
      };
    }

    if (updates.mj_params !== undefined) {
      properties.mj_params = {
        rich_text: [{ text: { content: updates.mj_params } }],
      };
    }

    if (updates.sd_params !== undefined) {
      properties.sd_params = {
        rich_text: [{ text: { content: updates.sd_params } }],
      };
    }

    if (updates.flux_params !== undefined) {
      properties.flux_params = {
        rich_text: [{ text: { content: updates.flux_params } }],
      };
    }

    const response = await notion.pages.update({
      page_id: pageId,
      properties,
    });

    const updatedTemplate = parseNotionTemplate(response);
    return parseTemplate(updatedTemplate);
  } catch (error) {
    console.error('Failed to update template:', error);
    throw new Error('Failed to update template in Notion');
  }
}

/**
 * Delete a template from Notion (archive it)
 */
export async function deleteTemplate(pageId: string): Promise<void> {
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
  } catch (error) {
    console.error('Failed to delete template:', error);
    throw new Error('Failed to delete template from Notion');
  }
}

/**
 * Test Notion connection and database access
 */
export async function testNotionConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.NOTION_API_KEY) {
      return { success: false, error: 'NOTION_API_KEY not configured' };
    }

    if (!DATABASE_ID) {
      return { success: false, error: 'NOTION_DATABASE_ID not configured' };
    }

    // Test database access
    await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Notion connection test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Notion database'
    };
  }
}