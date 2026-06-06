/**
 * Generic Template Generator
 * Integrates all services to create generic, reusable templates
 */

const templateCleaner = require('./template-cleaner');
const contentInjector = require('./content-injector');
const categoryManager = require('./category-manager');
const databaseInitializer = require('./database-initializer');
const { createProductModelWithPreset } = require('../models/GenericProduct');

class GenericTemplateGenerator {
  constructor() {
    this.config = null;
    this.generatedFiles = {};
  }

  /**
   * Generate a complete generic template
   * @param {Object} sourceApp - Source application files
   * @param {Object} config - Configuration for the new app
   * @returns {Object} - Generated template files
   */
  async generate(sourceApp, config) {
    try {
      console.log('🚀 Starting generic template generation...');
      
      this.config = config;
      const steps = [];

      // Step 1: Clean the source template
      console.log('📝 Step 1: Cleaning source template...');
      const cleanedFiles = this.cleanSourceTemplate(sourceApp);
      steps.push({ step: 'clean', status: 'completed' });

      // Step 2: Setup categories
      console.log('📂 Step 2: Setting up categories...');
      const categories = await this.setupCategories(config.categories);
      steps.push({ step: 'categories', status: 'completed' });

      // Step 3: Inject dynamic content
      console.log('💉 Step 3: Injecting dynamic content...');
      const injectedFiles = this.injectContent(cleanedFiles, config, categories);
      steps.push({ step: 'inject', status: 'completed' });

      // Step 4: Setup database schema
      console.log('🗄️  Step 4: Setting up database schema...');
      const dbConfig = await this.setupDatabase(config);
      steps.push({ step: 'database', status: 'completed' });

      // Step 5: Generate configuration files
      console.log('⚙️  Step 5: Generating configuration files...');
      const configFiles = this.generateConfigFiles(config, categories);
      steps.push({ step: 'config', status: 'completed' });

      this.generatedFiles = {
        ...injectedFiles,
        ...configFiles
      };

      console.log('✅ Generic template generation completed!');

      return {
        success: true,
        files: this.generatedFiles,
        config: {
          businessName: config.businessName,
          productType: config.productType,
          categories: categories.length,
          database: dbConfig
        },
        steps
      };
    } catch (error) {
      console.error('❌ Template generation failed:', error.message);
      throw new Error(`Template generation failed: ${error.message}`);
    }
  }

  /**
   * Clean source template to make it generic
   * @param {Object} sourceApp - Source application files
   * @returns {Object} - Cleaned files
   */
  cleanSourceTemplate(sourceApp) {
    const cleaned = {};

    for (const [filePath, content] of Object.entries(sourceApp)) {
      const fileExtension = filePath.split('.').pop();
      cleaned[filePath] = templateCleaner.cleanContent(content, fileExtension);
    }

    return cleaned;
  }

  /**
   * Setup categories from configuration
   * @param {Array|string} categoriesConfig - Categories configuration
   * @returns {Array} - Configured categories
   */
  async setupCategories(categoriesConfig) {
    if (Array.isArray(categoriesConfig)) {
      categoryManager.loadFromObject({ categories: categoriesConfig });
    } else if (typeof categoriesConfig === 'string') {
      // Business type preset
      const defaultCategories = require('./category-manager').constructor.createDefaultConfig(categoriesConfig);
      categoryManager.loadFromObject({ categories: defaultCategories });
    } else {
      // Use default ecommerce categories
      const defaultCategories = require('./category-manager').constructor.createDefaultConfig('ecommerce');
      categoryManager.loadFromObject({ categories: defaultCategories });
    }

    return categoryManager.getAll();
  }

  /**
   * Inject dynamic content into cleaned files
   * @param {Object} cleanedFiles - Cleaned template files
   * @param {Object} config - Application configuration
   * @param {Array} categories - Categories
   * @returns {Object} - Files with injected content
   */
  injectContent(cleanedFiles, config, categories) {
    const fullConfig = contentInjector.createConfiguration({
      businessName: config.businessName,
      description: config.description,
      productType: config.productType,
      categories: categories,
      mongoUri: config.mongoUri,
      databaseName: config.databaseName,
      port: config.port,
      productSchema: config.productSchema,
      env: config.env
    });

    return contentInjector.injectFullConfiguration(cleanedFiles, fullConfig);
  }

  /**
   * Setup database configuration
   * @param {Object} config - Application configuration
   * @returns {Object} - Database configuration
   */
  async setupDatabase(config) {
    const dbConfig = {
      mongoUri: config.mongoUri || 'mongodb://localhost:27017',
      databaseName: config.databaseName || 'generic_app_db',
      productSchema: {
        enabled: true,
        customFields: config.productSchema?.customFields || {},
        collectionName: 'products'
      },
      categories: categoryManager.getAll(),
      seedData: config.seedData || false
    };

    return dbConfig;
  }

