/**
 * Content Injector Service
 * Injects dynamic content into generic templates
 */

class ContentInjector {
  constructor() {
    this.placeholders = {
      BUSINESS_NAME: '{{BUSINESS_NAME}}',
      BUSINESS_SLUG: '{{BUSINESS_SLUG}}',
      BUSINESS_DESCRIPTION: '{{BUSINESS_DESCRIPTION}}',
      BUSINESS_TAGLINE: '{{BUSINESS_TAGLINE}}',
      TAGLINE: '{{TAGLINE}}',
      PRODUCT_TYPE: '{{PRODUCT_TYPE}}',
      PRODUCT_TYPE_PLURAL: '{{PRODUCT_TYPE_PLURAL}}',
      PRODUCT_TYPE_CAPITALIZED: '{{PRODUCT_TYPE_CAPITALIZED}}',
      PRODUCT_DESCRIPTION: '{{PRODUCT_DESCRIPTION}}',
      PRODUCT_EXAMPLES: '{{PRODUCT_EXAMPLES}}',
      PRODUCT_CATEGORY: '{{PRODUCT_CATEGORY}}',
      PRODUCT_CATEGORY_NAME: '{{PRODUCT_CATEGORY_NAME}}',
      PRODUCT_CATEGORY_2: '{{PRODUCT_CATEGORY_2}}',
      PRODUCT_CATEGORY_2_NAME: '{{PRODUCT_CATEGORY_2_NAME}}',
      CATEGORY_NAME: '{{CATEGORY_NAME}}',
      CONTACT_EMAIL: '{{CONTACT_EMAIL}}',
      LOCATION: '{{LOCATION}}',
      REGION: '{{REGION}}',
      ORIGIN: '{{ORIGIN}}',
      API_URL: '{{API_URL}}',
      PORT: '{{PORT}}',
      DATABASE_NAME: '{{DATABASE_NAME}}'
    };
  }

  /**
   * Inject content into template
   * @param {string} template - Template content with placeholders
   * @param {Object} data - Data to inject
   * @returns {string} - Content with injected data
   */
  inject(template, data) {
    let content = template;

    // Replace all placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = this.placeholders[key] || `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, value || '');
    }

