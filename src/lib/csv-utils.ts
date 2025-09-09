import { 
  Template, 
  TemplateNormalized, 
  Keyword, 
  Platform, 
  TemplateKeyword, 
  TemplatePlatformParameters,
  ParsedTemplate,
  PlatformParams
} from './types';

/**
 * Parse CSV string into array of objects
 */
export function parseCSV<T>(csvContent: string): T[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      data.push(obj);
    }
  }

  return data;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && nextChar === '"') {
      // Escaped quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Parse platform parameters from JSON string or plain string
 */
export function parsePlatformParams(paramString: string): PlatformParams | string {
  if (!paramString) return {};
  
  // Check if it's JSON
  if (paramString.startsWith('{') && paramString.endsWith('}')) {
    try {
      return JSON.parse(paramString) as PlatformParams;
    } catch {
      return paramString;
    }
  }
  
  // Return as string (for Midjourney params)
  return paramString;
}

/**
 * Parse comma-separated variables string into array
 */
export function parseVariables(variablesString: string): string[] {
  if (!variablesString) return [];
  return variablesString.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Load and parse templates from CSV
 */
export async function loadTemplatesFromCSV(csvPath: string): Promise<TemplateNormalized[]> {
  try {
    const response = await fetch(csvPath);
    const csvContent = await response.text();
    return parseCSV<TemplateNormalized>(csvContent);
  } catch (error) {
    console.error('Error loading templates CSV:', error);
    return [];
  }
}

/**
 * Load and parse keywords from CSV
 */
export async function loadKeywordsFromCSV(csvPath: string): Promise<Keyword[]> {
  try {
    const response = await fetch(csvPath);
    const csvContent = await response.text();
    return parseCSV<Keyword>(csvContent);
  } catch (error) {
    console.error('Error loading keywords CSV:', error);
    return [];
  }
}

/**
 * Load and parse platforms from CSV
 */
export async function loadPlatformsFromCSV(csvPath: string): Promise<Platform[]> {
  try {
    const response = await fetch(csvPath);
    const csvContent = await response.text();
    return parseCSV<Platform>(csvContent);
  } catch (error) {
    console.error('Error loading platforms CSV:', error);
    return [];
  }
}

/**
 * Load and parse template-keyword relationships from CSV
 */
export async function loadTemplateKeywordsFromCSV(csvPath: string): Promise<TemplateKeyword[]> {
  try {
    const response = await fetch(csvPath);
    const csvContent = await response.text();
    return parseCSV<TemplateKeyword>(csvContent);
  } catch (error) {
    console.error('Error loading template keywords CSV:', error);
    return [];
  }
}

/**
 * Load and parse template platform parameters from CSV
 */
export async function loadTemplatePlatformParamsFromCSV(csvPath: string): Promise<TemplatePlatformParameters[]> {
  try {
    const response = await fetch(csvPath);
    const csvContent = await response.text();
    return parseCSV<TemplatePlatformParameters>(csvContent);
  } catch (error) {
    console.error('Error loading template platform parameters CSV:', error);
    return [];
  }
}

/**
 * Combine normalized data into parsed templates
 */
export function combineTemplateData(
  templates: TemplateNormalized[],
  keywords: Keyword[],
  platforms: Platform[],
  templateKeywords: TemplateKeyword[],
  templatePlatformParams: TemplatePlatformParameters[]
): ParsedTemplate[] {
  return templates.map(template => {
    // Parse variables
    const variables = parseVariables(template.variables);
    
    // Get keywords for this template
    const templateKeywordIds = templateKeywords
      .filter(tk => tk.template_id === template.id)
      .map(tk => tk.keyword_id);
    const templateKeywordsData = keywords.filter(k => templateKeywordIds.includes(k.id));
    
    // Get platform parameters for this template
    const templateParams = templatePlatformParams.filter(tp => tp.template_id === template.id);
    
    const platformParams: ParsedTemplate['platformParams'] = {};
    
    templateParams.forEach(param => {
      const platform = platforms.find(p => p.id === param.platform_id);
      if (platform) {
        const parsedParams = parsePlatformParams(param.parameters);
        
        switch (platform.name) {
          case 'midjourney':
            platformParams.midjourney = parsedParams as string;
            break;
          case 'stable_diffusion':
            platformParams.stable_diffusion = parsedParams as PlatformParams;
            break;
          case 'flux':
            platformParams.flux = parsedParams as PlatformParams;
            break;
        }
      }
    });
    
    return {
      ...template,
      variables,
      platformParams,
      keywords: templateKeywordsData
    };
  });
}

/**
 * Load all template data from CSV files
 */
export async function loadAllTemplateData(basePath = '/data/normalized'): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
}> {
  try {
    const [
      templates,
      keywords,
      platforms,
      templateKeywords,
      templatePlatformParams
    ] = await Promise.all([
      loadTemplatesFromCSV(`${basePath}/templates_normalized.csv`),
      loadKeywordsFromCSV(`${basePath}/keywords.csv`),
      loadPlatformsFromCSV(`${basePath}/platforms.csv`),
      loadTemplateKeywordsFromCSV(`${basePath}/template_keywords.csv`),
      loadTemplatePlatformParamsFromCSV(`${basePath}/template_platform_parameters.csv`)
    ]);

    const parsedTemplates = combineTemplateData(
      templates,
      keywords,
      platforms,
      templateKeywords,
      templatePlatformParams
    );

    return {
      templates: parsedTemplates,
      keywords,
      platforms
    };
  } catch (error) {
    console.error('Error loading template data:', error);
    return {
      templates: [],
      keywords: [],
      platforms: []
    };
  }
}