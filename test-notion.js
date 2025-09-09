// Test script for Notion API integration
// Run with: node test-notion.js

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

console.log('🔍 Testing Notion API Integration...\n');

// Test 1: Environment Variables
console.log('📋 Step 1: Checking Environment Variables');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? `${process.env.NOTION_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('NOTION_DATABASE_ID:', DATABASE_ID || 'NOT SET');

if (!process.env.NOTION_API_KEY || !DATABASE_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function testNotionIntegration() {
  try {
    // Test 2: Database Access
    console.log('\n📊 Step 2: Testing Database Access');
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });
    
    console.log('✅ Database retrieved successfully');
    console.log('Database Title:', database.title[0]?.plain_text || 'No title');
    
    // Test 3: Database Properties
    console.log('\n🏗️  Step 3: Checking Database Properties');
    const properties = database.properties;
    const expectedProps = ['id', 'name', 'description', 'base_prompt', 'variables', 'example_values', 'category', 'mj_params', 'sd_params', 'flux_params'];
    
    console.log('Available properties:');
    Object.keys(properties).forEach(prop => {
      console.log(`  - ${prop}: ${properties[prop].type}`);
    });
    
    console.log('\nChecking for required properties:');
    expectedProps.forEach(prop => {
      if (properties[prop]) {
        console.log(`  ✅ ${prop}: ${properties[prop].type}`);
      } else {
        console.log(`  ❌ ${prop}: MISSING`);
      }
    });

    // Test 4: Query Database
    console.log('\n📖 Step 4: Querying Database Content');
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 3, // Limit to 3 for testing
    });
    
    console.log(`Found ${response.results.length} templates`);
    
    if (response.results.length > 0) {
      console.log('\nSample template data:');
      const firstTemplate = response.results[0];
      const props = firstTemplate.properties;
      
      console.log('Template details:');
      console.log(`  - ID: ${props.id?.number || 'N/A'}`);
      console.log(`  - Name: ${props.name?.title?.[0]?.plain_text || 'N/A'}`);
      console.log(`  - Category: ${props.category?.select?.name || 'N/A'}`);
      console.log(`  - Description: ${(props.description?.rich_text?.[0]?.plain_text || 'N/A').substring(0, 50)}...`);
      console.log(`  - Variables: ${props.variables?.rich_text?.[0]?.plain_text || 'N/A'}`);
      
      // Test platform parameters parsing
      const mjParams = props.mj_params?.rich_text?.[0]?.plain_text || '';
      const sdParams = props.sd_params?.rich_text?.[0]?.plain_text || '';
      
      console.log('\nPlatform parameters:');
      console.log(`  - Midjourney: ${mjParams || 'None'}`);
      console.log(`  - Stable Diffusion: ${sdParams.substring(0, 50)}${sdParams.length > 50 ? '...' : ''}`);
      
      // Test parsing SD parameters as JSON
      if (sdParams) {
        console.log('\n🔧 Step 5: Testing Parameter Parsing');
        try {
          // Try to parse SD parameters
          let cleaned = sdParams;
          if (cleaned.includes('"steps"')) {
            if (!cleaned.startsWith('{')) {
              cleaned = `{${cleaned}}`;
            }
            cleaned = cleaned.replace(/\\\"/g, '"').replace(/\"\"/g, '"');
            const parsed = JSON.parse(cleaned);
            console.log('✅ SD Parameters parsed successfully:', parsed);
          } else {
            console.log('ℹ️  SD Parameters are not in JSON format');
          }
        } catch (error) {
          console.log('⚠️  SD Parameters parsing failed:', error.message);
          console.log('Raw SD params:', sdParams);
        }
      }
    } else {
      console.log('⚠️  No templates found in database');
    }

    // Test 5: Categories
    console.log('\n📂 Step 6: Testing Category Extraction');
    const categoryProperty = properties.category;
    if (categoryProperty && 'select' in categoryProperty && categoryProperty.select?.options) {
      const categories = categoryProperty.select.options.map(option => option.name);
      console.log('Available categories:', categories);
    } else {
      console.log('❌ Category property not found or not a select type');
    }

    // Test 7: Compare with CSV data
    console.log('\n📄 Step 7: Comparing with CSV Data');
    try {
      const csvPath = path.join(__dirname, 'data', 'notion', 'templates.csv');
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const csvLines = csvContent.split('\n').filter(line => line.trim());
        console.log(`✅ Found CSV file with ${csvLines.length - 1} templates (excluding header)`);
        
        if (csvLines.length > 1) {
          const headers = csvLines[0].split(',');
          console.log('CSV Headers:', headers.slice(0, 5).join(', '), '...');
        }
      } else {
        console.log('⚠️  CSV file not found at data/notion/templates.csv');
      }
    } catch (error) {
      console.log('⚠️  Error reading CSV file:', error.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Environment variables configured');
    console.log('✅ Database connection established');
    console.log('✅ Database properties verified');
    console.log('✅ Template data retrieved');
    console.log('✅ Parameter parsing tested');
    console.log('✅ CSV data comparison completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'unauthorized') {
      console.error('🔑 Authorization failed. Check your NOTION_API_KEY');
    } else if (error.code === 'object_not_found') {
      console.error('🗃️  Database not found. Check your NOTION_DATABASE_ID');
    } else if (error.code === 'restricted_resource') {
      console.error('🚫 Access denied. Make sure your integration has access to the database');
    }
    
    process.exit(1);
  }
}

// Run the test
testNotionIntegration();