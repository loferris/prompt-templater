#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Project Structure...\n');

// Check if old database-schemas folder exists
const oldPath = path.join(__dirname, 'database-schemas');
if (fs.existsSync(oldPath)) {
  console.log('❌ Old database-schemas folder still exists');
  console.log('   Please remove it with: rm -rf database-schemas/\n');
} else {
  console.log('✅ Old database-schemas folder removed\n');
}

// Check new data structure
const dataPath = path.join(__dirname, 'data');
const normalizedPath = path.join(dataPath, 'normalized');
const notionPath = path.join(dataPath, 'notion');

console.log('📁 Checking data directory structure:');

if (fs.existsSync(dataPath)) {
  console.log('✅ data/ folder exists');
  
  if (fs.existsSync(normalizedPath)) {
    console.log('✅ data/normalized/ folder exists');
    
    const normalizedFiles = [
      'templates_normalized.csv',
      'keywords.csv',
      'platforms.csv',
      'template_keywords.csv',
      'template_platform_parameters.csv'
    ];
    
    normalizedFiles.forEach(file => {
      const filePath = path.join(normalizedPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✅ ${file} (${stats.size} bytes)`);
      } else {
        console.log(`  ❌ ${file} - MISSING`);
      }
    });
  } else {
    console.log('❌ data/normalized/ folder missing');
  }
  
  if (fs.existsSync(notionPath)) {
    console.log('✅ data/notion/ folder exists');
    
    const templatesFile = path.join(notionPath, 'templates.csv');
    if (fs.existsSync(templatesFile)) {
      const stats = fs.statSync(templatesFile);
      console.log(`  ✅ templates.csv (${stats.size} bytes)`);
    } else {
      console.log('  ❌ templates.csv - MISSING');
    }
  } else {
    console.log('❌ data/notion/ folder missing');
  }
} else {
  console.log('❌ data/ folder missing');
}

// Check src structure
console.log('\n📂 Checking src directory structure:');
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('✅ src/ folder exists');
  
  const srcDirs = ['lib', 'components', 'app'];
  srcDirs.forEach(dir => {
    const dirPath = path.join(srcPath, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`  ✅ src/${dir}/`);
    } else {
      console.log(`  ❌ src/${dir}/ - MISSING`);
    }
  });
  
  // Check key files
  const keyFiles = [
    'lib/types.ts',
    'lib/csv-utils.ts',
    'lib/validation.ts',
    'lib/type-guards.ts',
    'lib/notion-client.ts',
    'lib/data-loader.ts'
  ];
  
  console.log('\n📄 Checking key library files:');
  keyFiles.forEach(file => {
    const filePath = path.join(srcPath, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✅ src/${file} (${stats.size} bytes)`);
    } else {
      console.log(`  ❌ src/${file} - MISSING`);
    }
  });
} else {
  console.log('❌ src/ folder missing');
}

// Check configuration files
console.log('\n⚙️  Checking configuration files:');
const configFiles = [
  'tailwind.config.ts',
  'tsconfig.json',
  'next.config.mjs',
  '.env.local',
  '.env.example',
  'package.json'
];

configFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
  }
});

// Check for any remaining references to old paths
console.log('\n🔍 Scanning for old path references...');

function scanFileForOldPaths(filePath, relativePath) {
  try {
    if (filePath.includes('node_modules') || filePath.includes('.git')) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('database-schemas') || content.includes('database_schemas')) {
      console.log(`  ⚠️  Old path reference found in: ${relativePath}`);
    }
  } catch (error) {
    // Ignore files we can't read
  }
}

function scanDirectory(dirPath, basePath = __dirname) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const relativePath = path.relative(basePath, itemPath);
      
      if (fs.statSync(itemPath).isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(itemPath, basePath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.md')) {
        scanFileForOldPaths(itemPath, relativePath);
      }
    });
  } catch (error) {
    // Ignore directories we can't read
  }
}

scanDirectory(__dirname);

console.log('\n🎉 Structure validation complete!');
console.log('\n📋 Summary:');
console.log('- Old database-schemas folder should be removed');
console.log('- New data/ folder structure should exist');
console.log('- All TypeScript library files should be in src/lib/');
console.log('- Configuration files should be updated for new structure');
console.log('- No old path references should remain in code');