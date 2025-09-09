#!/usr/bin/env node

// Simple Notion API test
console.log('🔍 Testing Notion API Integration...\n');

// Check if we can load environment variables
const fs = require('fs');

try {
  const envContent = fs.readFileSync('/home/loferris/Code/prompt-templater/.env.local', 'utf8');
  
  // Parse environment variables manually
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  console.log('📋 Environment Variables:');
  console.log('NOTION_API_KEY:', envVars.NOTION_API_KEY ? `${envVars.NOTION_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('NOTION_DATABASE_ID:', envVars.NOTION_DATABASE_ID || 'NOT SET');

  if (!envVars.NOTION_API_KEY || !envVars.NOTION_DATABASE_ID) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Test if Notion client package is available
  try {
    const { Client } = require('@notionhq/client');
    console.log('✅ @notionhq/client package found');

    // Initialize client
    const notion = new Client({
      auth: envVars.NOTION_API_KEY,
    });

    console.log('✅ Notion client initialized');

    // Test database connection
    async function testConnection() {
      try {
        console.log('\n📊 Testing database connection...');
        
        const database = await notion.databases.retrieve({
          database_id: envVars.NOTION_DATABASE_ID,
        });
        
        console.log('✅ Database connection successful!');
        console.log('Database title:', database.title[0]?.plain_text || 'No title');
        
        // Test query
        console.log('\n📖 Testing database query...');
        const response = await notion.databases.query({
          database_id: envVars.NOTION_DATABASE_ID,
          page_size: 2,
        });
        
        console.log(`✅ Query successful! Found ${response.results.length} templates`);
        
        if (response.results.length > 0) {
          const template = response.results[0];
          console.log('\nSample template:');
          console.log('- Name:', template.properties.name?.title?.[0]?.plain_text || 'N/A');
          console.log('- Category:', template.properties.category?.select?.name || 'N/A');
        }

        console.log('\n🎉 All tests passed! Notion integration is working correctly.');
        
      } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        
        if (error.code === 'unauthorized') {
          console.error('🔑 Check your NOTION_API_KEY');
        } else if (error.code === 'object_not_found') {
          console.error('🗃️  Check your NOTION_DATABASE_ID');
        }
      }
    }

    testConnection();

  } catch (error) {
    console.error('❌ @notionhq/client package not found:', error.message);
    console.log('💡 Run: npm install @notionhq/client');
  }

} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  console.log('💡 Make sure .env.local exists with NOTION_API_KEY and NOTION_DATABASE_ID');
}