    return content;
  }

  /**
   * Inject business configuration
   * @param {string} template - Template content
   * @param {Object} config - Business configuration
   * @returns {string} - Injected content
   */
  injectBusinessConfig(template, config) {
    const {
      businessName,
      businessDescription,
      productType,
      categories = [],
      tagline,
      contactEmail,
      location,
      apiUrl,
      port,
      databaseName
    } = config;

    const businessSlug = (businessName || 'my-business').toLowerCase().replace(/\s+/g, '-');
    const productExamples = categories.length > 0
      ? `Premium ${categories.join(', ')} and more.`
      : `Premium quality ${productType || 'product'} products.`;

    const data = {
      BUSINESS_NAME: businessName,
      BUSINESS_SLUG: businessSlug,
      BUSINESS_DESCRIPTION: businessDescription,
      BUSINESS_TAGLINE: tagline || 'Quality Products',
      TAGLINE: tagline || 'Quality Products',
      PRODUCT_TYPE: productType,
      PRODUCT_TYPE_PLURAL: (productType || 'product') + 's',
      PRODUCT_TYPE_CAPITALIZED: (productType || 'product').charAt(0).toUpperCase() + (productType || 'product').slice(1),
      PRODUCT_DESCRIPTION: `premium quality ${productType || 'products'}`,
      PRODUCT_EXAMPLES: productExamples,
      CONTACT_EMAIL: contactEmail || `support@${businessSlug}.com`,
      LOCATION: location || 'India',
      REGION: location || '',
      ORIGIN: location || '',
      API_URL: apiUrl,
      PORT: port,
      DATABASE_NAME: databaseName
    };

    // Add dynamic category replacements
    if (categories.length > 0) {
      data.PRODUCT_CATEGORY = categories[0].toLowerCase().replace(/\s+/g, '-');
      data.PRODUCT_CATEGORY_NAME = categories[0];
    }
    if (categories.length > 1) {
      data.PRODUCT_CATEGORY_2 = categories[1].toLowerCase().replace(/\s+/g, '-');
      data.PRODUCT_CATEGORY_2_NAME = categories[1];
    }
    // Support any number of additional categories
    for (let i = 2; i < categories.length; i++) {
      data[`PRODUCT_CATEGORY_${i + 1}`] = categories[i].toLowerCase().replace(/\s+/g, '-');
      data[`PRODUCT_CATEGORY_${i + 1}_NAME`] = categories[i];
    }

    return this.inject(template, data);
  }

  /**
   * Inject categories into template
   * @param {string} template - Template content
   * @param {Array} categories - Array of category objects
   * @returns {string} - Content with injected categories
   */
  injectCategories(template, categories) {
    const categoriesJSON = JSON.stringify(categories, null, 2);
    
    // Replace category placeholder
    let content = template.replace(
      /const categories = \[\];.*$/m,
      `const categories = ${categoriesJSON};`
    );

    // Also handle React state initialization
    content = content.replace(
      /useState\(\[\]\);\s*\/\/.*categories/i,
      `useState(${categoriesJSON});`
    );

    return content;
  }

  /**
   * Inject API endpoints
   * @param {string} template - Template content
   * @param {Object} endpoints - API endpoint configuration
   * @returns {string} - Content with injected endpoints
   */
  injectAPIEndpoints(template, endpoints) {
    const endpointsJSON = JSON.stringify(endpoints, null, 2);
    
    return template.replace(
      /const API_ENDPOINTS = \{[\s\S]*?\};/,
      `const API_ENDPOINTS = ${endpointsJSON};`
    );
  }

  /**
   * Inject database configuration
   * @param {string} template - Template content
   * @param {Object} dbConfig - Database configuration
   * @returns {string} - Content with injected DB config
   */
  injectDatabaseConfig(template, dbConfig) {
    let content = template;

    // Inject MongoDB URI
    if (dbConfig.mongoUri) {
      content = content.replace(
        /mongodb:\/\/[^'"]+/g,
        dbConfig.mongoUri
      );
    }

    // Inject database name
    if (dbConfig.databaseName) {
      content = content.replace(
        /{{DATABASE_NAME}}/g,
        dbConfig.databaseName
      );
    }

    return content;
  }

  /**
   * Inject environment variables
   * @param {string} template - Template content
   * @param {Object} envVars - Environment variables
   * @returns {string} - Content with injected env vars
   */
  injectEnvVariables(template, envVars) {
    let content = template;

    for (const [key, value] of Object.entries(envVars)) {
      // Replace in .env format
      const envPattern = new RegExp(`${key}=.*$`, 'gm');
      content = content.replace(envPattern, `${key}=${value}`);

      // Replace process.env references
      const processEnvPattern = new RegExp(`process\\.env\\.${key}\\s*\\|\\|\\s*['"][^'"]*['"]`, 'g');
      content = content.replace(processEnvPattern, `process.env.${key} || '${value}'`);
    }

    return content;
  }

  /**
   * Inject product schema fields
   * @param {string} template - Template content
   * @param {Object} schemaFields - Product schema fields
   * @returns {string} - Content with injected schema
   */
  injectProductSchema(template, schemaFields) {
    const schemaDefinition = this.generateSchemaDefinition(schemaFields);
    
    return template.replace(
      /const productSchema = new Schema\(\{[\s\S]*?\}\);/,
      `const productSchema = new Schema(${schemaDefinition});`
    );
  }

  /**
   * Generate schema definition from fields
   * @param {Object} fields - Schema fields
   * @returns {string} - Schema definition as string
   */
  generateSchemaDefinition(fields) {
    const schema = {
      ...fields,
      createdAt: { type: 'Date', default: 'Date.now' },
      updatedAt: { type: 'Date', default: 'Date.now' }
    };

    return JSON.stringify(schema, null, 2)
      .replace(/"Date"/g, 'Date')
      .replace(/"Date\.now"/g, 'Date.now');
  }

  /**
   * Inject navigation items
   * @param {string} template - Template content
   * @param {Array} navItems - Navigation items
   * @returns {string} - Content with injected navigation
   */
  injectNavigation(template, navItems) {
    const navJSON = JSON.stringify(navItems, null, 2);
    
    return template.replace(
      /const navItems = \[[\s\S]*?\];/,
      `const navItems = ${navJSON};`
    );
  }

  /**
   * Inject styling configuration
   * @param {string} template - Template content
   * @param {Object} styling - Styling configuration
   * @returns {string} - Content with injected styles
   */
  injectStyling(template, styling) {
    let content = template;

    // Inject color scheme
    if (styling.colors) {
      for (const [key, value] of Object.entries(styling.colors)) {
        content = content.replace(
          new RegExp(`--color-${key}:\\s*[^;]+;`, 'g'),
          `--color-${key}: ${value};`
        );
      }
    }

    // Inject fonts
    if (styling.fonts) {
      content = content.replace(
        /--font-primary:\s*[^;]+;/g,
        `--font-primary: ${styling.fonts.primary};`
      );
      content = content.replace(
        /--font-secondary:\s*[^;]+;/g,
        `--font-secondary: ${styling.fonts.secondary};`
      );
    }

    return content;
  }

  /**
   * Inject complete application configuration
   * @param {Object} templates - Object containing all template files
   * @param {Object} config - Complete application configuration
   * @returns {Object} - Templates with injected content
   */
  injectFullConfiguration(templates, config) {
    const injected = {};

    for (const [filePath, content] of Object.entries(templates)) {
      let injectedContent = content;

      // Inject business config
      if (config.business) {
        injectedContent = this.injectBusinessConfig(injectedContent, config.business);
      }

      // Inject categories
      if (config.categories) {
        injectedContent = this.injectCategories(injectedContent, config.categories);
      }

      // Inject API endpoints
      if (config.apiEndpoints) {
        injectedContent = this.injectAPIEndpoints(injectedContent, config.apiEndpoints);
      }

      // Inject database config
      if (config.database) {
        injectedContent = this.injectDatabaseConfig(injectedContent, config.database);
      }

      // Inject environment variables
      if (config.env) {
        injectedContent = this.injectEnvVariables(injectedContent, config.env);
      }

      // Inject product schema
      if (config.productSchema && filePath.includes('models')) {
        injectedContent = this.injectProductSchema(injectedContent, config.productSchema);
      }

      // Inject navigation
      if (config.navigation) {
        injectedContent = this.injectNavigation(injectedContent, config.navigation);
      }

      // Inject styling
      if (config.styling && filePath.endsWith('.css')) {
        injectedContent = this.injectStyling(injectedContent, config.styling);
      }

      injected[filePath] = injectedContent;
    }

    return injected;
  }

  /**
   * Create configuration from user input
   * @param {Object} userInput - User provided configuration
   * @returns {Object} - Normalized configuration
   */
  createConfiguration(userInput) {
    return {
      business: {
        businessName: userInput.businessName || 'My Business',
        businessDescription: userInput.description || 'A modern e-commerce platform',
        productType: userInput.productType || 'product',
        apiUrl: userInput.apiUrl || 'http://localhost',
        port: userInput.port || 5000,
        databaseName: userInput.databaseName || 'myapp_db'
      },
      categories: userInput.categories || [],
      apiEndpoints: userInput.apiEndpoints || this.getDefaultEndpoints(),
      database: {
        mongoUri: userInput.mongoUri || 'mongodb://localhost:27017',
        databaseName: userInput.databaseName || 'myapp_db'
      },
      env: userInput.env || {},
      productSchema: userInput.productSchema || this.getDefaultProductSchema(),
      navigation: userInput.navigation || this.getDefaultNavigation(),
      styling: userInput.styling || {}
    };
  }

  /**
   * Get default API endpoints
   */
  getDefaultEndpoints() {
    return {
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      users: '/api/users'
    };
  }

  /**
   * Get default product schema
   */
  getDefaultProductSchema() {
    return {
      name: { type: 'String', required: true },
      description: { type: 'String', required: true },
      price: { type: 'Number', required: true },
      category: { type: 'String', required: true },
      image: { type: 'String' },
      inStock: { type: 'Boolean', default: true }
    };
  }

  /**
   * Get default navigation
   */
  getDefaultNavigation() {
    return [
      { label: 'Home', path: '/' },
      { label: 'Products', path: '/products' },
      { label: 'About', path: '/about' },
      { label: 'Contact', path: '/contact' }
    ];
  }
}

module.exports = new ContentInjector();
