import { z } from 'zod';
import { 
  Template, 
  ParsedTemplate, 
  PromptValues, 
  PlatformParams,
  ValidationResult,
  ValidationError,
  TemplateFormData
} from './types';

// Zod schemas for validation
export const PlatformSchema = z.object({
  id: z.number().positive(),
  name: z.enum(['midjourney', 'stable_diffusion', 'flux']),
  description: z.string().min(1)
});

export const TemplateSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  base_prompt: z.string().min(1, 'Base prompt is required'),
  variables: z.string(),
  example_values: z.string(),
  category: z.enum(['Character', 'Portrait', 'Landscape', 'Interior', 'Object', 'Style']),
  mj_params: z.string().optional(),
  sd_params: z.string().optional(),
  flux_params: z.string().optional()
});

export const KeywordSchema = z.object({
  id: z.number().positive(),
  keyword: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1)
});

export const PlatformParamsSchema = z.record(z.union([z.string(), z.number()]));

export const PromptValuesSchema = z.record(z.string().min(1, 'Value cannot be empty'));

export const TemplateFormDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  base_prompt: z.string().min(1, 'Base prompt is required'),
  variables: z.array(z.string().min(1)),
  example_values: z.string().min(1, 'Example values are required'),
  category: z.enum(['Character', 'Portrait', 'Landscape', 'Interior', 'Object', 'Style']),
  keywords: z.array(z.number().positive()),
  platformParams: z.object({
    midjourney: z.string().optional(),
    stable_diffusion: PlatformParamsSchema.optional(),
    flux: PlatformParamsSchema.optional()
  })
});

/**
 * Validate template data
 */
export function validateTemplate(template: unknown): ValidationResult {
  try {
    TemplateSchema.parse(template);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      return { isValid: false, errors };
    }
    return { 
      isValid: false, 
      errors: [{ field: 'unknown', message: 'Unknown validation error', code: 'unknown' }] 
    };
  }
}

/**
 * Validate prompt values against template variables
 */
export function validatePromptValues(
  values: PromptValues, 
  template: ParsedTemplate
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check if all required variables have values
  template.variables.forEach(variable => {
    if (!values[variable] || values[variable].trim() === '') {
      errors.push({
        field: variable,
        message: `Value for ${variable} is required`,
        code: 'required'
      });
    }
  });
  
  // Check for extra values not in template
  Object.keys(values).forEach(key => {
    if (!template.variables.includes(key)) {
      errors.push({
        field: key,
        message: `${key} is not a valid variable for this template`,
        code: 'invalid'
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate platform parameters
 */
export function validatePlatformParams(
  params: PlatformParams | string,
  platform: 'midjourney' | 'stable_diffusion' | 'flux'
): ValidationResult {
  const errors: ValidationError[] = [];
  
  try {
    if (platform === 'midjourney') {
      // Midjourney params are strings
      if (typeof params !== 'string') {
        errors.push({
          field: 'parameters',
          message: 'Midjourney parameters must be a string',
          code: 'invalid_type'
        });
      }
    } else {
      // SD and Flux params are objects
      if (typeof params === 'string') {
        try {
          JSON.parse(params);
        } catch {
          errors.push({
            field: 'parameters',
            message: 'Invalid JSON format for parameters',
            code: 'invalid_json'
          });
        }
      } else {
        PlatformParamsSchema.parse(params);
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        });
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate template form data
 */
export function validateTemplateForm(data: TemplateFormData): ValidationResult {
  try {
    TemplateFormDataSchema.parse(data);
    
    // Additional custom validations
    const errors: ValidationError[] = [];
    
    // Check if base_prompt contains variables
    const promptVariables = extractVariablesFromPrompt(data.base_prompt);
    const missingVariables = promptVariables.filter(v => !data.variables.includes(v));
    
    if (missingVariables.length > 0) {
      errors.push({
        field: 'variables',
        message: `Variables found in prompt but not defined: ${missingVariables.join(', ')}`,
        code: 'missing_variables'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      return { isValid: false, errors };
    }
    return { 
      isValid: false, 
      errors: [{ field: 'unknown', message: 'Unknown validation error', code: 'unknown' }] 
    };
  }
}

/**
 * Extract variables from a prompt string
 * Variables are in the format [variable_name]
 */
export function extractVariablesFromPrompt(prompt: string): string[] {
  const variableRegex = /\[([^\]]+)\]/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(prompt)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Check if a string is a valid variable name
 */
export function isValidVariableName(name: string): boolean {
  // Variable names should be alphanumeric with underscores, no spaces
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Sanitize user input for prompts
 */
export function sanitizePromptInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potentially harmful characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string, provider: 'openrouter' | 'notion' | 'airtable'): boolean {
  if (!key || key.trim() === '') return false;
  
  switch (provider) {
    case 'openrouter':
      return key.startsWith('sk-or-v1-');
    case 'notion':
      return key.startsWith('secret_') || key.startsWith('ntn_');
    case 'airtable':
      return key.startsWith('pat') || key.startsWith('key');
    default:
      return false;
  }
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const required = ['NEXTAUTH_SECRET', 'OPENROUTER_API_KEY'];
  const missing: string[] = [];
  
  required.forEach(key => {
    if (!process.env[key] || process.env[key] === '' || process.env[key]?.includes('your-')) {
      missing.push(key);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
}