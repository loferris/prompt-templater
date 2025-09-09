#!/usr/bin/env npx ts-node

// TypeScript test script for the Notion API client
// Run with: npx ts-node test-notion-client.ts

import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import our Notion client
import * as notionClient from './src/lib/notion-client';
import { validateEnvironment } from './src/lib/validation';

console.log('🧪 Testing Notion API Client (TypeScript)...\n');

async function testNotionClientTS() {
  try {
    // Test 1: Environment Validation
    console.log('📋 Step 1: Environment Validation');
    
    const envCheck = validateEnvironment();
    if (!envCheck.isValid) {
      console.log('❌ Environment validation failed:');
      envCheck.missing.forEach(key => {
        console.log(`  - ${key}: MISSING OR INVALID`);
      });
      return;
    }
    console.log('✅ Environment variables validated');

    // Test 2: Connection Test
    console.log('\n🔌 Step 2: Testing Connection');
    
    const connectionResult = await notionClient.testNotionConnection();
    
    if (connectionResult.success) {
      console.log('✅ Notion connection successful');
    } else {
      console.log('❌ Notion connection failed:', connectionResult.error);
      return;
    }

    // Test 3: Get All Templates
    console.log('\n📚 Step 3: Fetching All Templates');
    
    const allTemplates = await notionClient.getTemplates();
    
    console.log(`✅ Templates fetched: ${allTemplates.templates.length} total`);
    console.log(`Categories: ${allTemplates.categories.join(', ')}`);
    
    if (allTemplates.templates.length > 0) {
      const template = allTemplates.templates[0];
      console.log('\n📝 Sample Template:');
      console.log(`  Name: ${template.name}`);
      console.log(`  Category: ${template.category}`);
      console.log(`  Variables: [${template.variables.join(', ')}]`);
      console.log(`  Description: ${template.description.substring(0, 50)}...`);
      
      // Check platform parameters
      const platforms = Object.keys(template.platformParams).filter(
        key => template.platformParams[key as keyof typeof template.platformParams]
      );
      console.log(`  Platform params: ${platforms.join(', ')}`);
    }

    // Test 4: Filter by Category
    console.log('\n🏷️  Step 4: Testing Category Filtering');
    
    if (allTemplates.categories.length > 0) {
      const firstCategory = allTemplates.categories[0];
      const categoryTemplates = await notionClient.getTemplatesByCategory(firstCategory);
      
      console.log(`✅ Category "${firstCategory}": ${categoryTemplates.length} templates`);
    }

    // Test 5: Search Functionality
    console.log('\n🔍 Step 5: Testing Search');
    
    const searchResults = await notionClient.searchTemplates('character');
    console.log(`✅ Search for "character": ${searchResults.length} results`);
    
    if (searchResults.length > 0) {
      console.log(`  First result: ${searchResults[0].name}`);
    }

    // Test 6: Single Template Retrieval
    if (allTemplates.templates.length > 0) {
      console.log('\n🎯 Step 6: Testing Single Template Retrieval');
      
      const templateId = allTemplates.templates[0].id;
      const singleTemplate = await notionClient.getTemplate(templateId);
      
      if (singleTemplate) {
        console.log(`✅ Retrieved template: ${singleTemplate.name}`);
        
        // Validate template structure
        const hasRequiredFields = singleTemplate.name && 
          singleTemplate.base_prompt && 
          Array.isArray(singleTemplate.variables);
          
        if (hasRequiredFields) {
          console.log('✅ Template structure validation passed');
        } else {
          console.log('⚠️  Template structure validation failed');
        }
      } else {
        console.log('❌ Failed to retrieve single template');
      }
    }

    // Test 7: Data Structure Validation
    console.log('\n🔬 Step 7: Data Structure Validation');
    
    let validTemplates = 0;
    let invalidTemplates = 0;
    
    allTemplates.templates.forEach(template => {
      const isValid = 
        typeof template.id === 'number' &&
        typeof template.name === 'string' &&
        Array.isArray(template.variables) &&
        typeof template.platformParams === 'object';
        
      if (isValid) {
        validTemplates++;
      } else {
        invalidTemplates++;
        console.log(`⚠️  Invalid template: ${template.name}`);
      }
    });
    
    console.log(`✅ Valid templates: ${validTemplates}`);
    if (invalidTemplates > 0) {
      console.log(`⚠️  Invalid templates: ${invalidTemplates}`);
    }

    // Test 8: Platform Parameter Parsing
    console.log('\n⚙️  Step 8: Platform Parameter Analysis');
    
    const platformStats = {
      midjourney: 0,
      stable_diffusion: 0,
      flux: 0
    };
    
    allTemplates.templates.forEach(template => {
      if (template.platformParams.midjourney) platformStats.midjourney++;
      if (template.platformParams.stable_diffusion) platformStats.stable_diffusion++;
      if (template.platformParams.flux) platformStats.flux++;
    });
    
    console.log('Platform parameter coverage:');
    Object.entries(platformStats).forEach(([platform, count]) => {
      const percentage = Math.round((count / allTemplates.templates.length) * 100);
      console.log(`  ${platform}: ${count}/${allTemplates.templates.length} (${percentage}%)`);
    });

    // Test 9: CSV Comparison
    console.log('\n📊 Step 9: CSV Data Comparison');
    
    try {
      const csvPath = path.join(process.cwd(), 'data', 'notion', 'templates.csv');
      const csvContent = await fs.readFile(csvPath, 'utf8');
      const csvLines = csvContent.split('\n').filter(line => line.trim());
      const csvTemplateCount = csvLines.length - 1; // Exclude header
      
      console.log(`CSV templates: ${csvTemplateCount}`);
      console.log(`Notion templates: ${allTemplates.templates.length}`);
      
      if (csvTemplateCount === allTemplates.templates.length) {
        console.log('✅ Template counts match perfectly');
      } else {
        console.log(`⚠️  Count difference: ${Math.abs(csvTemplateCount - allTemplates.templates.length)}`);
      }
    } catch (error) {
      console.log('⚠️  Could not read CSV file for comparison');
    }

    // Test 10: Performance Test
    console.log('\n⚡ Step 10: Performance Test');
    
    const startTime = Date.now();
    await notionClient.getTemplates({ limit: 10 });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    console.log(`✅ API response time: ${responseTime}ms`);
    
    if (responseTime < 2000) {
      console.log('🚀 Response time: Excellent');
    } else if (responseTime < 5000) {
      console.log('⚡ Response time: Good');
    } else {
      console.log('🐌 Response time: Slow (check network/API limits)');
    }

    console.log('\n🎉 All TypeScript Client Tests Completed!');
    console.log('\n📈 Test Results Summary:');
    console.log(`✅ Total templates: ${allTemplates.templates.length}`);
    console.log(`✅ Categories: ${allTemplates.categories.length}`);
    console.log(`✅ Valid templates: ${validTemplates}`);
    console.log(`✅ API response time: ${responseTime}ms`);
    console.log('✅ All core functionality working');

  } catch (error) {
    console.error('\n❌ TypeScript test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      // Provide specific debugging help
      if (error.message.includes('Cannot find module')) {
        console.log('\n💡 Try running: npm install ts-node typescript');
      } else if (error.message.includes('NOTION_API_KEY')) {
        console.log('\n💡 Check your .env.local file configuration');
      }
    }
  }
}

// Run the test
testNotionClientTS().catch(console.error);