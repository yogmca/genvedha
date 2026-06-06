# How to Use Generic Template in LLM Service

## Overview

The Generic Template System is now integrated and ready to use in the LLM service. This guide shows how to use it for app generation.

## Quick Integration

### 1. Load Template in app-generator.js

```javascript
const templateLoader = require('./services/template-loader');

async function generateAppFromTemplate(userInput) {
  // Parse user input
  const config = {
    businessName: userInput.businessName || 'My Store',
    description: userInput.description,
    productType: userInput.productType || 'product',
    categories: userInput.categories || 'ecommerce',
    mongoUri: userInput.mongoUri,
    databaseName: userInput.databaseName,
    port: userInput.port || 5000,
    productSchema: userInput.productSchema
  };

  // Generate app from template
  const generatedApp = await templateLoader.generateApp('generic-ecommerce', config);

  // Save to disk
  const appId = generateUniqueId();
  const outputDir = `./generated-apps/${appId}`;
  const saveResult = await templateLoader.saveApp(generatedApp, outputDir);

  return {
    appId,
    path: outputDir,
    config: generatedApp.config,
    files: saveResult.saved.length,
    errors: saveResult.failed
  };
}
```

### 2. API Endpoint Example

```javascript
// In api/routes.js
router.post('/generate-app', async (req, res) => {
  try {
    const { businessName, productType, categories, description } = req.body;

    // Validate input
    if (!businessName || !productType) {
      return res.status(400).json({
        error: 'businessName and productType are required'
      });
    }

    // Generate app using template
    const result = await templateLoader.generateApp('generic-ecommerce', {
      businessName,
      productType,
      categories: categories || 'ecommerce',
      description
    });

    // Save app
    const appId = Date.now().toString(36);
    const outputDir = `./generated-apps/${appId}`;
    await templateLoader.saveApp(result, outputDir);

    res.json({
      success: true,
      appId,
      path: outputDir,
      config: result.config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Configuration Examples

### E-commerce Store

```javascript
const config = {
  businessName: 'Tech Gadgets Store',
  description: 'Premium electronics and gadgets',
  productType: 'gadget',
  categories: 'electronics',
  port: 5001
};

const app = await templateLoader.generateApp('generic-ecommerce', config);
```

### Food/Spice Store

```javascript
const config = {
  businessName: 'Organic Spice Bazaar',
  description: 'Premium organic spices from around the world',
  productType: 'spice',
  categories: 'food',
  productSchema: {
    customFields: {
      weight: { type: 'String', required: true },
      unit: { type: 'String', required: true },
      organic: { type: 'Boolean', default: true },
      origin: { type: 'String' }
    }
  }
};

const app = await templateLoader.generateApp('generic-ecommerce', config);
```

### Fashion Store

```javascript
const config = {
  businessName: 'StyleVista',
  description: 'Modern fashion boutique',
  productType: 'clothing',
  categories: 'fashion',
  productSchema: {
    customFields: {
      sizes: [{ type: 'String' }],
      colors: [{ type: 'String' }],
      material: { type: 'String' },
      brand: { type: 'String' }
    }
  }
};

const app = await templateLoader.generateApp('generic-ecommerce', config);
```

### Custom Categories

```javascript
const config = {
  businessName: 'My Store',
  productType: 'product',
  categories: [
    { id: 'cat1', name: 'Category 1', order: 1 },
    { id: 'cat2', name: 'Category 2', order: 2 },
    { id: 'cat3', name: 'Category 3', order: 3 }
  ]
};

const app = await templateLoader.generateApp('generic-ecommerce', config);
```

## Template Loader API

### Methods

#### `generateApp(templateName, config)`
Generate a complete app from template with configuration.

```javascript
const result = await templateLoader.generateApp('generic-ecommerce', config);
// Returns: { success, template, config, files, metadata, validation }
```

#### `saveApp(generatedApp, outputDir)`
Save generated app to disk.

```javascript
const saveResult = await templateLoader.saveApp(result, './output/my-app');
// Returns: { saved: [...], failed: [...] }
```

#### `validateConfig(config)`
Validate configuration before generation.

```javascript
const validation = templateLoader.validateConfig(config);
// Returns: { valid, errors, warnings }
```

#### `getAvailableTemplates()`
Get list of available templates.

```javascript
const templates = templateLoader.getAvailableTemplates();
// Returns: ['generic-ecommerce']
```

#### `getTemplateMetadata(templateName)`
Get template metadata.

```javascript
const metadata = templateLoader.getTemplateMetadata('generic-ecommerce');
// Returns: { name, version, description, supportedBusinessTypes }
```

## Complete Workflow

```javascript
const templateLoader = require('./services/template-loader');
const databaseInitializer = require('./services/database-initializer');

async function createCompleteApp(userInput) {
  // 1. Validate configuration
  const validation = templateLoader.validateConfig(userInput);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  // 2. Generate app from template
  const generatedApp = await templateLoader.generateApp('generic-ecommerce', userInput);

  // 3. Save to disk
  const appId = Date.now().toString(36);
  const outputDir = `./generated-apps/${appId}`;
  const saveResult = await templateLoader.saveApp(generatedApp, outputDir);

  // 4. Initialize database
  await databaseInitializer.initialize({
    mongoUri: generatedApp.config.mongoUri,
    databaseName: generatedApp.config.databaseName,
    productSchema: {
      enabled: true,
      customFields: userInput.productSchema?.customFields || {}
    },
    categories: userInput.categories
  });

  // 5. Return result
  return {
    appId,
    path: outputDir,
    config: generatedApp.config,
    files: saveResult.saved,
    validation: validation
  };
}
```

## Testing

```javascript
// Test template generation
const templateLoader = require('./services/template-loader');

async function testTemplateGeneration() {
  const config = {
    businessName: 'Test Store',
    productType: 'product',
    categories: 'ecommerce'
  };

  const result = await templateLoader.generateApp('generic-ecommerce', config);
  console.log('Generated files:', Object.keys(result.files).length);
  console.log('Configuration:', result.config);
}

testTemplateGeneration();
```

## Benefits

1. **Fast Generation** - No LLM calls needed for basic structure
2. **Consistent Quality** - Tested, working template
3. **Flexible Configuration** - Easy to customize
4. **Multiple Business Types** - Support for various industries
5. **Ready to Deploy** - Complete with package.json, README, etc.

## Next Steps

1. Integrate `template-loader` into your app-generator
2. Update API endpoints to use template generation
3. Test with different configurations
4. Deploy generated apps

## Support

- Template Loader: `genvedha-llm-service/services/template-loader.js`
- Generic Template: `genvedha-llm-service/templates/generic-ecommerce-template.js`
- Documentation: `GENERIC-TEMPLATE-SYSTEM.md`
