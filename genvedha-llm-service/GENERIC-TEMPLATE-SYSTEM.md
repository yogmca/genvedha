# Generic Template System Documentation

## Overview

The Generic Template System is a comprehensive solution for creating reusable, flexible application templates. It removes specific content from existing applications and replaces it with dynamic, configurable components.

## Components

### 1. Template Cleaner Service (`template-cleaner.js`)

Removes specific content from templates to make them generic.

**Features:**
- Removes spice-specific content
- Removes hardcoded business names
- Removes hardcoded categories
- Replaces specific references with placeholders
- Validates cleaned content

**Usage:**
```javascript
const templateCleaner = require('./services/template-cleaner');

// Clean a single file
const cleaned = templateCleaner.cleanContent(fileContent, 'js');

// Clean entire directory
const cleanedFiles = templateCleaner.cleanDirectory(fileStructure);

// Validate cleaned content
const validation = templateCleaner.validateCleanedContent(cleaned);
```

### 2. Content Injector (`content-injector.js`)

Injects dynamic content into generic templates.

**Features:**
- Inject business configuration
- Inject categories
- Inject API endpoints
- Inject database configuration
- Inject environment variables
- Inject product schema
- Inject navigation items
- Inject styling configuration

**Usage:**
```javascript
const contentInjector = require('./services/content-injector');

// Create configuration
const config = contentInjector.createConfiguration({
  businessName: 'My Store',
  productType: 'product',
  categories: [...],
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db'
});

// Inject content
const injected = contentInjector.injectFullConfiguration(templates, config);
```

### 3. Generic Product Model (`GenericProduct.js`)

Flexible product schema that adapts to different product types.

**Features:**
- Base fields for all products
- Custom field support
- Multiple schema presets (ecommerce, food, fashion, electronics, digital, service)
- Search functionality
- Category filtering
- Dynamic metadata

**Usage:**
```javascript
const { createProductModel, createProductModelWithPreset } = require('./models/GenericProduct');

// Create basic product model
const Product = createProductModel();

// Create with preset
const FoodProduct = createProductModelWithPreset('food');

// Create with custom fields
const CustomProduct = createProductModel({
  customField1: { type: String },
  customField2: { type: Number }
});

// Use the model
const product = new Product({
  name: 'Product Name',
  description: 'Description',
  price: 99.99,
  category: 'electronics'
});
await product.save();
```

**Available Presets:**
- `ecommerce` - Generic e-commerce products
- `food` - Food and beverage products
- `fashion` - Clothing and accessories
- `electronics` - Electronic devices
- `digital` - Digital products and downloads
- `service` - Service-based products

### 4. Image Upload System (`image-upload.js`)

Handles image uploads for admin panel.

**Features:**
- Single and multiple file uploads
- File validation (type, size, extension)
- Image optimization (placeholder)
- Thumbnail generation (placeholder)
- File management (list, delete, info)
- Storage statistics
- Cleanup old files

**Usage:**
```javascript
const imageUploadService = require('./services/image-upload');

// In Express route
router.post('/upload', (req, res) => {
  const upload = imageUploadService.getUploadMiddleware('image', false);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    const fileInfo = await imageUploadService.processUpload(req.file);
    res.json({ success: true, data: fileInfo });
  });
});

// List files
const files = await imageUploadService.listFiles({ limit: 50 });

// Delete file
await imageUploadService.deleteFile('filename.jpg');

// Get storage stats
const stats = await imageUploadService.getStorageStats();
```

### 5. Dynamic Categories (`category-manager.js`)

Loads and manages categories from configuration.

**Features:**
- Load from config file or object
- Hierarchical categories (parent-child)
- Category tree generation
- Search functionality
- Import/Export (JSON, CSV)
- Default configurations for different business types

**Usage:**
```javascript
const categoryManager = require('./services/category-manager');

// Load from config file
await categoryManager.loadFromConfig('./config/categories.json');

// Load from object
categoryManager.loadFromObject({
  categories: [
    { id: 'cat1', name: 'Category 1', order: 1 },
    { id: 'cat2', name: 'Category 2', order: 2 }
  ]
});

// Get all categories
const categories = categoryManager.getAll();

// Get category tree
const tree = categoryManager.getTree();

// Get category by ID
const category = categoryManager.getById('cat1');

// Add new category
categoryManager.add({
  id: 'cat3',
  name: 'Category 3',
  parent: 'cat1'
});

// Save to config
await categoryManager.saveToConfig('./config/categories.json');
```

### 6. Database Initialization (`database-initializer.js`)

Auto-creates tables/collections and sets up database schema.

**Features:**
- Automatic database connection
- Collection creation
- Index creation
- Category initialization
- Data seeding
- Backup and restore
- Health checks
- Migration support

**Usage:**
```javascript
const databaseInitializer = require('./services/database-initializer');

// Initialize database
const result = await databaseInitializer.initialize({
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'myapp_db',
  productSchema: {
    enabled: true,
    customFields: {
      customField: { type: String }
    }
  },
  categories: [...],
  seedData: {
    products: [...]
  }
});

// Get database stats
const stats = await databaseInitializer.getStats();

// Health check
const health = await databaseInitializer.healthCheck();

// Create backup
await databaseInitializer.createBackup('./backup.json');

// Restore backup
await databaseInitializer.restoreBackup('./backup.json');
```