  /**
   * Generate configuration files
   * @param {Object} config - Application configuration
   * @param {Array} categories - Categories
   * @returns {Object} - Configuration files
   */
  generateConfigFiles(config, categories) {
    const files = {};

    // Generate app.config.json
    files['app.config.json'] = JSON.stringify({
      name: config.businessName,
      description: config.description,
      version: '1.0.0',
      productType: config.productType,
      features: {
        imageUpload: true,
        dynamicCategories: true,
        genericProducts: true
      }
    }, null, 2);

    // Generate categories.json
    files['config/categories.json'] = JSON.stringify({
      categories: categories,
      lastUpdated: new Date().toISOString()
    }, null, 2);

    // Generate database.config.json
    files['config/database.config.json'] = JSON.stringify({
      mongoUri: config.mongoUri || 'mongodb://localhost:27017',
      databaseName: config.databaseName || 'generic_app_db',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }, null, 2);

    // Generate .env.example
    files['.env.example'] = this.generateEnvExample(config);

    // Generate README.md
    files['README.md'] = this.generateReadme(config);

    return files;
  }

  /**
   * Generate .env.example file
   * @param {Object} config - Application configuration
   * @returns {string} - .env.example content
   */
  generateEnvExample(config) {
    return `# Application Configuration
APP_NAME=${config.businessName || 'My App'}
PORT=${config.port || 5000}
NODE_ENV=development

# Database Configuration
MONGODB_URI=${config.mongoUri || 'mongodb://localhost:27017'}
DATABASE_NAME=${config.databaseName || 'generic_app_db'}

# Upload Configuration
UPLOAD_DIR=uploads/images
MAX_FILE_SIZE=5242880

# API Configuration
API_BASE_URL=http://localhost:${config.port || 5000}

# Security
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Email Configuration (Optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password

# Other Configuration
LOG_LEVEL=info
ENABLE_CORS=true
`;
  }

  /**
   * Generate README.md file
   * @param {Object} config - Application configuration
   * @returns {string} - README.md content
   */
  generateReadme(config) {
    return `# ${config.businessName || 'Generic E-commerce Application'}

${config.description || 'A modern, flexible e-commerce platform built with generic templates.'}

## Features

- ✅ **Generic Product Model** - Flexible schema that adapts to any product type
- ✅ **Dynamic Categories** - Load categories from configuration
- ✅ **Image Upload System** - Admin panel with image management
- ✅ **Auto Database Initialization** - Automatic table/collection creation
- ✅ **Content Injection** - Dynamic content management
- ✅ **Template Cleaning** - Remove specific content for reusability

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd ${config.databaseName || 'generic-app'}
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Configure environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Initialize database
\`\`\`bash
npm run init-db
\`\`\`

5. Start the application
\`\`\`bash
npm start
\`\`\`

## Configuration

### Categories

Edit \`config/categories.json\` to customize your product categories:

\`\`\`json
{
  "categories": [
    {
      "id": "category-1",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "order": 1
    }
  ]
}
\`\`\`

### Product Schema

Customize the product schema in \`config/database.config.json\`:

\`\`\`json
{
  "productSchema": {
    "customFields": {
      "customField1": { "type": "String" },
      "customField2": { "type": "Number" }
    }
  }
}
\`\`\`

## API Endpoints

### Products
- \`GET /api/products\` - Get all products
- \`GET /api/products/:id\` - Get product by ID
- \`POST /api/products\` - Create new product
- \`PUT /api/products/:id\` - Update product
- \`DELETE /api/products/:id\` - Delete product

### Categories
- \`GET /api/categories\` - Get all categories
- \`GET /api/categories/:id\` - Get category by ID

### Images
- \`POST /api/images/upload\` - Upload single image
- \`POST /api/images/upload-multiple\` - Upload multiple images
- \`DELETE /api/images/:filename\` - Delete image

## Project Structure

\`\`\`
.
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── middleware/      # Express middleware
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
├── config/              # Configuration files
└── uploads/             # Uploaded files
\`\`\`

## Development

### Run in development mode
\`\`\`bash
npm run dev
\`\`\`

### Run tests
\`\`\`bash
npm test
\`\`\`

### Build for production
\`\`\`bash
npm run build
\`\`\`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

## License

MIT License

## Support

For support, email support@example.com or open an issue on GitHub.
`;
  }

  /**
   * Save generated files to disk
   * @param {string} outputDir - Output directory
   * @returns {Object} - Save results
   */
  async saveFiles(outputDir) {
    const fs = require('fs').promises;
    const path = require('path');
    const saved = [];
    const failed = [];

    for (const [filePath, content] of Object.entries(this.generatedFiles)) {
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

    return { saved, failed };
  }

  /**
   * Get generated files
   * @returns {Object} - Generated files
   */
  getGeneratedFiles() {
    return this.generatedFiles;
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    const errors = [];

    if (!config.businessName) {
      errors.push('businessName is required');
    }

    if (!config.productType) {
      errors.push('productType is required');
    }

    if (!config.mongoUri) {
      errors.push('mongoUri is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new GenericTemplateGenerator();
