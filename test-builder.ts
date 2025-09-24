import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getTemplates } from './src/lib/notion-client';

async function testBuilder() {
  console.log('Fetching templates from Notion...');

  try {
    const { templates, keywords, platforms } = await getTemplates();

    if (!templates || templates.length === 0) {
      console.error('--- No templates found or there was an error. ---');
      return;
    }

    console.log('\n--- SUCCESS! --- ');
    console.log(`Successfully fetched ${templates.length} templates from Notion.`);
    console.log('First template:');
    console.log(JSON.stringify(templates[0], null, 2));

    console.log(`\nSuccessfully fetched ${keywords.length} keywords.`);
    console.log(`Successfully fetched ${platforms.length} platforms.`);

  } catch (error) {
    console.error('\n--- SCRIPT ERROR ---');
    console.error('The test script itself encountered an error:', error);
  }
}

testBuilder();
