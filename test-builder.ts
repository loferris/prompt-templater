import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getTemplate } from './src/lib/notion-client';

// --- Configuration ---
const TEMPLATE_ID_TO_TEST = 1; // <--- Set the ID of the template you want to test
const USER_INPUT = 'a majestic lion'; // <--- Set the user input you want to test

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

  const systemPrompt = 'please write a detailed prompt for an ai image generator.';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorBody}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

async function testBuilder() {
  console.log(`Fetching template with ID: ${TEMPLATE_ID_TO_TEST}...`);

  try {
    const template = await getTemplate(TEMPLATE_ID_TO_TEST);

    if (!template) {
      console.error(`Template with ID ${TEMPLATE_ID_TO_TEST} not found.`);
      return;
    }

    console.log(`Found template: "${template.name}"`);
    console.log(`User input: "${USER_INPUT}"`);

    // Combine template and user input
    // This assumes the user input replaces a generic variable like [subject]
    // You may need to adjust this logic based on your template structure
    const combinedPrompt = template.base_prompt.replace('[subject]', USER_INPUT);
    console.log(`Combined prompt for OpenRouter: "${combinedPrompt}"`);

    // Call OpenRouter
    const enhancedPrompt = await callOpenRouter(combinedPrompt);
    console.log(`Enhanced prompt from OpenRouter: "${enhancedPrompt}"`);

    // Append platform parameters
    // This example uses Midjourney params, you can change it to 'stable_diffusion' or 'flux'
    const finalPrompt = `${enhancedPrompt} ${template.platformParams.midjourney || ''}`.trim();
    console.log(`
--- FINAL PROMPT ---
${finalPrompt}`);

  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error(error);
  }
}

testBuilder();
