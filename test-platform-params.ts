#!/usr/bin/env tsx

/**
 * Test platform parameter application
 */
async function testPlatformParams() {
  try {
    console.log('🧪 Testing platform parameter application...\n');

    // Test with Fantasy Animal template (has platform params)
    const payload = {
      base_prompt: "a charming [animal] with [magical_feature], in the style of [art_style]",
      promptValues: {
        animal: "a red panda",
        magical_feature: "glowing runes", 
        art_style: "Studio Ghibli"
      },
      platform: "midjourney",
      platformParams: {
        midjourney: "--ar 2:3 --s 250 --v 6.1",
        stable_diffusion: { steps: 20, cfg_scale: 5, sampler: "Euler a" },
        flux: { steps: 20, sampler: "euler" }
      }
    };

    console.log('📤 Sending payload:');
    console.log('   Platform:', payload.platform);  
    console.log('   Platform params:', payload.platformParams);
    console.log('   Base prompt:', payload.base_prompt);
    console.log();

    const response = await fetch('http://localhost:3001/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    console.log('📥 API Response:');
    console.log('   Platform:', result.platform);
    console.log('   Original prompt:', result.originalPrompt);
    console.log('\n🎨 Enhanced prompt:');
    console.log(result.enhancedPrompt);
    console.log();

    // Check if parameters were applied
    const hasParams = result.enhancedPrompt.includes('--ar 2:3') || 
                     result.enhancedPrompt.includes('--s 250') ||
                     result.enhancedPrompt.includes('--v 6.1');
                     
    if (hasParams) {
      console.log('✅ Platform parameters found in enhanced prompt!');
    } else {
      console.log('❌ Platform parameters NOT found in enhanced prompt');
      console.log('   Expected to find: --ar 2:3 --s 250 --v 6.1');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPlatformParams();