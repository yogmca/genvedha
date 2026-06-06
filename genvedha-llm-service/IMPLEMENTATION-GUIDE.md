# Generic Template System - Implementation Guide

## Quick Start

### 1. Install Dependencies

First, ensure you have the required dependencies in your `package.json`:

```bash
npm install mongoose multer express
```

### 2. Run Tests

Test all components to ensure everything works:

```bash
node test-generic-template.js
```

### 3. Basic Usage Example

```javascript
const genericTemplateGenerator = require('./services/generic-template-generator');

// Define your configuration
const config = {
  businessName: 'My Store',
  description: 'A modern e-commerce platform',
  productType: 'product',
  categories: 'ecommerce', // or custom array
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db',
  port: 5000
};

// Generate template
const result = await genericTemplateGenerator.generate(sourceApp, config);

// Save files
await genericTemplateGenerator.saveFiles('./output');
```

## Step-by-Step Implementation

### Step 1: Prepare Source Application

Collect all files from your source application:

```javascript
const fs = require('fs').promises;
const path = require('path');

async function readSourceApp(directory) {
  const files = {};
  
  async function readDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await readDir(fullPath);
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        const relativePath = path.relative(directory, fullPath);
        files[relativePath] = content;
      }
    }
  }
  
  await readDir(directory);
  return files;
}

// Usage
const sourceApp = await readSourceApp('./source-app');
```

### Step 2: Configure Your Application

Create a configuration object:

```javascript
const config = {
  // Required fields
  businessName: 'My Store',
  productType: 'product',
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db',
  
  // Optional fields
  description: 'A modern e-commerce platform',
  port: 5000,
  
  // Categories (preset or custom)
  categories: 'ecommerce', // or:
  // categories: [
  //   { id: 'cat1', name: 'Category 1', order: 1 },
  //   { id: 'cat2', name: 'Category 2', order: 2 }
  // ],
  
  // Custom product schema
  productSchema: {
    customFields: {
      brand: { type: 'String' },
      warranty: { type: 'Number', default: 12 },
      specifications: { type: 'Map', of: 'String' }
    }
  },
  
  // Environment variables
  env: {
    JWT_SECRET: 'your-secret-key',
    EMAIL_HOST: 'smtp.example.com'
  },
  
  // Seed data (optional)
  seedData: {
    products: [
      {
        name: 'Sample Product',
        description: 'Sample description',
        price: 99.99,
        category: 'electronics'
      }
    ]
  }
};
```

### Step 3: Generate Template

```javascript
const genericTemplateGenerator = require('./services/generic-template-generator');

async function generateTemplate() {
  try {
    // Validate configuration
    const validation = genericTemplateGenerator.validateConfig(config);
    if (!validation.valid) {
      console.error('Configuration errors:', validation.errors);
      return;
    }
    
    // Generate template
    const result = await genericTemplateGenerator.generate(sourceApp, config);
    
    console.log('✅ Template generated successfully!');
    console.log('Generated files:', Object.keys(result.files).length);
    console.log('Steps completed:', result.steps.length);
    
    return result;
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    throw error;
  }
}

const result = await generateTemplate();
```

### Step 4: Save Generated Files

```javascript
async function saveGeneratedFiles(outputDir) {
  const saveResult = await genericTemplateGenerator.saveFiles(outputDir);
  
  console.log(`✅ Saved ${saveResult.saved.length} files`);
  
  if (saveResult.failed.length > 0) {
    console.error(`❌ Failed to save ${saveResult.failed.length} files:`);
    saveResult.failed.forEach(f => {
      console.error(`   - ${f.filePath}: ${f.error}`);
    });
  }
  
  return saveResult;
}

await saveGeneratedFiles('./output/my-store');
```

### Step 5: Initialize Database

```javascript
const databaseInitializer = require('./services/database-initializer');

async function initializeDatabase() {
  try {
    // Connect and initialize
    const result = await databaseInitializer.initialize({
      mongoUri: config.mongoUri,
      databaseName: config.databaseName,
      productSchema: {
        enabled: true,
        customFields: config.productSchema?.customFields || {}
      },
      categories: categoryManager.getAll(),
      seedData: config.seedData
    });
    
    console.log('✅ Database initialized');
    console.log('Collections created:', result.collections);
    console.log('Indexes created:', result.indexes);
    
    // Health check
    const health = await databaseInitializer.healthCheck();
    console.log('Database health:', health.status);
    
    return result;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

await initializeDatabase();
```

## Advanced Usage

### Custom Template Cleaning

Add custom cleaning rules:

```javascript
const templateCleaner = require('./services/template-cleaner');

// Add custom patterns
templateCleaner.cleaningRules.customPatterns = [
  /myCustomPattern/gi,
  /anotherPattern/gi
];

// Custom cleaning function
function customClean(content) {
  let cleaned = templateCleaner.cleanContent(content, 'js');
  
  // Additional custom cleaning
  cleaned = cleaned.replace(/specificString/g, 'replacement');
  
  return cleaned;
}
```

