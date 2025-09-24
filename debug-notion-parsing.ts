#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

async function debugNotionParsing() {
  console.log('🔍 Debugging Notion property parsing...\n');
  
  try {
    const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
    const dataSourceId = (db as any).data_sources?.[0]?.id;
    
    const response = await (notion.dataSources as any).query({
      data_source_id: dataSourceId,
    });
    
    const firstPage = response.results[0];
    console.log('📄 First page raw properties:');
    console.log(JSON.stringify(firstPage.properties, null, 2));
    
    console.log('\n🔍 Individual property analysis:');
    
    // Check each property type
    Object.entries(firstPage.properties).forEach(([key, prop]: [string, any]) => {
      console.log(`\n${key}:`);
      console.log(`  Type: ${prop.type}`);
      console.log(`  Value:`, prop[prop.type]);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugNotionParsing();