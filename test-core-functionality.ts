#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { loadTemplateData } from './src/lib/data-loader';

/**
 * Test the core prompt generation functionality
 */
async function testCoreFunctionality() {
  try {
    console.log('🧪 Testing core functionality...\n');

    // 1. Load templates
    console.log('1️⃣ Loading templates...');
    const { templates } = await loadTemplateData();
    console.log(`✅ Loaded ${templates.length} templates\n`);

    // 2. Pick a template for testing
    const template = templates[0];
    console.log(`2️⃣ Testing with template: "${template.name}"`);
    console.log(`   Base prompt: ${template.base_prompt}`);
    console.log(`   Variables: ${template.variables.join(', ')}`);
    console.log(`   Example values: ${template.example_values}`);
    console.log(`   Platform params:`, template.platformParams);
    console.log();

    // 3. Parse example values for testing 
    const exampleValues = parseExampleValues(template.example_values);
    console.log('3️⃣ Parsed example values:', exampleValues);
    console.log();

    // 4. Test variable substitution
    console.log('4️⃣ Testing variable substitution...');
    const filledPrompt = substituteVariables(template.base_prompt, exampleValues);
    console.log(`   Filled prompt: ${filledPrompt}`);
    console.log();

    // 5. Test API call to enhance endpoint
    console.log('5️⃣ Testing API enhancement...');
    const enhancedResult = await testEnhanceAPI(template.base_prompt, exampleValues);
    console.log(`   Enhanced prompt: ${enhancedResult}`);
    console.log();

    // 6. Apply platform parameters
    console.log('6️⃣ Testing platform parameter application...');
    const finalPrompt = applyPlatformParams(enhancedResult, template.platformParams, 'midjourney');
    console.log(`   Final prompt with params: ${finalPrompt}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Parse example values string into key-value pairs
 */
function parseExampleValues(exampleValuesString: string): Record<string, string> {
  const values: Record<string, string> = {};
  
  // Parse "key: value, key2: value2" format
  const pairs = exampleValuesString.split(',').map(pair => pair.trim());
  
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      values[key.trim()] = value;
    }
  }
  
  return values;
}

/**
 * Simple variable substitution 
 */
function substituteVariables(basePrompt: string, values: Record<string, string>): string {
  let result = basePrompt;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return result;
}

/**
 * Test the enhance API endpoint
 */
async function testEnhanceAPI(basePrompt: string, promptValues: Record<string, string>): Promise<string> {
  const response = await fetch('http://localhost:3001/api/enhance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_prompt: basePrompt,
      promptValues: promptValues
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.enhancedPrompt;
}

/**
 * Apply platform parameters to enhanced prompt
 */
function applyPlatformParams(
  prompt: string, 
  platformParams: any, 
  platform: string
): string {
  const params = platformParams[platform];
  if (!params) return prompt;
  
  // For Midjourney, params are strings that get appended
  if (platform === 'midjourney' && typeof params === 'string') {
    return `${prompt} ${params}`;
  }
  
  // For SD/Flux, params are JSON objects (would be handled differently in real app)
  if (typeof params === 'object') {
    const paramString = Object.entries(params)
      .map(([key, value]) => `--${key} ${value}`)
      .join(' ');
    return `${prompt} ${paramString}`;
  }
  
  return prompt;
}

testCoreFunctionality();