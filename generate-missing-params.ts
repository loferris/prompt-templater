#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * Generate missing platform parameters for templates 5-20
 */
function generateMissingPlatformParams() {
  console.log('🛠️ Generating missing platform parameters...');

  // Read current parameters to see the highest ID
  const currentParams = fs.readFileSync('data/normalized/template_platform_parameters.csv', 'utf-8');
  const lines = currentParams.trim().split('\n');
  let nextId = 11; // Last ID in the file is 10

  // Platform parameter templates by category
  const paramTemplates = {
    // Character templates
    Character: {
      midjourney: '--ar 2:3 --s 300 --v 6.1',
      stable_diffusion: { steps: 25, cfg_scale: 6, sampler: 'Euler a', width: 512, height: 768 },
      flux: { steps: 20, sampler: 'euler', width: 512, height: 768 }
    },
    // Portrait templates  
    Portrait: {
      midjourney: '--ar 3:4 --s 250 --v 6.1 --style raw',
      stable_diffusion: { steps: 30, cfg_scale: 7, sampler: 'DPM++ 2M Karras', width: 512, height: 768 },
      flux: { steps: 25, sampler: 'heun', width: 512, height: 768 }
    },
    // Landscape templates
    Landscape: {
      midjourney: '--ar 16:9 --s 400 --v 6.1',
      stable_diffusion: { steps: 25, cfg_scale: 8, sampler: 'Euler a', width: 1024, height: 576 },
      flux: { steps: 20, sampler: 'euler', width: 1024, height: 576 }
    },
    // Interior templates
    Interior: {
      midjourney: '--ar 3:2 --s 200 --v 6.1',
      stable_diffusion: { steps: 25, cfg_scale: 6, sampler: 'Euler a', width: 768, height: 512 },
      flux: { steps: 20, sampler: 'ipndm', width: 768, height: 512 }
    },
    // Object templates
    Object: {
      midjourney: '--ar 1:1 --s 300 --v 6.1',
      stable_diffusion: { steps: 25, cfg_scale: 7, sampler: 'DPM++ 2M Karras', width: 512, height: 512 },
      flux: { steps: 20, sampler: 'euler', width: 512, height: 512 }
    },
    // Style templates
    Style: {
      midjourney: '--ar 16:9 --s 350 --v 6.1',
      stable_diffusion: { steps: 30, cfg_scale: 7.5, sampler: 'Euler a', width: 768, height: 512 },
      flux: { steps: 25, sampler: 'euler', width: 768, height: 512 }
    }
  };

  // Read templates to get categories
  const templatesCSV = fs.readFileSync('data/normalized/templates_normalized.csv', 'utf-8');
  const templateLines = templatesCSV.trim().split('\n').slice(1); // Skip header
  
  const newParams: string[] = [];

  // Generate params for templates 5-20
  for (let templateId = 5; templateId <= 20; templateId++) {
    const templateLine = templateLines.find(line => line.startsWith(`${templateId},`));
    if (!templateLine) continue;

    // Extract category from template line
    const parts = templateLine.split(',');
    const category = parts[6]; // category is the 7th column

    const params = paramTemplates[category as keyof typeof paramTemplates] || paramTemplates.Style;

    // Add Midjourney params
    newParams.push(`${nextId++},${templateId},1,${params.midjourney}`);
    
    // Add Stable Diffusion params
    const sdParamsJSON = JSON.stringify(params.stable_diffusion).replace(/"/g, '""');
    newParams.push(`${nextId++},${templateId},2,"${sdParamsJSON}"`);
    
    // Add Flux params
    const fluxParamsJSON = JSON.stringify(params.flux).replace(/"/g, '""');
    newParams.push(`${nextId++},${templateId},3,"${fluxParamsJSON}"`);
  }

  // Append to the existing file
  const newContent = currentParams + '\n' + newParams.join('\n') + '\n';
  fs.writeFileSync('data/normalized/template_platform_parameters.csv', newContent);

  console.log(`✅ Added ${newParams.length} platform parameter entries`);
  console.log(`📊 Generated params for templates 5-20 across all 3 platforms`);
}

generateMissingPlatformParams();