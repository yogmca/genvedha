/**
 * App Generator Service
 * Orchestrates the entire app generation process
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ClaudeClient = require('./claude-client');
const TemplateManager = require('./template-manager');
const EnvGenerator = require('./env-generator');
const CodeCustomizer = require('./code-customizer');
const { config } = require('../config');

class AppGenerator {
  constructor() {
    this.claudeClient = new ClaudeClient();
    this.templateManager = new TemplateManager();
    this.envGenerator = new EnvGenerator();
    this.codeCustomizer = new CodeCustomizer();
    this.generatedAppsPath = config.generatedApps.basePath;
    this.activeGenerations = new Map();
  }

  /**
   * Initialize the app generator
   */
  async initialize() {
    try {
      console.log('🚀 Initializing GenVedha App Generator...');
      
      // Initialize template manager
      await this.templateManager.initialize();
      
      // Ensure generated apps directory exists
      await fs.ensureDir(this.generatedAppsPath);
      
      console.log('✅ App Generator initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize App Generator:', error.message);
      throw error;
    }
  }

  /**
   * Generate a new e-commerce app based on user requirements
   * @param {Object} params - Generation parameters
   * @param {string} params.userRequirements - Natural language requirements
   * @param {Object} params.credentials - User credentials (Razorpay, MongoDB, Gmail)
   * @param {string} params.userId - User ID for tracking
   * @returns {Promise<Object>} Generation result
   */
  async generateApp(params) {
    const generationId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎨 Starting App Generation: ${generationId}`);
      console.log(`${'='.repeat(60)}\n`);

      // Track active generation
      this.activeGenerations.set(generationId, {
        status: 'started',
        startTime,
        params
      });

      // Step 1: Get template information
      console.log('📋 Step 1: Analyzing template...');
      const templateInfo = await this.templateManager.getTemplateInfo();
      const templateFiles = await this.templateManager.getTemplateFiles();

      this._updateGenerationStatus(generationId, 'analyzing', 10);

      // Step 2: Generate customizations using Claude AI
      console.log('🤖 Step 2: Generating customizations with Claude AI...');
      const customizationResult = await this.claudeClient.generateCustomizations({
        userRequirements: params.userRequirements,
        templateInfo: {
          ...templateInfo,
          fileCount: templateFiles.length
        }
      });

      const customizations = customizationResult.customizations;
      this._updateGenerationStatus(generationId, 'customizing', 30);

      // Step 3: Create app directory
      console.log('📁 Step 3: Creating app directory...');
      const appName = this._sanitizeAppName(customizations.appName);
      const appPath = path.join(this.generatedAppsPath, `${appName}-${generationId.slice(0, 8)}`);
      
      await this.templateManager.copyTemplate(appPath);
      this._updateGenerationStatus(generationId, 'copying', 40);

      // Step 4: Generate environment configuration
      console.log('⚙️  Step 4: Generating environment configuration...');
      const envConfig = await this.envGenerator.generateEnvFile({
        appPath,
        customizations,
        credentials: params.credentials
      });
      this._updateGenerationStatus(generationId, 'configuring', 60);

      // Step 5: Apply code customizations
      console.log('✏️  Step 5: Applying code customizations...');
      const codeModifications = await this.codeCustomizer.applyCustomizations({
        appPath,
        customizations,
        templateFiles
      });
      this._updateGenerationStatus(generationId, 'modifying', 80);

      // Step 6: Install dependencies (optional, can be done later)
      console.log('📦 Step 6: Preparing package.json...');
      await this._updatePackageJson(appPath, customizations);
      this._updateGenerationStatus(generationId, 'finalizing', 90);

      // Step 7: Generate documentation
      console.log('📝 Step 7: Generating documentation...');
      await this._generateDocumentation(appPath, customizations, envConfig);

      const duration = Date.now() - startTime;
      this._updateGenerationStatus(generationId, 'completed', 100);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ App Generation Completed: ${generationId}`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`📂 Location: ${appPath}`);
      console.log(`${'='.repeat(60)}\n`);

      // Clean up tracking
      this.activeGenerations.delete(generationId);

      return {
        success: true,
        generationId,
        appName: customizations.appName,
        appPath,
        duration,
        customizations,
        envConfig,
        codeModifications,
        metadata: {
          claudeTokens: customizationResult.metadata.tokensUsed,
          filesModified: codeModifications.filesModified,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ App Generation Failed: ${generationId}`, error.message);
      
      this._updateGenerationStatus(generationId, 'failed', 0, error.message);
      this.activeGenerations.delete(generationId);

      throw {
        success: false,
        generationId,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get generation status
   */
  getGenerationStatus(generationId) {
    return this.activeGenerations.get(generationId) || null;
  }

  /**
   * Get all active generations
   */
  getActiveGenerations() {
    return Array.from(this.activeGenerations.entries()).map(([id, data]) => ({
      generationId: id,
      ...data
    }));
  }

  /**
   * Update generation status
   */
  _updateGenerationStatus(generationId, status, progress, error = null) {
    const generation = this.activeGenerations.get(generationId);
    if (generation) {
      generation.status = status;
      generation.progress = progress;
      generation.lastUpdate = Date.now();
      if (error) generation.error = error;
    }
  }

  /**
   * Sanitize app name for directory creation
   */
  _sanitizeAppName(appName) {
    return appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  /**
   * Update package.json with app-specific information
   */
  async _updatePackageJson(appPath, customizations) {
    try {
      const packageJsonPath = path.join(appPath, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);

      // Update package.json
      packageJson.name = this._sanitizeAppName(customizations.appName);
      packageJson.description = customizations.seoConfig?.metaDescription || 
                                `${customizations.appName} - E-commerce Application`;
      packageJson.version = '1.0.0';
      packageJson.author = customizations.brandingChanges?.companyName || 'GenVedha';

      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log('✅ package.json updated');
    } catch (error) {
      console.warn('⚠️  Failed to update package.json:', error.message);
    }
  }

  /**
   * Generate documentation for the generated app
   */
  async _generateDocumentation(appPath, customizations, envConfig) {
    try {
      const readmePath = path.join(appPath, 'GENERATED_APP_README.md');
      
      const readme = `# ${customizations.appName}

## Generated by GenVedha LLM Service

**Business Type:** ${customizations.businessType}
**Generated:** ${new Date().toISOString()}

## About This Application

${customizations.seoConfig?.metaDescription || 'E-commerce application generated using AI-powered customization.'}

## Features

${Object.entries(customizations.features || {})
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `- ✅ ${feature.replace(/([A-Z])/g, ' $1').trim()}`)
  .join('\n')}

## Product Categories

${(customizations.productCategories || []).map(cat => `- ${cat}`).join('\n')}

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

The \`.env\` file has been pre-configured with your credentials:
- MongoDB connection
- Razorpay payment gateway
- Gmail SMTP for emails

**IMPORTANT:** Review and update the \`.env\` file with your actual credentials before deploying.

### 3. Start the Application

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Default Admin Credentials:**
  - Email: ${customizations.adminConfig?.defaultAdminEmail || 'admin@example.com'}
  - Password: ${customizations.adminConfig?.defaultAdminPassword || 'Check .env file'}

## Branding

- **Company Name:** ${customizations.brandingChanges?.companyName}
- **Tagline:** ${customizations.brandingChanges?.tagline}
- **Primary Color:** ${customizations.brandingChanges?.primaryColor}
- **Secondary Color:** ${customizations.brandingChanges?.secondaryColor}

## Configuration Files

- \`.env\` - Environment variables (credentials, API keys)
- \`package.json\` - Dependencies and scripts
- \`server.js\` - Main server file

## Deployment

### Deploy to AWS EC2

1. Set up an EC2 instance (Ubuntu 20.04 or later)
2. Install Node.js and MongoDB
3. Clone this repository to the server
4. Configure environment variables
5. Run \`npm install\` and \`npm start\`
6. Set up Nginx as reverse proxy
7. Configure SSL with Let's Encrypt

### Deploy to Heroku

\`\`\`bash
heroku create ${this._sanitizeAppName(customizations.appName)}
git push heroku main
heroku config:set $(cat .env | xargs)
\`\`\`

## Support

For support and customization requests, contact GenVedha support.

## License

Generated application - All rights reserved to the customer.

---

**Powered by GenVedha LLM Service**
`;

      await fs.writeFile(readmePath, readme);
      console.log('✅ Documentation generated');
    } catch (error) {
      console.warn('⚠️  Failed to generate documentation:', error.message);
    }
  }

  /**
   * Clean up old generated apps
   */
  async cleanupOldApps() {
    try {
      const maxAge = config.generatedApps.cleanupDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const apps = await fs.readdir(this.generatedAppsPath);
      let cleaned = 0;

      for (const app of apps) {
        const appPath = path.join(this.generatedAppsPath, app);
        const stats = await fs.stat(appPath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.remove(appPath);
          cleaned++;
          console.log(`🗑️  Cleaned up old app: ${app}`);
        }
      }

      console.log(`✅ Cleanup complete: ${cleaned} apps removed`);
      return cleaned;
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return 0;
    }
  }
}

module.exports = AppGenerator;
