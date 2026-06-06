/**
 * Create Generic Template Script
 * ONE-TIME SCRIPT: Cleans the spice template and creates a generic version
 * Run this once, then commit the generic template to Git
 */

const fs = require('fs-extra');
const path = require('path');
const templateCleaner = require('../services/template-cleaner');

// Paths
const SOURCE_TEMPLATE = path.join(__dirname, '../templates/coorgmasala');
const GENERIC_TEMPLATE = path.join(__dirname, '../templates/generic-template');

// Business-specific content to replace
const REPLACEMENTS = {
  // Business names
  'Coorg Masala': '{{BUSINESS_NAME}}',
  'Coorg Spices': '{{BUSINESS_NAME}}',
  'coorg-spices': '{{BUSINESS_SLUG}}',
  'coorg_spices': '{{BUSINESS_SLUG_UNDERSCORE}}',
  
  // Taglines and descriptions
  'Authentic Spices from Coorg': '{{BUSINESS_TAGLINE}}',
  'Premium Quality Spices': '{{BUSINESS_TAGLINE}}',
  'Trusted Spices Exporter in India': '{{BUSINESS_TAGLINE}}',
  
  // Product types
  'spice': '{{PRODUCT_TYPE}}',
  'spices': '{{PRODUCT_TYPE_PLURAL}}',
  'Spice': '{{PRODUCT_TYPE_CAPITALIZED}}',
  'Spices': '{{PRODUCT_TYPE_PLURAL_CAPITALIZED}}',
  
  // Categories (will be replaced with dynamic categories)
  'Whole Spices': '{{CATEGORY_1}}',
  'Ground Spices': '{{CATEGORY_2}}',
  'Spice Blends': '{{CATEGORY_3}}',
  'Organic Spices': '{{CATEGORY_4}}',
  
  // Descriptions
  'aromatic spices': '{{PRODUCT_DESCRIPTION}}',
  'premium spices': '{{PRODUCT_DESCRIPTION}}',
  'authentic Indian spices': '{{PRODUCT_DESCRIPTION}}'
};

// Files that need special handling
const FILES_TO_CLEAN = [
  'frontend/src/pages/Home.js',
  'frontend/src/components/Navbar.js',
  'frontend/src/components/Footer.js',
  'frontend/public/index.html',
  'backend/models/Product.js',
  'backend/seed.js',
  'README.md',
  'package.json'
];

async function cleanFile(filePath) {
  try {
    if (!await fs.pathExists(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Apply replacements
    for (const [search, replace] of Object.entries(REPLACEMENTS)) {
      const regex = new RegExp(search, 'gi');
      if (content.match(regex)) {
        content = content.replace(regex, replace);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Cleaned: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  No changes: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

async function createGenericTemplate() {
  console.log('\n' + '='.repeat(70));
  console.log('🧹 Creating Generic Template from Spice Template');
  console.log('='.repeat(70) + '\n');

  try {
    // Step 1: Check if source template exists
    if (!await fs.pathExists(SOURCE_TEMPLATE)) {
      throw new Error(`Source template not found: ${SOURCE_TEMPLATE}`);
    }
    console.log(`✅ Source template found: ${SOURCE_TEMPLATE}\n`);

    // Step 2: Remove existing generic template if it exists
    if (await fs.pathExists(GENERIC_TEMPLATE)) {
      console.log('🗑️  Removing existing generic template...');
      await fs.remove(GENERIC_TEMPLATE);
    }

    // Step 3: Copy source template to generic template
    console.log('📋 Copying source template...');
    await fs.copy(SOURCE_TEMPLATE, GENERIC_TEMPLATE, {
      filter: (src) => {
        // Exclude node_modules, .git, generated files
        const exclude = ['node_modules', '.git', 'dist', 'build', '.env'];
        return !exclude.some(ex => src.includes(ex));
      }
    });
    console.log('✅ Template copied\n');

    // Step 4: Clean specific files
    console.log('🧹 Cleaning business-specific content...\n');
    let cleanedCount = 0;

    for (const file of FILES_TO_CLEAN) {
      const filePath = path.join(GENERIC_TEMPLATE, file);
      if (await cleanFile(filePath)) {
        cleanedCount++;
      }
    }

    console.log(`\n✅ Cleaned ${cleanedCount} files\n`);

    // Step 5: Create a README for the generic template
    const genericReadme = `# Generic E-commerce Template

This is a cleaned, generic version of the e-commerce template with all business-specific content replaced by placeholders.

## Placeholders Used

- \`{{BUSINESS_NAME}}\` - Company/business name
- \`{{BUSINESS_SLUG}}\` - URL-friendly business name
- \`{{BUSINESS_TAGLINE}}\` - Business tagline/slogan
- \`{{PRODUCT_TYPE}}\` - Product type (singular, lowercase)
- \`{{PRODUCT_TYPE_PLURAL}}\` - Product type (plural, lowercase)
- \`{{PRODUCT_TYPE_CAPITALIZED}}\` - Product type (singular, capitalized)
- \`{{PRODUCT_TYPE_PLURAL_CAPITALIZED}}\` - Product type (plural, capitalized)
- \`{{CATEGORY_1}}\`, \`{{CATEGORY_2}}\`, etc. - Product categories
- \`{{PRODUCT_DESCRIPTION}}\` - Product description

## Usage

This template is used by the GenVedha LLM Service to generate custom e-commerce applications.
The placeholders are replaced with actual business data during app generation.

## DO NOT MODIFY

This template is auto-generated. To update it, modify the source template and re-run:
\`\`\`bash
node scripts/create-generic-template.js
\`\`\`

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(GENERIC_TEMPLATE, 'GENERIC_TEMPLATE_README.md'),
      genericReadme,
      'utf8'
    );

    // Step 6: Validate placeholders exist
    console.log('🔍 Validating placeholders...\n');
    const sampleFile = path.join(GENERIC_TEMPLATE, 'frontend/src/pages/Home.js');
    if (await fs.pathExists(sampleFile)) {
      const content = await fs.readFile(sampleFile, 'utf8');
      const hasPlaceholders = content.includes('{{BUSINESS_NAME}}') || 
                             content.includes('{{PRODUCT_TYPE}}');
      
      if (hasPlaceholders) {
        console.log('✅ Placeholders found in template');
      } else {
        console.log('⚠️  Warning: No placeholders found. Manual review needed.');
      }
    }

    // Step 7: Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Generic Template Created Successfully!');
    console.log('='.repeat(70));
    console.log(`\n📂 Location: ${GENERIC_TEMPLATE}`);
    console.log('\n📋 Next Steps:');
    console.log('   1. Review the generic template for any remaining hardcoded content');
    console.log('   2. Test app generation with the generic template');
    console.log('   3. Commit the generic template to Git:');
    console.log('      git add templates/generic-template/');
    console.log('      git commit -m "Add generic e-commerce template"');
    console.log('\n');

    return true;
  } catch (error) {
    console.error('\n❌ Failed to create generic template:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the script
if (require.main === module) {
  createGenericTemplate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createGenericTemplate };
