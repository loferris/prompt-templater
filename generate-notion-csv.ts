#!/usr/bin/env tsx

import { saveNotionCSV } from './src/lib/csv-utils';

/**
 * Script to generate Notion-optimized CSV from normalized data
 */
async function main() {
  try {
    console.log('Generating Notion CSV from normalized data...');
    
    // Generate and save the CSV
    await saveNotionCSV();
    
    console.log('✅ Done! Check data/notion/templates_generated.csv');
    
  } catch (error) {
    console.error('❌ Error generating Notion CSV:', error);
    process.exit(1);
  }
}

main();