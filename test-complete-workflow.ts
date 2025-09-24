#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { loadTemplateData } from './src/lib/data-loader';

/**
 * Test the complete workflow: basic mode + advanced mode + platform params
 */
async function testCompleteWorkflow() {
  try {
    console.log('🎬 Testing Complete Workflow...\n');

    // Load templates
    const { templates } = await loadTemplateData();
    const template = templates[0];
    
    console.log(`📝 Template: "${template.name}"`);
    console.log(`   Base prompt: ${template.base_prompt}`);
    console.log(`   Variables: ${template.variables.join(', ')}`);
    console.log(`   Example values: ${template.example_values}\n`);

    // Parse example values
    const exampleValues = parseExampleValues(template.example_values);

    // Test 1: Basic Mode (auto-filled with example values + natural language)
    console.log('🎯 TEST 1: Basic Mode (Natural Language + Template)');
    const basicResult = await testEnhanceAPI({
      base_prompt: template.base_prompt,
      promptValues: exampleValues,
      naturalLanguagePrompt: "Make it look epic and dramatic with moody lighting",
      platform: 'midjourney',
      platformParams: {
        midjourney: '--ar 16:9 --s 300 --v 6.1'
      }
    });
    console.log(`✨ Result: ${basicResult.enhancedPrompt}\n`);

    // Test 2: Advanced Mode (user fills variables manually)  
    console.log('🎯 TEST 2: Advanced Mode (Custom Variables)');
    const advancedResult = await testEnhanceAPI({
      base_prompt: template.base_prompt,
      promptValues: {
        film_genre: 'romantic comedy',
        mood: 'bright and cheerful',  
        composition: 'centered portrait',
        title_style: 'playful handwritten fonts'
      },
      platform: 'stable_diffusion',
      platformParams: {
        stable_diffusion: {
          steps: 25,
          cfg_scale: 7,
          sampler: 'DPM++ 2M Karras',
          width: 512,
          height: 768
        }
      }
    });
    console.log(`✨ Result: ${advancedResult.enhancedPrompt}\n`);

    // Test 3: Template Only (no natural language)
    console.log('🎯 TEST 3: Template Only Mode');
    const templateOnlyResult = await testEnhanceAPI({
      base_prompt: template.base_prompt,
      promptValues: exampleValues,
      platform: 'flux',
      platformParams: {
        flux: {
          steps: 20,
          width: 1024,
          height: 1024
        }
      }
    });
    console.log(`✨ Result: ${templateOnlyResult.enhancedPrompt}\n`);

    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Parse example values string into key-value pairs
 */
function parseExampleValues(exampleValuesString: string): Record<string, string> {
  const values: Record<string, string> = {};
  
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
 * Test the enhanced API with new parameters
 */
async function testEnhanceAPI(params: {
  base_prompt: string;
  promptValues: Record<string, string>;
  naturalLanguagePrompt?: string;
  platform?: string;
  platformParams?: any;
}): Promise<any> {
  const response = await fetch('http://localhost:3001/api/enhance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

testCompleteWorkflow();