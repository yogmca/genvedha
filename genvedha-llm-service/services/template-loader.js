/**
 * Template Loader Service
 * Loads and prepares generic templates for the LLM service
 */

const genericTemplate = require('../templates/generic-ecommerce-template');
const contentInjector = require('./content-injector');
const categoryManager = require('./category-manager');

class TemplateLoader {
  constructor() {
    this.templates = {
      'generic-ecommerce': genericTemplate
    };
    this.currentTemplate = null;
  }

  /**
   * Load a template by name
   * @param {string} templateName - Name of the template to load
   * @returns {Object} - Template object
   */
  loadTemplate(templateName = 'generic-ecommerce') {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    this.currentTemplate = template;
    return template;
  }

  /**
   * Get template with configuration applied
   * @param {string} templateName - Template name
   * @param {Object} config - Configuration object
   * @returns {Object} - Configured template
   */
  async getConfiguredTemplate(templateName, config) {
    const template = this.loadTemplate(templateName);
    
    // Setup categories
    let categories = [];
    if (Array.isArray(config.categories)) {
      categories = config.categories;
    } else if (typeof config.categories === 'string') {
      categories = categoryManager.constructor.createDefaultConfig(config.categories);
    }
    categoryManager.loadFromObject({ categories });

    // Prepare configuration
    const fullConfig = {
      BUSINESS_NAME: config.businessName || 'My Store',
      BUSINESS_DESCRIPTION: config.description || 'A modern e-commerce platform',
      PRODUCT_TYPE: config.productType || 'product',
      PORT: config.port || 5000,
      MONGODB_URI: config.mongoUri || 'mongodb://localhost:27017',
      DATABASE_NAME: config.databaseName || 'mystore_db',
      CATEGORIES: JSON.stringify(categories, null, 2),
      CUSTOM_FIELDS: JSON.stringify(config.productSchema?.customFields || {}, null, 2),
      TIMESTAMP: new Date().toISOString()
    };

    // Apply configuration to template structure
    const configuredFiles = {};
    const structure = template.structure;

    for (const [section, files] of Object.entries(structure)) {
      for (const [filename, content] of Object.entries(files)) {
        const filePath = `${section}/${filename}`;
        configuredFiles[filePath] = this.applyConfig(content, fullConfig);
      }
    }

    return {
      metadata: template.metadata,
      config: fullConfig,
      files: configuredFiles
    };
  }

