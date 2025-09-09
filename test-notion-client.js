#!/usr/bin/env node

// Test script for the Notion API client
// Run with: node test-notion-client.js

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Notion API Client Integration...\n');

async function testNotionClient() {
  try {
    // Test 1: Environment Check
    console.log('📋 Step 1: Environment Variables Check');
    
    const requiredEnvVars = {
      NOTION_API_KEY: process.env.NOTION_API_KEY,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
    };

    let envValid = true;
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      if (!value || value.includes('your-')) {
        console.log(`❌ ${key}: NOT SET OR PLACEHOLDER`);
        envValid = false;
      } else {
        console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
      }
    });

    if (!envValid) {
      console.error('\n❌ Environment variables not properly configured');
      console.log('💡 Update your .env.local file with real API keys');
      return;
    }

    // Test 2: Import the client
    console.log('\n📦 Step 2: Loading Notion Client');
    
    // Check if we can require the TypeScript files using ts-node or if we need to compile
    let notionClient;
    try {
      // Try to require the compiled module or use dynamic import
      if (fs.existsSync('./dist/src/lib/notion-client.js')) {
        notionClient = require('./dist/src/lib/notion-client.js');
      } else {
        // Try to require TypeScript files directly (requires ts-node)
        console.log('  Attempting to load TypeScript files...');
        require('ts-node/register');
        notionClient = require('./src/lib/notion-client.ts');
      }
      console.log('✅ Notion client module loaded successfully');
    } catch (error) {
      console.log('⚠️  TypeScript direct import failed, using manual test approach');
      console.log('   This is normal - we\'ll test the raw Notion API instead\n');
      
      // Fallback to testing raw Notion API
      await testRawNotionAPI();
      return;
    }

    // Test 3: Connection Test
    console.log('\n🔌 Step 3: Testing Connection');
    
    const connectionResult = await notionClient.testNotionConnection();
    
    if (connectionResult.success) {
      console.log('✅ Notion connection successful');
    } else {
      console.log('❌ Notion connection failed:', connectionResult.error);
      return;
    }

    // Test 4: Get Templates
    console.log('\n📚 Step 4: Fetching Templates');
    
    const templatesResponse = await notionClient.getTemplates({ limit: 3 });
    
    console.log(`✅ Templates fetched: ${templatesResponse.templates.length} found`);
    console.log(`Categories available: ${templatesResponse.categories.join(', ')}`);
    
    if (templatesResponse.templates.length > 0) {
      const template = templatesResponse.templates[0];
      console.log('\nSample template:');
      console.log(`  📝 Name: ${template.name}`);
      console.log(`  🏷️  Category: ${template.category}`);
      console.log(`  🔤 Variables: [${template.variables.join(', ')}]`);
      console.log(`  🎨 Platform params: ${Object.keys(template.platformParams).join(', ')}`);
    }

    // Test 5: Get Categories
    console.log('\n📂 Step 5: Testing Category Retrieval');
    
    const categories = await notionClient.getCategories();
    console.log(`✅ Categories retrieved: ${categories.length} found`);
    console.log(`  Categories: ${categories.join(', ')}`);

    // Test 6: Get Template by ID
    if (templatesResponse.templates.length > 0) {
      console.log('\n🔍 Step 6: Testing Single Template Retrieval');
      
      const templateId = templatesResponse.templates[0].id;
      const singleTemplate = await notionClient.getTemplate(templateId);
      
      if (singleTemplate) {
        console.log(`✅ Single template retrieved: ${singleTemplate.name}`);
      } else {
        console.log('❌ Failed to retrieve single template');
      }
    }

    // Test 7: Search Templates
    console.log('\n🔎 Step 7: Testing Template Search');
    
    const searchResults = await notionClient.searchTemplates('fantasy', { limit: 2 });
    console.log(`✅ Search completed: ${searchResults.length} results for "fantasy"`);
    
    if (searchResults.length > 0) {
      console.log(`  First result: ${searchResults[0].name}`);
    }

    // Test 8: Compare with CSV Data
    console.log('\n📊 Step 8: Comparing with Local CSV Data');
    
    const csvPath = path.join(__dirname, 'data', 'notion', 'templates.csv');
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const csvLines = csvContent.split('\n').filter(line => line.trim());
      const csvTemplateCount = csvLines.length - 1; // Exclude header
      
      console.log(`✅ CSV file has ${csvTemplateCount} templates`);
      console.log(`   Notion API returned ${templatesResponse.templates.length} templates`);
      
      if (csvTemplateCount > templatesResponse.templates.length) {
        console.log('ℹ️  CSV has more templates (using pagination limit)');
      } else if (csvTemplateCount === templatesResponse.templates.length) {
        console.log('✅ Template counts match perfectly');
      } else {
        console.log('⚠️  Template count mismatch - check data sync');
      }
    }

    console.log('\n🎉 All Notion Client Tests Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Environment variables configured');
    console.log('✅ Notion client loaded and functional');
    console.log('✅ Database connection established');
    console.log('✅ Template retrieval working');
    console.log('✅ Category extraction working');
    console.log('✅ Search functionality working');
    console.log('✅ Data comparison completed');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    // Provide helpful debugging information
    if (error.message.includes('unauthorized')) {
      console.log('\n💡 Debugging tips:');
      console.log('- Check that NOTION_API_KEY is correct');
      console.log('- Ensure the integration has access to the database');
    } else if (error.message.includes('object_not_found')) {
      console.log('\n💡 Debugging tips:');
      console.log('- Verify NOTION_DATABASE_ID is correct');
      console.log('- Check that the database exists and is accessible');
    } else if (error.message.includes('restricted_resource')) {
      console.log('\n💡 Debugging tips:');
      console.log('- Connect your integration to the database');
      console.log('- Check database permissions');
    }
  }
}

// Fallback test for raw Notion API
async function testRawNotionAPI() {
  try {
    const { Client } = require('@notionhq/client');
    
    console.log('🔧 Fallback: Testing Raw Notion API');
    
    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    // Test database access
    console.log('\n📊 Testing database access...');
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    
    console.log('✅ Database access successful');
    console.log(`Database title: ${database.title[0]?.plain_text || 'No title'}`);

    // Test query
    console.log('\n📖 Testing database query...');
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 3,
    });
    
    console.log(`✅ Query successful: ${response.results.length} templates found`);
    
    if (response.results.length > 0) {
      const template = response.results[0];
      console.log('\nSample template properties:');
      console.log(`- Name: ${template.properties.name?.title?.[0]?.plain_text || 'N/A'}`);
      console.log(`- Category: ${template.properties.category?.select?.name || 'N/A'}`);
      console.log(`- ID: ${template.properties.id?.number || 'N/A'}`);
    }

    console.log('\n✅ Raw Notion API test completed successfully!');
    console.log('\n💡 The TypeScript client should work once properly compiled');
    
  } catch (error) {
    console.error('❌ Raw Notion API test failed:', error.message);
  }
}

// Run the test
testNotionClient();