import { promises as fs } from 'fs';
import path from 'path';
import { loadAllTemplateData } from './csv-utils';
import { ParsedTemplate, Keyword, Platform } from './types';

/**
 * Get the correct data path for the current environment
 */
function getDataPath(): string {
  // In development, use relative path from project root
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'data', 'normalized');
  }
  
  // In production, use public path accessible via fetch
  return '/data/normalized';
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Load CSV data in Node.js environment (server-side)
 */
async function loadDataServerSide(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
}> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'normalized');
    
    // Check if directory exists
    await fs.access(dataPath);
    
    // Use the loadAllTemplateData function but with the correct path
    return await loadAllTemplateData(dataPath);
  } catch (error) {
    console.error('Error loading data server-side:', error);
    return {
      templates: [],
      keywords: [],
      platforms: []
    };
  }
}

/**
 * Load CSV data in browser environment (client-side)
 */
async function loadDataClientSide(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
}> {
  try {
    // In browser, files need to be in public directory and accessed via fetch
    const publicDataPath = '/data/normalized';
    return await loadAllTemplateData(publicDataPath);
  } catch (error) {
    console.error('Error loading data client-side:', error);
    return {
      templates: [],
      keywords: [],
      platforms: []
    };
  }
}

/**
 * Universal data loader that works in both server and client environments
 */
export async function loadTemplateData(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
}> {
  if (isBrowser()) {
    return loadDataClientSide();
  } else {
    return loadDataServerSide();
  }
}

/**
 * Load data from the moved CSV files with fallback handling
 */
export async function loadDataWithFallback(): Promise<{
  templates: ParsedTemplate[];
  keywords: Keyword[];
  platforms: Platform[];
  source: 'csv' | 'notion' | 'fallback';
}> {
  try {
    // Try loading from CSV files first
    const data = await loadTemplateData();
    
    if (data.templates.length > 0) {
      return { ...data, source: 'csv' };
    }
    
    // If no CSV data, try Notion (if configured)
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
        console.warn('Notion fallback failed:', notionError);
      }
    }
    
    // Last resort: return empty data with fallback indicators
    return {
      templates: [],
      keywords: [],
      platforms: [],
      source: 'fallback'
    };
    
  } catch (error) {
    console.error('All data loading methods failed:', error);
    return {
      templates: [],
      keywords: [],
      platforms: [],
      source: 'fallback'
    };
  }
}

/**
 * Validate that the data directory exists and contains the expected files
 */
export async function validateDataDirectory(): Promise<{
  isValid: boolean;
  missingFiles: string[];
  availableFiles: string[];
}> {
  const requiredFiles = [
    'templates_normalized.csv',
    'keywords.csv',
    'platforms.csv',
    'template_keywords.csv',
    'template_platform_parameters.csv'
  ];
  
  const missingFiles: string[] = [];
  const availableFiles: string[] = [];
  
  try {
    const dataPath = path.join(process.cwd(), 'data', 'normalized');
    
    for (const file of requiredFiles) {
      const filePath = path.join(dataPath, file);
      try {
        await fs.access(filePath);
        availableFiles.push(file);
      } catch {
        missingFiles.push(file);
      }
    }
    
    return {
      isValid: missingFiles.length === 0,
      missingFiles,
      availableFiles
    };
  } catch (error) {
    return {
      isValid: false,
      missingFiles: requiredFiles,
      availableFiles: []
    };
  }
}