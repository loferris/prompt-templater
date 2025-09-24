// Core data types based on CSV schemas

export interface Platform {
  id: number;
  name: 'midjourney' | 'stable_diffusion' | 'flux';
  description: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  base_prompt: string;
  variables: string; // comma-separated list
  example_values: string;
  category: 'Character' | 'Portrait' | 'Landscape' | 'Interior' | 'Object' | 'Style';
  mj_params?: string;
  sd_params?: string;
  flux_params?: string;
}

export interface TemplateNormalized {
  id: string;
  name: string;
  description: string;
  base_prompt: string;
  variables: string; // comma-separated list
  example_values: string;
  category: 'Character' | 'Portrait' | 'Landscape' | 'Interior' | 'Object' | 'Style';
}

export interface Keyword {
  id: number;
  keyword: string;
  category: string;
  description: string;
}

export interface TemplateKeyword {
  id: number;
  template_id: string;
  keyword_id: number;
}

export interface TemplatePlatformParameters {
  id: number;
  template_id: string;
  platform_id: number;
  parameters: string; // JSON string for SD/Flux, plain string for MJ
}

// Processed types for the application
export interface ParsedTemplate extends Omit<TemplateNormalized, 'variables'> {
  variables: string[];
  platformParams: {
    midjourney?: string;
    stable_diffusion?: PlatformParams;
    flux?: PlatformParams;
  };
  keywords?: Keyword[];
}

export interface PlatformParams {
  steps?: number;
  cfg_scale?: number;
  sampler?: string;
  width?: number;
  height?: number;
  [key: string]: string | number | undefined;
}

export interface PromptValues {
  [variableName: string]: string;
}

export interface GeneratedPrompt {
  templateId: number;
  platform: Platform['name'];
  prompt: string;
  parameters?: string | PlatformParams;
  values: PromptValues;
  enhanced?: boolean;
  timestamp?: string;
}

// API response types
export interface EnhanceResponse {
  original: string;
  enhanced: string[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
}

export interface TemplateListResponse {
  templates: ParsedTemplate[];
  categories: string[];
  keywords: Keyword[];
  platforms: Platform[];
  total: number;
  page?: number;
  limit?: number;
}

export interface TemplateResponse {
  template: ParsedTemplate;
  relatedTemplates?: ParsedTemplate[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

// UI state types
export type BuilderMode = 'advanced' | 'basic' | 'natural';
export type ViewMode = 'grid' | 'list' | 'cards';

export interface BuilderState {
  mode: BuilderMode;
  selectedTemplate: ParsedTemplate | null;
  selectedPlatform: Platform['name'];
  values: PromptValues;
  naturalLanguageInput: string;
  generatedPrompt: string;
  isEnhancing: boolean;
  enhancedOptions: string[];
  isLoading: boolean;
  error: string | null;
}

export interface TemplateFilters {
  category?: string;
  search?: string;
  keywords?: number[];
  platform?: Platform['name'];
  sortBy?: 'name' | 'category' | 'created' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export interface UIState {
  viewMode: ViewMode;
  filters: TemplateFilters;
  selectedCategories: string[];
  isLoading: boolean;
  error: string | null;
}

// Form types
export interface TemplateFormData {
  name: string;
  description: string;
  base_prompt: string;
  variables: string[];
  example_values: string;
  category: Template['category'];
  keywords: number[];
  platformParams: {
    midjourney?: string;
    stable_diffusion?: PlatformParams;
    flux?: PlatformParams;
  };
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event types for analytics
export interface AnalyticsEvent {
  event: string;
  properties: {
    template_id?: number;
    platform?: Platform['name'];
    category?: string;
    [key: string]: any;
  };
  timestamp: string;
  user_id?: string;
}