### Custom Content Injection

Inject custom placeholders:

```javascript
const contentInjector = require('./services/content-injector');

// Add custom placeholders
contentInjector.placeholders.CUSTOM_FIELD = '{{CUSTOM_FIELD}}';

// Inject custom content
const template = 'Welcome to {{CUSTOM_FIELD}}!';
const injected = contentInjector.inject(template, {
  CUSTOM_FIELD: 'My Custom Value'
});
```

### Dynamic Category Management

```javascript
const categoryManager = require('./services/category-manager');

// Load categories
await categoryManager.loadFromConfig('./config/categories.json');

// Add new category
categoryManager.add({
  id: 'new-category',
  name: 'New Category',
  description: 'Category description',
  order: 10
});

// Update category
categoryManager.update('new-category', {
  name: 'Updated Category Name'
});

// Get category tree
const tree = categoryManager.getTree();

// Save changes
await categoryManager.saveToConfig('./config/categories.json');
```

### Image Upload Integration

```javascript
const express = require('express');
const imageUploadService = require('./services/image-upload');

const app = express();

// Single image upload
app.post('/api/upload', (req, res) => {
  const upload = imageUploadService.getUploadMiddleware('image', false);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    const fileInfo = await imageUploadService.processUpload(req.file, {
      optimize: true,
      thumbnail: true
    });
    
    res.json({ success: true, data: fileInfo });
  });
});

// Multiple images upload
app.post('/api/upload-multiple', (req, res) => {
  const upload = imageUploadService.getUploadMiddleware('images', true);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    const filesInfo = await imageUploadService.processMultipleUploads(req.files);
    res.json({ success: true, data: filesInfo });
  });
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));
```

### Product Model Usage

```javascript
const { createProductModelWithPreset } = require('./models/GenericProduct');

// Create model with preset
const Product = createProductModelWithPreset('ecommerce', {
  // Additional custom fields
  customField: { type: String }
});

// Create product
const product = new Product({
  name: 'Product Name',
  description: 'Product description',
  price: 99.99,
  category: 'electronics',
  images: [
    { url: '/uploads/image1.jpg', isPrimary: true }
  ],
  inStock: true,
  featured: true
});

await product.save();

// Search products
const results = await Product.search('laptop', {
  category: 'electronics',
  minPrice: 500,
  maxPrice: 2000,
  inStock: true,
  limit: 20
});

// Get featured products
const featured = await Product.getFeatured(10);

// Get by category
const categoryProducts = await Product.getByCategory('electronics');
```

## Integration with LLM Service

### Update app-generator.js

```javascript
const genericTemplateGenerator = require('./generic-template-generator');

async function generateApp(userInput) {
  // Parse user input to extract configuration
  const config = parseUserInput(userInput);
  
  // Load base template
  const baseTemplate = await loadBaseTemplate();
  
  // Generate generic template
  const result = await genericTemplateGenerator.generate(baseTemplate, config);
  
  // Save to generated-apps directory
  const appId = generateAppId();
  const outputDir = `./generated-apps/${appId}`;
  await genericTemplateGenerator.saveFiles(outputDir);
  
  // Initialize database
  await initializeDatabaseForApp(config);
  
  return {
    appId,
    path: outputDir,
    config: result.config
  };
}
```

## Deployment

### 1. Prepare for Production

```bash
# Install production dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://production-server:27017
export DATABASE_NAME=production_db
```

### 2. Initialize Production Database

```javascript
const databaseInitializer = require('./services/database-initializer');

await databaseInitializer.initialize({
  mongoUri: process.env.MONGODB_URI,
  databaseName: process.env.DATABASE_NAME,
  productSchema: { enabled: true },
  categories: productionCategories
});
```

### 3. Deploy Generated Application

```bash
# Build frontend
cd output/my-store/frontend
npm install
npm run build

# Start backend
cd ../backend
npm install
npm start
```

## Troubleshooting

### Issue: Template not cleaning properly

**Solution:** Add more patterns to cleaning rules or use custom cleaning function.

### Issue: Content injection not working

**Solution:** Check placeholder format and ensure configuration keys match.

### Issue: Database initialization fails

**Solution:** Verify MongoDB connection and check schema definitions.

### Issue: Image upload fails

**Solution:** Check file permissions on upload directory and verify file size limits.

## Best Practices

1. **Always test** generated templates before deployment
2. **Use version control** for configuration files
3. **Backup database** before initialization
4. **Validate user input** before generating templates
5. **Monitor storage** for uploaded images
6. **Use environment variables** for sensitive data
7. **Document custom fields** in product schema
8. **Keep categories organized** hierarchically

## Next Steps

1. Integrate with your LLM service
2. Create UI for configuration management
3. Add more product schema presets
4. Implement image optimization
5. Add analytics and monitoring
6. Create deployment automation
7. Build admin dashboard

## Support

For issues or questions:
- Check documentation: `GENERIC-TEMPLATE-SYSTEM.md`
- Run tests: `node test-generic-template.js`
- Review examples in this guide
