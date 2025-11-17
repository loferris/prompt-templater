import {
  validateTemplate,
  validatePromptValues,
  validatePlatformParams,
  validateTemplateForm,
  extractVariablesFromPrompt,
  isValidVariableName,
  sanitizePromptInput,
  validateApiKey,
  validateEnvironment,
} from '../validation';
import { ParsedTemplate } from '../types';

describe('validation utilities', () => {
  describe('extractVariablesFromPrompt', () => {
    it('should extract variables from a prompt', () => {
      const prompt = 'A [character_type] with [features] in [style] style';
      const variables = extractVariablesFromPrompt(prompt);
      expect(variables).toEqual(['character_type', 'features', 'style']);
    });

    it('should handle no variables', () => {
      const prompt = 'A simple prompt with no variables';
      const variables = extractVariablesFromPrompt(prompt);
      expect(variables).toEqual([]);
    });

    it('should not duplicate variables', () => {
      const prompt = 'A [type] is [type] with [style]';
      const variables = extractVariablesFromPrompt(prompt);
      expect(variables).toEqual(['type', 'style']);
    });

    it('should handle empty brackets', () => {
      const prompt = 'A [] with [valid]';
      const variables = extractVariablesFromPrompt(prompt);
      expect(variables).toEqual(['valid']);
    });
  });

  describe('isValidVariableName', () => {
    it('should validate correct variable names', () => {
      expect(isValidVariableName('character_type')).toBe(true);
      expect(isValidVariableName('_private')).toBe(true);
      expect(isValidVariableName('var123')).toBe(true);
    });

    it('should reject invalid variable names', () => {
      expect(isValidVariableName('123start')).toBe(false);
      expect(isValidVariableName('has space')).toBe(false);
      expect(isValidVariableName('has-dash')).toBe(false);
      expect(isValidVariableName('')).toBe(false);
    });
  });

  describe('sanitizePromptInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizePromptInput('  hello  ')).toBe('hello');
    });

    it('should replace multiple spaces with single space', () => {
      expect(sanitizePromptInput('hello    world')).toBe('hello world');
    });

    it('should remove harmful characters', () => {
      expect(sanitizePromptInput('hello<script>alert("xss")</script>world')).toBe('helloscriptalert("xss")/scriptworld');
    });

    it('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(1500);
      const sanitized = sanitizePromptInput(longString);
      expect(sanitized.length).toBe(1000);
    });
  });

  describe('validateApiKey', () => {
    it('should validate OpenRouter keys', () => {
      expect(validateApiKey('sk-or-v1-abc123', 'openrouter')).toBe(true);
      expect(validateApiKey('invalid', 'openrouter')).toBe(false);
    });

    it('should validate Notion keys', () => {
      expect(validateApiKey('secret_abc123', 'notion')).toBe(true);
      expect(validateApiKey('ntn_abc123', 'notion')).toBe(true);
      expect(validateApiKey('invalid', 'notion')).toBe(false);
    });

    it('should validate Airtable keys', () => {
      expect(validateApiKey('patabc123', 'airtable')).toBe(true);
      expect(validateApiKey('keyabc123', 'airtable')).toBe(true);
      expect(validateApiKey('invalid', 'airtable')).toBe(false);
    });

    it('should reject empty keys', () => {
      expect(validateApiKey('', 'openrouter')).toBe(false);
      expect(validateApiKey('   ', 'notion')).toBe(false);
    });
  });

  describe('validatePromptValues', () => {
    const template: ParsedTemplate = {
      id: '1',
      name: 'Test Template',
      description: 'Test',
      base_prompt: '[var1] and [var2]',
      variables: ['var1', 'var2'],
      example_values: 'var1: test1, var2: test2',
      category: 'Character',
      platformParams: {},
    };

    it('should validate correct values', () => {
      const values = { var1: 'value1', var2: 'value2' };
      const result = validatePromptValues(values, template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing values', () => {
      const values = { var1: 'value1' };
      const result = validatePromptValues(values, template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('var2');
    });

    it('should detect empty values', () => {
      const values = { var1: 'value1', var2: '   ' };
      const result = validatePromptValues(values, template);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('var2');
    });

    it('should detect extra values', () => {
      const values = { var1: 'value1', var2: 'value2', var3: 'extra' };
      const result = validatePromptValues(values, template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'var3')).toBe(true);
    });
  });

  describe('validatePlatformParams', () => {
    it('should validate midjourney params as string', () => {
      const result = validatePlatformParams('--ar 16:9 --v 6', 'midjourney');
      expect(result.isValid).toBe(true);
    });

    it('should reject midjourney params as object', () => {
      const result = validatePlatformParams({ ar: '16:9' } as any, 'midjourney');
      expect(result.isValid).toBe(false);
    });

    it('should validate stable_diffusion params as object', () => {
      const params = { steps: 30, cfg_scale: 7 };
      const result = validatePlatformParams(params, 'stable_diffusion');
      expect(result.isValid).toBe(true);
    });

    it('should validate flux params as object', () => {
      const params = { steps: 25, cfg_scale: 7 };
      const result = validatePlatformParams(params, 'flux');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should validate when all required env vars are present', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test';

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing env vars', () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.OPENROUTER_API_KEY;

      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('NEXTAUTH_SECRET');
      expect(result.missing).toContain('OPENROUTER_API_KEY');
    });

    it('should detect placeholder values', () => {
      process.env.NEXTAUTH_SECRET = 'your-secret-here';
      process.env.OPENROUTER_API_KEY = 'your-api-key';

      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
    });
  });
});