### 7. Generic Template Generator (`generic-template-generator.js`)

Integrates all services to create complete generic templates.

**Features:**
- Complete template generation workflow
- Source template cleaning
- Category setup
- Content injection
- Database configuration
- Configuration file generation

**Usage:**
```javascript
const genericTemplateGenerator = require('./services/generic-template-generator');

// Generate template
const result = await genericTemplateGenerator.generate(sourceApp, {
  businessName: 'My Store',
  description: 'A modern e-commerce platform',
  productType: 'product',
  categories: 'ecommerce', // or array of categories
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db',
  port: 5000,
  productSchema: {
    customFields: {
      brand: { type: String },
      warranty: { type: Number }
    }
  }
});

// Save generated files
await genericTemplateGenerator.saveFiles('./output');
```

## Complete Workflow

### Step 1: Clean Existing Template

```javascript
const templateCleaner = require('./services/template-cleaner');

// Read source files
const sourceFiles = {
  'src/App.js': '...',
  'src/components/Product.js': '...',
  // ... more files
};

// Clean all files
const cleanedFiles = templateCleaner.cleanDirectory(sourceFiles);
```

### Step 2: Setup Categories

```javascript
const categoryManager = require('./services/category-manager');

// Use preset or custom categories
const categories = categoryManager.constructor.createDefaultConfig('ecommerce');
categoryManager.loadFromObject({ categories });
```

### Step 3: Inject Content

```javascript
const contentInjector = require('./services/content-injector');

const config = contentInjector.createConfiguration({
  businessName: 'My Store',
  productType: 'product',
  categories: categoryManager.getAll(),
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db'
});

const injectedFiles = contentInjector.injectFullConfiguration(cleanedFiles, config);
```

### Step 4: Initialize Database

```javascript
const databaseInitializer = require('./services/database-initializer');

await databaseInitializer.initialize({
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'mystore_db',
  productSchema: {
    enabled: true,
    customFields: {}
  },
  categories: categoryManager.getAll()
});
```

### Step 5: Save Generated Files

```javascript
const fs = require('fs').promises;
const path = require('path');

for (const [filePath, content] of Object.entries(injectedFiles)) {
  const fullPath = path.join('./output', filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}
```

## Configuration Examples

### Basic E-commerce Configuration

```json
{
  "businessName": "My Store",
  "description": "A modern e-commerce platform",
  "productType": "product",
  "categories": "ecommerce",
  "mongoUri": "mongodb://localhost:27017",
  "databaseName": "mystore_db",
  "port": 5000
}
```

### Food/Spice Store Configuration

```json
{
  "businessName": "Organic Spice Bazaar",
  "description": "Premium organic spices",
  "productType": "spice",
  "categories": "food",
  "mongoUri": "mongodb://localhost:27017",
  "databaseName": "spice_store_db",
  "port": 5000,
  "productSchema": {
    "customFields": {
      "weight": { "type": "String", "required": true },
      "organic": { "type": "Boolean", "default": true },
      "origin": { "type": "String" }
    }
  }
}
```

### Fashion Store Configuration

```json
{
  "businessName": "StyleVista",
  "description": "Modern fashion boutique",
  "productType": "clothing",
  "categories": "fashion",
  "mongoUri": "mongodb://localhost:27017",
  "databaseName": "fashion_store_db",
  "port": 5000,
  "productSchema": {
    "customFields": {
      "sizes": [{ "type": "String" }],
      "colors": [{ "type": "String" }],
      "material": { "type": "String" },
      "brand": { "type": "String" }
    }
  }
}
```

## API Integration

### Express.js Integration

```javascript
const express = require('express');
const app = express();

// Image upload routes
const imageUploadRoutes = require('./routes/image-upload');
app.use('/api/images', imageUploadRoutes);

// Product routes (using generic model)
const { createProductModel } = require('./models/GenericProduct');
const Product = createProductModel();

app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Category routes
const categoryManager = require('./services/category-manager');

app.get('/api/categories', (req, res) => {
  const categories = categoryManager.getAll();
  res.json(categories);
});
```

## Best Practices

1. **Always validate configuration** before generating templates
2. **Use presets** when possible for consistency
3. **Test cleaned templates** to ensure no specific content remains
4. **Backup database** before initialization
5. **Use environment variables** for sensitive configuration
6. **Version control** generated templates
7. **Document custom fields** in product schema
8. **Organize categories** hierarchically for better UX

## Troubleshooting

### Template Cleaning Issues

If specific content remains after cleaning:
- Add patterns to `cleaningRules` in `template-cleaner.js`
- Use `validateCleanedContent()` to identify remaining issues

### Content Injection Issues

If placeholders are not replaced:
- Check placeholder format matches `{{PLACEHOLDER_NAME}}`
- Verify configuration object has correct keys
- Use `inject()` method for custom placeholders

### Database Initialization Issues

If collections are not created:
- Check MongoDB connection
- Verify schema definitions
- Use `healthCheck()` to diagnose issues

## License

MIT License
