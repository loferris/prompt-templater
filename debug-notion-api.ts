#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

// Load environment variables
dotenv.config({ path: '.env.local' });

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

async function debugNotionAPI() {
  console.log('🔍 Debugging Notion API calls...');
  console.log('API Key:', process.env.NOTION_API_KEY?.substring(0, 20) + '...');
  console.log('Database ID:', DATABASE_ID);
  
  try {
    // Test 1: Basic database retrieval
    console.log('\n1️⃣ Testing basic database retrieval...');
    const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
    console.log('✅ Database retrieved successfully');
    console.log('Database title:', (db as any).title?.[0]?.plain_text || 'No title');
    console.log('Created time:', db.created_time);
    console.log('Has data sources:', !!(db as any).data_sources);
    console.log('Data sources count:', (db as any).data_sources?.length || 0);
    
    // Test 2: Try the data source query (new API)
    console.log('\n2️⃣ Testing data source query...');
    const dataSourceId = (db as any).data_sources?.[0]?.id;
    
    if (dataSourceId) {
      console.log('Data source ID:', dataSourceId);
      const response = await (notion.dataSources as any).query({
        data_source_id: dataSourceId,
      });
      console.log('✅ Data source query successful');
      console.log('Results count:', response.results?.length || 0);
      
      if (response.results?.length > 0) {
        console.log('First result properties:', Object.keys(response.results[0].properties || {}));
      }
    } else {
      console.log('❌ No data sources found - trying legacy database query...');
      
      // Test 3: Try legacy database query
      console.log('\n3️⃣ Testing legacy database query...');
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
      });
      console.log('✅ Legacy query successful');
      console.log('Results count:', response.results?.length || 0);
      
      if (response.results?.length > 0) {
        console.log('First result properties:', Object.keys(response.results[0].properties || {}));
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  }
}

debugNotionAPI();