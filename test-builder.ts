import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getTemplate } from './src/lib/notion-client';

// --- Configuration ---
const TEMPLATE_ID_TO_TEST = 1; // <--- Set the ID of the template you want to test

async function testBuilder() {
  console.log(`Fetching template with ID: ${TEMPLATE_ID_TO_TEST}...`);

  try {
    const rawTemplate = await getTemplate(TEMPLATE_ID_TO_TEST);

    if (!rawTemplate) {
      console.error(`--- Template with ID ${TEMPLATE_ID_TO_TEST} not found or there was an error. ---`);
      return;
    }

    console.log('\n--- SUCCESS! --- ');
    console.log('Successfully fetched raw data from Notion. The structure is below:');
    console.log(JSON.stringify(rawTemplate, null, 2));

  } catch (error) {
    console.error('\n--- SCRIPT ERROR ---');
    console.error('The test script itself encountered an error:', error);
  }
}

testBuilder();