#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { getTemplates } from './src/lib/notion-client';
import { loadTemplateData } from './src/lib/data-loader';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test script to verify Notion database connection
 */
async function main() {
  try {
    console.log('🧪 Testing Notion database connection...');
    console.log('Database ID:', process.env.NOTION_DATABASE_ID);
    
    // Test the data loader which should require Notion
    const result = await loadTemplateData();
    
    console.log(`✅ Connection successful!`);
    console.log(`📊 Data source: ${result.source}`);
    console.log(`📝 Templates found: ${result.templates.length}`);
    console.log(`🏷️  Keywords found: ${result.keywords.length}`);
    console.log(`🖥️  Platforms found: ${result.platforms.length}`);
    
    if (result.templates.length > 0) {
      console.log('\n📄 First template:');
      console.log(`   - Name: ${result.templates[0].name}`);
      console.log(`   - Category: ${result.templates[0].category}`);
      console.log(`   - Variables: ${result.templates[0].variables.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

main();