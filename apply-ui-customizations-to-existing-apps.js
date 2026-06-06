/**
 * Apply UI Customizations to Existing Generated Apps
 * Run this to update already generated apps with new UI customizations
 */

const fs = require('fs-extra');
const path = require('path');
const UICustomizer = require('./genvedha-llm-service/services/ui-customizer');

async function applyUICustomizations() {
  console.log('🎨 Applying UI Customizations to Existing Apps\n');

  const uiCustomizer = new UICustomizer();
  const generatedAppsPath = path.join(__dirname, 'genvedha-llm-service', 'generated-apps');

  // Check if directory exists
  if (!await fs.pathExists(generatedAppsPath)) {
    console.error('❌ Generated apps directory not found');
    return;
  }

  // Get all app directories
  const apps = await fs.readdir(generatedAppsPath);

  for (const appDir of apps) {
    const appPath = path.join(generatedAppsPath, appDir);
    const stat = await fs.stat(appPath);

    if (!stat.isDirectory()) continue;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Processing: ${appDir}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Read app config to get customizations
      const configPath = path.join(appPath, 'src', 'config', 'app-config.json');
      
      if (!await fs.pathExists(configPath)) {
        console.warn(`⚠️  No app-config.json found for ${appDir}, skipping`);
        continue;
      }

      const appConfig = await fs.readJson(configPath);

      // Create customizations object
      const customizations = {
        appName: appConfig.appName || appDir,
        businessType: appConfig.businessType || 'general',
        brandingChanges: appConfig.branding || {
          companyName: appConfig.appName || appDir,
          tagline: 'Your tagline here',
          primaryColor: '#0066ff',
          secondaryColor: '#ff6b35',
          logoText: appConfig.appName || appDir
        },
        productCategories: appConfig.categories || [],
        features: appConfig.features || {},
        seoConfig: {
          metaTitle: appConfig.appName || appDir,
          metaDescription: `${appConfig.appName} - E-commerce Store`,
          keywords: []
        }
      };

      // Apply UI customizations
      const result = await uiCustomizer.applyUICustomizations({
        appPath,
        customizations
      });

      console.log(`\n✅ UI Customizations Applied:`);
      console.log(`   Files Modified: ${result.filesModified}`);
      console.log(`   Components Updated: ${result.componentsUpdated.join(', ')}`);

    } catch (error) {
      console.error(`❌ Failed to customize ${appDir}:`, error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All Apps Processed!');
  console.log(`${'='.repeat(60)}\n`);
  console.log('🔄 Restart the frontend apps to see changes:');
  console.log('   ./stop-all-apps-local.sh');
  console.log('   ./start-generated-app-frontends.sh');
  console.log('');
}

// Run the script
applyUICustomizations().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