  /**
   * Apply configuration to template content
   * @param {string} content - Template content
   * @param {Object} config - Configuration values
   * @returns {string} - Configured content
   */
  applyConfig(content, config) {
    let result = content;
    
    for (const [key, value] of Object.entries(config)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return result;
  }

  /**
   * Get all available templates
   * @returns {Array} - List of template names
   */
  getAvailableTemplates() {
    return Object.keys(this.templates);
  }

  /**
   * Get template metadata
   * @param {string} templateName - Template name
   * @returns {Object} - Template metadata
   */
  getTemplateMetadata(templateName) {
    const template = this.templates[templateName];
    return template ? template.metadata : null;
  }

  /**
   * Validate template configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!config.businessName) {
      errors.push('businessName is required');
    }
    if (!config.productType) {
      errors.push('productType is required');
    }

    // Optional but recommended
    if (!config.description) {
      warnings.push('description is recommended for better SEO');
    }
    if (!config.categories) {
      warnings.push('categories not specified, will use default ecommerce categories');
    }

    // Database configuration
    if (!config.mongoUri) {
      warnings.push('mongoUri not specified, will use default localhost');
    }
    if (!config.databaseName) {
      warnings.push('databaseName not specified, will generate from businessName');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate app from template
   * @param {string} templateName - Template to use
   * @param {Object} userConfig - User configuration
   * @returns {Object} - Generated app structure
   */
  async generateApp(templateName, userConfig) {
    // Validate configuration
    const validation = this.validateConfig(userConfig);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Normalize configuration
    const config = {
      businessName: userConfig.businessName,
      description: userConfig.description || `${userConfig.businessName} - A modern e-commerce platform`,
      productType: userConfig.productType,
      categories: userConfig.categories || 'ecommerce',
      mongoUri: userConfig.mongoUri || 'mongodb://localhost:27017',
      databaseName: userConfig.databaseName || this.generateDatabaseName(userConfig.businessName),
      port: userConfig.port || 5000,
      productSchema: userConfig.productSchema || {}
    };

    // Get configured template
    const template = await this.getConfiguredTemplate(templateName, config);

    return {
      success: true,
      template: templateName,
      config: config,
      files: template.files,
      metadata: template.metadata,
      validation: validation
    };
  }

  /**
   * Generate database name from business name
   * @param {string} businessName - Business name
   * @returns {string} - Database name
   */
  generateDatabaseName(businessName) {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') + '_db';
  }

  /**
   * Save generated app to disk
   * @param {Object} generatedApp - Generated app structure
   * @param {string} outputDir - Output directory
   * @returns {Object} - Save results
   */
  async saveApp(generatedApp, outputDir) {
    const fs = require('fs').promises;
    const path = require('path');
    const saved = [];
    const failed = [];

    for (const [filePath, content] of Object.entries(generatedApp.files)) {
      try {
        const fullPath = path.join(outputDir, filePath);
        const dir = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, content, 'utf-8');
        saved.push(filePath);
      } catch (error) {
        failed.push({ filePath, error: error.message });
      }
    }

    // Create package.json
    try {
      const packageJson = this.generatePackageJson(generatedApp.config);
      const packagePath = path.join(outputDir, 'package.json');
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
      saved.push('package.json');
    } catch (error) {
      failed.push({ filePath: 'package.json', error: error.message });
    }

    // Create README
    try {
      const readme = this.generateReadme(generatedApp.config);
      const readmePath = path.join(outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');
      saved.push('README.md');
    } catch (error) {
      failed.push({ filePath: 'README.md', error: error.message });
    }

    return { saved, failed };
  }

  /**
   * Generate package.json for the app
   * @param {Object} config - App configuration
   * @returns {Object} - package.json content
   */
  generatePackageJson(config) {
    return {
      name: config.databaseName,
      version: '1.0.0',
      description: config.description,
      main: 'backend/server.js',
      scripts: {
        start: 'node backend/server.js',
        dev: 'nodemon backend/server.js',
        'start:frontend': 'cd frontend && npm start',
        'build:frontend': 'cd frontend && npm run build'
      },
      dependencies: {
        express: '^4.18.2',
        mongoose: '^8.0.0',
        cors: '^2.8.5',
        dotenv: '^16.3.1',
        multer: '^1.4.5-lts.1'
      },
      devDependencies: {
        nodemon: '^3.0.2'
      }
    };
  }

  /**
   * Generate README for the app
   * @param {Object} config - App configuration
   * @returns {string} - README content
   */
  generateReadme(config) {
    return `# ${config.businessName}

${config.description}

## Quick Start

### Backend

\`\`\`bash
# Install dependencies
npm install

# Create .env file
cp backend/.env.example backend/.env

# Edit .env with your configuration

# Start server
npm start
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## Configuration

Edit \`backend/.env\`:

\`\`\`
APP_NAME=${config.businessName}
PORT=${config.port}
MONGODB_URI=${config.mongoUri}
DATABASE_NAME=${config.databaseName}
\`\`\`

## API Endpoints

- \`GET /api/products\` - Get all products
- \`GET /api/products/:id\` - Get product by ID
- \`POST /api/products\` - Create product
- \`PUT /api/products/:id\` - Update product
- \`DELETE /api/products/:id\` - Delete product
- \`GET /api/categories\` - Get all categories
- \`GET /api/categories/tree\` - Get category tree

## Features

- Generic product model
- Dynamic categories
- Image upload system
- RESTful API
- React frontend
- MongoDB database

## License

MIT
`;
  }
}

module.exports = new TemplateLoader();
