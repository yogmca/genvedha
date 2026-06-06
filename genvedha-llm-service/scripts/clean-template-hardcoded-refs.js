#!/usr/bin/env node
/**
 * Clean hardcoded references from generic template
 * Removes all Coorg Masala, coffee, plantation references
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '../templates/generic-template');

// Replacement mappings
const replacements = [
  // Business name references
  { search: 'Coorg Masala Private Limited', replace: '{{BUSINESS_NAME}}', files: ['*.js', '*.css'] },
  { search: 'Coorg Masala', replace: '{{BUSINESS_NAME}}', files: ['*.js', '*.css'] },
  
  // Region-specific references
  { search: 'from the heart of Coorg', replace: 'from trusted sources', files: ['*.js'] },
  { search: 'from Coorg plantations', replace: 'from trusted sources', files: ['*.js'] },
  { search: 'Coorg plantations', replace: 'trusted sources', files: ['*.js'] },
  { search: 'Premium quality Coorg black pepper', replace: 'Premium quality black pepper', files: ['*.js'] },
  { search: 'Authentic Ceylon cinnamon from Coorg plantations', replace: 'Authentic Ceylon cinnamon from trusted sources', files: ['*.js'] },
  { search: 'Pure organic turmeric powder from Coorg', replace: 'Pure organic turmeric powder', files: ['*.js'] },
  { search: 'Freshly ground Coorg coffee powder', replace: 'Freshly ground coffee powder', files: ['*.js'] },
  { search: 'Premium Coorg coffee powder', replace: 'Premium coffee powder', files: ['*.js'] },
  { search: 'Bulk pack of premium Coorg black pepper', replace: 'Bulk pack of premium black pepper', files: ['*.js'] },
  { search: 'Coorg, India', replace: '{{LOCATION}}', files: ['*.js'] },
  
  // Coffee and spices references
  { search: 'spices and coffee', replace: '{{PRODUCT_TYPE_PLURAL}}', files: ['*.js'] },
  { search: 'Indian spices and coffee', replace: '{{PRODUCT_TYPE_PLURAL}}', files: ['*.js'] },
  { search: 'coffee capital of India', replace: 'trusted region', files: ['*.js'] },
  
  // Plantation references
  { search: 'Direct from plantations to your kitchen', replace: 'Direct from source to your kitchen', files: ['*.js'] },
  { search: 'Pure and natural spices from Coorg plantations', replace: 'Pure and natural {{PRODUCT_TYPE}}s from trusted sources', files: ['*.js'] },
  
  // Email references
  { search: 'admin@coorgmasala.com', replace: 'admin@{{DOMAIN}}', files: ['*.js'] },
  { search: 'yogemca@gmail.com', replace: '{{CONTACT_EMAIL}}', files: ['*.js'] },
  
  // UI text
  { search: 'Premium Coorg Masala', replace: 'Premium {{BUSINESS_NAME}}', files: ['*.js'] },
  { search: 'Join Coorg Masala today', replace: 'Join {{BUSINESS_NAME}} today', files: ['*.js'] },
  { search: 'Login to your Coorg Masala account', replace: 'Login to your {{BUSINESS_NAME}} account', files: ['*.js'] },
  { search: 'Why Choose Coorg Masala?', replace: 'Why Choose {{BUSINESS_NAME}}?', files: ['*.js'] },
  { search: 'Premium Indian spices from the heart of Coorg', replace: 'Premium {{PRODUCT_TYPE_PLURAL}} from trusted sources', files: ['*.js'] },
  
  // API messages
  { search: 'New Export Inquiry - Coorg Masala', replace: 'New Export Inquiry - {{BUSINESS_NAME}}', files: ['*.js'] },
  { search: 'Export Inquiry - Coorg Masala', replace: 'Export Inquiry - {{BUSINESS_NAME}}', files: ['*.js'] },
  { search: 'This inquiry was submitted through the Coorg Masala Export page', replace: 'This inquiry was submitted through the {{BUSINESS_NAME}} Export page', files: ['*.js'] },
  
  // Remaining Coorg references (do this last)
  { search: 'Coorg', replace: '{{REGION}}', files: ['*.js'] },
];

// Recursively find all files matching patterns
function findFiles(dir, patterns, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (!['node_modules', '.git', 'build', 'dist'].includes(file)) {
        findFiles(filePath, patterns, results);
      }
    } else {
      // Check if file matches any pattern
      for (const pattern of patterns) {
        const ext = pattern.replace('*.', '');
        if (filePath.endsWith(`.${ext}`)) {
          results.push(filePath);
          break;
        }
      }
    }
  }
  
  return results;
}

// Apply replacements to a file
function processFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { search, replace } of replacements) {
      const regex = new RegExp(escapeRegex(search), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
function main() {
  console.log('🧹 Cleaning hardcoded references from generic template...\n');
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  // Group replacements by file patterns
  const patternGroups = {};
  for (const replacement of replacements) {
    for (const pattern of replacement.files) {
      if (!patternGroups[pattern]) {
        patternGroups[pattern] = [];
      }
      patternGroups[pattern].push(replacement);
    }
  }
  
  // Process each pattern group
  for (const [pattern, reps] of Object.entries(patternGroups)) {
    console.log(`📝 Processing ${pattern} files...`);
    const files = findFiles(TEMPLATE_DIR, [pattern]);
    
    for (const file of files) {
      totalFiles++;
      if (processFile(file, reps)) {
        modifiedFiles++;
        const relativePath = path.relative(TEMPLATE_DIR, file);
        console.log(`   ✓ ${relativePath}`);
      }
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  
  // Verify cleanup
  console.log('\n🔍 Verifying cleanup...');
  const jsFiles = findFiles(TEMPLATE_DIR, ['*.js']);
  let remainingIssues = 0;
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const issues = [];
    
    if (content.includes('Coorg') && !content.includes('{{REGION}}')) {
      issues.push('Coorg reference found');
    }
    if (content.includes('coorgmasala')) {
      issues.push('coorgmasala reference found');
    }
    
    if (issues.length > 0) {
      remainingIssues++;
      const relativePath = path.relative(TEMPLATE_DIR, file);
      console.log(`   ⚠️  ${relativePath}: ${issues.join(', ')}`);
    }
  }
  
  if (remainingIssues === 0) {
    console.log('   ✓ No hardcoded references found!');
  } else {
    console.log(`\n   ⚠️  ${remainingIssues} files may still have issues`);
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Test app generation: node test-generic-template.js');
  console.log('   2. Verify placeholders are replaced correctly');
  console.log('   3. Check that MongoDB auto-initializes with sample data\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { findFiles, processFile, escapeRegex };
