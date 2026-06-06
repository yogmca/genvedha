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
const UICustomizer = require('./ui-customizer');
const { config } = require('../config');

class AppGenerator {
  constructor() {
    this.claudeClient = new ClaudeClient();
    this.templateManager = new TemplateManager();
    this.envGenerator = new EnvGenerator();
    this.codeCustomizer = new CodeCustomizer();
    this.uiCustomizer = new UICustomizer();
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
                                                                        // Step 0: Validate input parameters before starting generation
      console.log('🔍 Step 0: Validating input parameters...');
      this._validateGenerationParams(params);

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

      // Step 3.5: Inject business content into generic template placeholders
      console.log('📝 Step 3.5: Injecting business content...');
      await this.injectBusinessContent(appPath, customizations);
      this._updateGenerationStatus(generationId, 'injecting', 45);

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
      this._updateGenerationStatus(generationId, 'modifying', 70);

      // Step 5.5: Apply UI customizations
      console.log('🎨 Step 5.5: Applying UI customizations...');
      const uiModifications = await this.uiCustomizer.applyUICustomizations({
        appPath,
        customizations
      });
      this._updateGenerationStatus(generationId, 'customizing-ui', 80);

      // Step 6: Install dependencies (optional, can be done later)
      console.log('📦 Step 6: Preparing package.json...');
      await this._updatePackageJson(appPath, customizations);
      this._updateGenerationStatus(generationId, 'finalizing', 90);

      // Step 7: Generate documentation
      console.log('📝 Step 7: Generating documentation...');
      await this._generateDocumentation(appPath, customizations, envConfig);

      // Step 8: Post-generation validation — ensure no unreplaced placeholders remain
      console.log('✅ Step 8: Validating generated app (no leftover placeholders)...');
      const validationResult = await this._validateGeneratedApp(appPath);
      if (validationResult.unreplacedCount > 0) {
        console.warn(`⚠️  Found ${validationResult.unreplacedCount} unreplaced placeholders in ${validationResult.filesWithIssues.length} files — auto-fixing...`);
        // Re-run injection to catch any stragglers
        await this.injectBusinessContent(appPath, customizations);
      } else {
        console.log('✅ No unreplaced placeholders found — app is clean!');
      }

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
        uiModifications,
        metadata: {
          claudeTokens: customizationResult.metadata.tokensUsed,
          filesModified: codeModifications.filesModified + uiModifications.filesModified,
          uiComponentsUpdated: uiModifications.componentsUpdated,
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
   * Inject business-specific content into generic template placeholders
   * Replaces ALL {{PLACEHOLDER}} patterns across ALL source files
   */
  async injectBusinessContent(appPath, customizations) {
    try {
      const businessName = customizations.appName || 'My Business';
      const businessSlug = businessName.toLowerCase().replace(/\s+/g, '-');
      const businessType = customizations.businessType || 'product';
      const tagline = customizations.brandingChanges?.tagline || 'Quality Products';
      const contactEmail = customizations.adminConfig?.defaultAdminEmail || `support@${businessSlug}.com`;
      const location = customizations.brandingChanges?.location || 'India';
      
      // Build dynamic category replacements from the categories array
      const categories = customizations.productCategories || [];
      const categoryReplacements = {};
      
      // First category
      if (categories.length > 0) {
        categoryReplacements['{{PRODUCT_CATEGORY}}'] = categories[0].toLowerCase().replace(/\s+/g, '-');
        categoryReplacements['{{PRODUCT_CATEGORY_NAME}}'] = categories[0];
      } else {
        categoryReplacements['{{PRODUCT_CATEGORY}}'] = 'general';
        categoryReplacements['{{PRODUCT_CATEGORY_NAME}}'] = 'General';
      }
      
      // Second category
      if (categories.length > 1) {
        categoryReplacements['{{PRODUCT_CATEGORY_2}}'] = categories[1].toLowerCase().replace(/\s+/g, '-');
        categoryReplacements['{{PRODUCT_CATEGORY_2_NAME}}'] = categories[1];
      } else {
        categoryReplacements['{{PRODUCT_CATEGORY_2}}'] = categoryReplacements['{{PRODUCT_CATEGORY}}'];
        categoryReplacements['{{PRODUCT_CATEGORY_2_NAME}}'] = categoryReplacements['{{PRODUCT_CATEGORY_NAME}}'];
      }
      
      // Handle any number of additional categories ({{PRODUCT_CATEGORY_N}} pattern)
      for (let i = 2; i < categories.length; i++) {
        categoryReplacements[`{{PRODUCT_CATEGORY_${i + 1}}}`] = categories[i].toLowerCase().replace(/\s+/g, '-');
        categoryReplacements[`{{PRODUCT_CATEGORY_${i + 1}_NAME}}`] = categories[i];
      }
      
      // Build product examples from categories
      const productExamples = categories.length > 0
        ? `Premium ${categories.join(', ')} and more.`
        : `Premium quality ${businessType} products.`;

      // Build a product name from the business type (e.g. "aquatic plants" -> "Aquatic Plant")
      const productName = businessType.charAt(0).toUpperCase() + businessType.slice(1).replace(/s$/, '');

      // Create comprehensive replacement map — covers ALL 14 template placeholders
      const replacements = {
        '{{BUSINESS_NAME}}': businessName,
        '{{BUSINESS_SLUG}}': businessSlug,
        '{{BUSINESS_TAGLINE}}': tagline,
        '{{TAGLINE}}': tagline,
        '{{PRODUCT_TYPE}}': businessType,
        '{{PRODUCT_TYPE_PLURAL}}': businessType + 's',
        '{{PRODUCT_TYPE_CAPITALIZED}}': businessType.charAt(0).toUpperCase() + businessType.slice(1),
        '{{PRODUCT_NAME}}': productName,
        '{{PRODUCT_DESCRIPTION}}': `premium quality ${businessType}`,
        '{{PRODUCT_EXAMPLES}}': productExamples,
        '{{CONTACT_EMAIL}}': contactEmail,
        '{{LOCATION}}': location,
        '{{REGION}}': location,
        '{{ORIGIN}}': location,
        ...categoryReplacements
      };
      
      // Recursively find ALL source files to inject content into
      // (not just a hardcoded list — scan the entire app directory)
      const allFiles = await this._getAllSourceFiles(appPath);
      
      let injectedCount = 0;
      
      for (const filePath of allFiles) {
        try {
          let content = await fs.readFile(filePath, 'utf8');
          let modified = false;
          
          // Replace all known placeholders
          for (const [placeholder, value] of Object.entries(replacements)) {
            if (content.includes(placeholder)) {
              content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
              modified = true;
            }
          }
          
          // Catch any remaining {{PLACEHOLDER}} patterns and replace with sensible defaults
          const remainingPlaceholders = content.match(/\{\{([A-Z_]+)\}\}/g);
          if (remainingPlaceholders) {
            for (const placeholder of remainingPlaceholders) {
              const key = placeholder.replace(/\{\{|\}\}/g, '');
              const defaultValue = this._getDefaultForPlaceholder(key, businessName, businessType);
              content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), defaultValue);
              modified = true;
              console.log(`  ⚠️  Auto-replaced unknown placeholder ${placeholder} with "${defaultValue}" in ${path.relative(appPath, filePath)}`);
            }
          }
          
          if (modified) {
            await fs.writeFile(filePath, content, 'utf8');
            injectedCount++;
          }
        } catch (fileError) {
          // Skip binary files or files that can't be read as text
          continue;
        }
      }
      
      console.log(`✅ Injected content into ${injectedCount} files (scanned ${allFiles.length} total files)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to inject business content:', error.message);
      throw error;
    }
  }

  /**
   * Get all source files recursively (excluding node_modules, .git, images, etc.)
   */
  async _getAllSourceFiles(dirPath) {
    const files = [];
    const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.md', '.env', '.yaml', '.yml', '.txt', '.sh', '.conf'];
    
    async function walk(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip directories we don't want to process
          if (entry.isDirectory()) {
            if (['node_modules', '.git', 'images', 'uploads', 'dist', 'build'].includes(entry.name)) {
              continue;
            }
            await walk(fullPath);
          } else {
            // Only process text-based files
            const ext = path.extname(entry.name).toLowerCase();
            if (textExtensions.includes(ext) || entry.name.startsWith('.env')) {
              files.push(fullPath);
            }
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }
    
    await walk(dirPath);
    return files;
  }

  /**
   * Get a sensible default value for an unknown placeholder
   */
  _getDefaultForPlaceholder(key, businessName, businessType) {
    const defaults = {
      'COMPANY_NAME': businessName,
      'APP_NAME': businessName,
      'STORE_NAME': businessName,
      'SITE_NAME': businessName,
      'BRAND_NAME': businessName,
      'SHOP_NAME': businessName,
      'CATEGORY': businessType,
      'CATEGORY_NAME': businessType.charAt(0).toUpperCase() + businessType.slice(1),
      'PHONE': '',
      'ADDRESS': '',
      'CITY': '',
      'STATE': '',
      'COUNTRY': 'India',
      'CURRENCY': '₹',
      'CURRENCY_CODE': 'INR',
    };
    
    return defaults[key] || businessName;
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
   * Validate generation parameters before starting
   * Ensures all required data is present to avoid incomplete apps
   */
  _validateGenerationParams(params) {
    const errors = [];

    if (!params) {
      throw new Error('Generation parameters are required');
    }

    if (!params.userRequirements || typeof params.userRequirements !== 'string' || params.userRequirements.trim().length < 10) {
      errors.push('userRequirements must be a string with at least 10 characters describing the business');
    }

    // Validate credentials if provided
    if (params.credentials) {
      if (params.credentials.mongoUri && !params.credentials.mongoUri.startsWith('mongodb')) {
        errors.push('MongoDB URI must start with "mongodb://" or "mongodb+srv://"');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    console.log('✅ Input validation passed');
  }

  /**
   * Validate generated app — check for unreplaced {{PLACEHOLDER}} patterns
   */
  async _validateGeneratedApp(appPath) {
    const allFiles = await this._getAllSourceFiles(appPath);
    const filesWithIssues = [];
    let unreplacedCount = 0;

    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        // Match {{PLACEHOLDER}} patterns but exclude style={{ (JSX inline styles)
        const matches = content.match(/\{\{([A-Z][A-Z_0-9]+)\}\}/g);
        if (matches) {
          const relativePath = path.relative(appPath, filePath);
          filesWithIssues.push({ file: relativePath, placeholders: matches });
          unreplacedCount += matches.length;
          console.warn(`  ⚠️  ${relativePath}: ${matches.join(', ')}`);
        }
      } catch (err) {
        continue;
      }
    }

    return { unreplacedCount, filesWithIssues };
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
