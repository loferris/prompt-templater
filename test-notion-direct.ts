#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { getTemplates } from './src/lib/notion-client';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNotionDirect() {
  try {
    console.log('🎯 Testing direct Notion client...');
    
    const result = await getTemplates();
    
    console.log('✅ Notion connection successful!');
    console.log(`📝 Templates: ${result.templates.length}`);
    console.log(`🏷️  Keywords: ${result.keywords.length}`);
    console.log(`🖥️  Platforms: ${result.platforms.length}`);
    
    if (result.templates.length > 0) {
      const template = result.templates[0];
      console.log('\n📄 First template:');
      console.log(`   - ID: ${template.id}`);
      console.log(`   - Name: ${template.name}`);
      console.log(`   - Category: ${template.category}`);
      console.log(`   - Variables: ${template.variables.join(', ')}`);
      console.log(`   - Keywords: ${template.keywords?.map(k => k.keyword).join(', ') || 'None'}`);
    }
    
  } catch (error) {
    console.error('❌ Direct Notion test failed:', error);
  }
}

testNotionDirect();