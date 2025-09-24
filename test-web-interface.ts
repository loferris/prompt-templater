#!/usr/bin/env tsx

/**
 * Test the web interface endpoints
 */
async function testWebInterface() {
  try {
    console.log('🌐 Testing web interface...\n');

    // Test 1: Check if the server is running
    console.log('1️⃣ Checking server health...');
    const healthResponse = await fetch('http://localhost:3001');
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    // Test 2: Check templates API  
    console.log('\n2️⃣ Testing /api/templates...');
    const templatesResponse = await fetch('http://localhost:3001/api/templates');
    const templatesData = await templatesResponse.json();
    console.log(`   Status: ${templatesResponse.status}`);
    console.log(`   Templates loaded: ${templatesData.templates?.length || 0}`);
    
    if (templatesData.templates?.length > 0) {
      console.log(`   First template: "${templatesData.templates[0].name}"`);
    }

    // Test 3: Check if prompt-builder page is accessible
    console.log('\n3️⃣ Testing /prompt-builder page...');
    const promptBuilderResponse = await fetch('http://localhost:3001/prompt-builder');
    console.log(`   Status: ${promptBuilderResponse.status} ${promptBuilderResponse.statusText}`);
    
    console.log('\n✅ Web interface tests completed!');
    console.log('\n🚀 You can now visit:');
    console.log('   • Home page: http://localhost:3001');
    console.log('   • Prompt Builder: http://localhost:3001/prompt-builder');
    console.log('   • Templates: http://localhost:3001/templates');
    
  } catch (error) {
    console.error('❌ Web interface test failed:', error);
  }
}

testWebInterface();