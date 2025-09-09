import { 
  Template, 
  ParsedTemplate, 
  Keyword, 
  Platform, 
  PlatformParams,
  GeneratedPrompt,
  EnhanceResponse,
  TemplateListResponse,
  ErrorResponse,
  PromptValues
} from './types';

/**
 * Type guard for Template
 */
export function isTemplate(obj: unknown): obj is Template {
  if (!obj || typeof obj !== 'object') return false;
  
  const template = obj as Record<string, unknown>;
  
  return (
    typeof template.id === 'number' &&
    typeof template.name === 'string' &&
    typeof template.description === 'string' &&
    typeof template.base_prompt === 'string' &&
    typeof template.variables === 'string' &&
    typeof template.example_values === 'string' &&
    typeof template.category === 'string' &&
    ['Character', 'Portrait', 'Landscape', 'Interior', 'Object', 'Style'].includes(template.category as string)
  );
}

/**
 * Type guard for ParsedTemplate
 */
export function isParsedTemplate(obj: unknown): obj is ParsedTemplate {
  if (!obj || typeof obj !== 'object') return false;
  
  const template = obj as Record<string, unknown>;
  
  return (
    typeof template.id === 'number' &&
    typeof template.name === 'string' &&
    typeof template.description === 'string' &&
    typeof template.base_prompt === 'string' &&
    Array.isArray(template.variables) &&
    template.variables.every(v => typeof v === 'string') &&
    typeof template.example_values === 'string' &&
    typeof template.category === 'string' &&
    typeof template.platformParams === 'object'
  );
}

/**
 * Type guard for Keyword
 */
export function isKeyword(obj: unknown): obj is Keyword {
  if (!obj || typeof obj !== 'object') return false;
  
  const keyword = obj as Record<string, unknown>;
  
  return (
    typeof keyword.id === 'number' &&
    typeof keyword.keyword === 'string' &&
    typeof keyword.category === 'string' &&
    typeof keyword.description === 'string'
  );
}

/**
 * Type guard for Platform
 */
export function isPlatform(obj: unknown): obj is Platform {
  if (!obj || typeof obj !== 'object') return false;
  
  const platform = obj as Record<string, unknown>;
  
  return (
    typeof platform.id === 'number' &&
    typeof platform.name === 'string' &&
    ['midjourney', 'stable_diffusion', 'flux'].includes(platform.name as string) &&
    typeof platform.description === 'string'
  );
}

/**
 * Type guard for PlatformParams
 */
export function isPlatformParams(obj: unknown): obj is PlatformParams {
  if (!obj || typeof obj !== 'object') return false;
  
  const params = obj as Record<string, unknown>;
  
  return Object.values(params).every(value => 
    typeof value === 'string' || 
    typeof value === 'number' ||
    value === undefined
  );
}

/**
 * Type guard for PromptValues
 */
export function isPromptValues(obj: unknown): obj is PromptValues {
  if (!obj || typeof obj !== 'object') return false;
  
  const values = obj as Record<string, unknown>;
  
  return Object.values(values).every(value => typeof value === 'string');
}

/**
 * Type guard for GeneratedPrompt
 */
export function isGeneratedPrompt(obj: unknown): obj is GeneratedPrompt {
  if (!obj || typeof obj !== 'object') return false;
  
  const prompt = obj as Record<string, unknown>;
  
  return (
    typeof prompt.templateId === 'number' &&
    typeof prompt.platform === 'string' &&
    ['midjourney', 'stable_diffusion', 'flux'].includes(prompt.platform as string) &&
    typeof prompt.prompt === 'string' &&
    typeof prompt.values === 'object' &&
    isPromptValues(prompt.values)
  );
}

/**
 * Type guard for EnhanceResponse
 */
export function isEnhanceResponse(obj: unknown): obj is EnhanceResponse {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Record<string, unknown>;
  
  return (
    typeof response.original === 'string' &&
    Array.isArray(response.enhanced) &&
    response.enhanced.every(e => typeof e === 'string') &&
    typeof response.model === 'string'
  );
}

/**
 * Type guard for TemplateListResponse
 */
export function isTemplateListResponse(obj: unknown): obj is TemplateListResponse {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Record<string, unknown>;
  
  return (
    Array.isArray(response.templates) &&
    response.templates.every(isParsedTemplate) &&
    Array.isArray(response.categories) &&
    response.categories.every(c => typeof c === 'string') &&
    typeof response.total === 'number'
  );
}

/**
 * Type guard for ErrorResponse
 */
export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Record<string, unknown>;
  
  return (
    typeof response.error === 'string' &&
    typeof response.message === 'string'
  );
}

/**
 * Type guard to check if a value is a valid platform name
 */
export function isPlatformName(value: unknown): value is Platform['name'] {
  return typeof value === 'string' && 
         ['midjourney', 'stable_diffusion', 'flux'].includes(value);
}

/**
 * Type guard to check if a value is a valid category
 */
export function isTemplateCategory(value: unknown): value is Template['category'] {
  return typeof value === 'string' && 
         ['Character', 'Portrait', 'Landscape', 'Interior', 'Object', 'Style'].includes(value);
}

/**
 * Type guard for arrays of templates
 */
export function isTemplateArray(obj: unknown): obj is Template[] {
  return Array.isArray(obj) && obj.every(isTemplate);
}

/**
 * Type guard for arrays of parsed templates
 */
export function isParsedTemplateArray(obj: unknown): obj is ParsedTemplate[] {
  return Array.isArray(obj) && obj.every(isParsedTemplate);
}

/**
 * Type guard for arrays of keywords
 */
export function isKeywordArray(obj: unknown): obj is Keyword[] {
  return Array.isArray(obj) && obj.every(isKeyword);
}

/**
 * Type guard for arrays of platforms
 */
export function isPlatformArray(obj: unknown): obj is Platform[] {
  return Array.isArray(obj) && obj.every(isPlatform);
}

/**
 * Helper function to safely parse JSON
 */
export function safeJsonParse<T>(json: string, typeGuard: (obj: unknown) => obj is T): T | null {
  try {
    const parsed = JSON.parse(json);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Helper function to check if an object has all required keys
 */
export function hasRequiredKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  
  const record = obj as Record<string, unknown>;
  return keys.every(key => key in record);
}

/**
 * Type narrowing function for union types
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Type guard to check if a string is a valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if an object is empty
 */
export function isEmpty(obj: unknown): boolean {
  if (!obj) return true;
  if (typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
}

/**
 * Type guard for non-null values
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for defined values
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}