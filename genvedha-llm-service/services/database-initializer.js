/**
 * Database Initialization Service
 * Auto-creates tables/collections and sets up database schema
 */

const mongoose = require('mongoose');
const { createProductModel } = require('../models/GenericProduct');

class DatabaseInitializer {
  constructor() {
    this.connection = null;
    this.models = {};
    this.initialized = false;
  }

  /**
   * Initialize database connection
   * @param {string} mongoUri - MongoDB connection URI
   * @param {Object} options - Connection options
   * @returns {Promise} - Connection promise
   */
  async connect(mongoUri, options = {}) {
    try {
      const defaultOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ...options
      };

      this.connection = await mongoose.connect(mongoUri, defaultOptions);
      console.log('✓ Database connected successfully');
      return this.connection;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize database with schema
   * @param {Object} config - Database configuration
   * @returns {Object} - Initialization results
   */
  async initialize(config) {
    const {
      mongoUri,
      databaseName,
      collections = {},
      productSchema = {},
      categories = [],
      seedData = false
    } = config;

    try {
      // Connect to database
      if (!this.connection) {
        await this.connect(mongoUri);
      }

      const results = {
        collections: [],
        indexes: [],
        seedData: []
      };

      // Create product model
      if (productSchema.enabled !== false) {
        const productModel = createProductModel(
          productSchema.customFields || {},
          productSchema.collectionName || 'products'
        );
        this.models.Product = productModel;
        results.collections.push('products');

        // Create indexes
        await this.createIndexes(productModel);
        results.indexes.push('products');
      }

      // Create additional collections
      for (const [name, schema] of Object.entries(collections)) {
        const model = await this.createCollection(name, schema);
        this.models[name] = model;
        results.collections.push(name);
      }

      // Create categories collection
      if (categories.length > 0) {
        await this.initializeCategories(categories);
        results.collections.push('categories');
      }

      // Seed initial data
      if (seedData) {
        const seeded = await this.seedInitialData(config.seedData);
        results.seedData = seeded;
      }

      this.initialized = true;
      console.log('✓ Database initialized successfully');
      
      return results;
    } catch (error) {
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a collection with schema
   * @param {string} name - Collection name
   * @param {Object} schema - Schema definition
   * @returns {mongoose.Model} - Mongoose model
   */
  async createCollection(name, schema) {
    try {
      // Check if model already exists
      if (mongoose.models[name]) {
        return mongoose.models[name];
      }

      const mongooseSchema = new mongoose.Schema(schema, {
        timestamps: true,
        collection: name
      });

      const model = mongoose.model(name, mongooseSchema);
      console.log(`✓ Collection '${name}' created`);
      
      return model;
    } catch (error) {
      throw new Error(`Failed to create collection '${name}': ${error.message}`);
    }
  }

  /**
   * Create indexes for better performance
   * @param {mongoose.Model} model - Mongoose model
   * @returns {Array} - Created indexes
   */
  async createIndexes(model) {
    try {
      await model.createIndexes();
      console.log(`✓ Indexes created for ${model.collection.name}`);
      return model.schema.indexes();
    } catch (error) {
      console.warn(`Warning: Failed to create indexes: ${error.message}`);
      return [];
    }
  }

  /**
   * Initialize categories collection
   * @param {Array} categories - Categories to initialize
   * @returns {mongoose.Model} - Category model
   */
  async initializeCategories(categories) {
    const categorySchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      description: { type: String, default: '' },
      icon: { type: String },
      image: { type: String },
      parent: { type: String, default: null },
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
    }, {
      timestamps: true,
      collection: 'categories'
    });

    // Create indexes
    categorySchema.index({ slug: 1 });
    categorySchema.index({ parent: 1 });
    categorySchema.index({ active: 1, order: 1 });

    const CategoryModel = mongoose.models.Category || 
      mongoose.model('Category', categorySchema);

    this.models.Category = CategoryModel;

    // Insert categories if they don't exist
    for (const category of categories) {
      await CategoryModel.findOneAndUpdate(
        { id: category.id },
        category,
        { upsert: true, new: true }
      );
    }

    console.log(`✓ Categories initialized (${categories.length} categories)`);
    return CategoryModel;
  }

  /**
   * Seed initial data
   * @param {Object} seedData - Data to seed
   * @returns {Array} - Seeded collections
   */
  async seedInitialData(seedData) {
    const seeded = [];

    try {
      for (const [collectionName, data] of Object.entries(seedData)) {
        const model = this.models[collectionName];
        
        if (!model) {
          console.warn(`Warning: Model '${collectionName}' not found, skipping seed`);
          continue;
        }

        // Check if collection is empty
        const count = await model.countDocuments();
        if (count === 0) {
          await model.insertMany(data);
          seeded.push(collectionName);
          console.log(`✓ Seeded ${data.length} documents in '${collectionName}'`);
        } else {
          console.log(`⊘ Collection '${collectionName}' already has data, skipping seed`);
        }
      }

      return seeded;
    } catch (error) {
      throw new Error(`Failed to seed data: ${error.message}`);
    }
  }

  /**
   * Create database backup
   * @param {string} backupPath - Path to save backup
   * @returns {Object} - Backup information
   */
  async createBackup(backupPath) {
    try {
      const backup = {};
      
      for (const [name, model] of Object.entries(this.models)) {
        const data = await model.find({}).lean();
        backup[name] = data;
      }

      const fs = require('fs').promises;
      await fs.writeFile(
        backupPath,
        JSON.stringify(backup, null, 2),
        'utf-8'
      );

      console.log(`✓ Backup created at ${backupPath}`);
      
      return {
        path: backupPath,
        collections: Object.keys(backup),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   * @returns {Object} - Restore results
   */
  async restoreBackup(backupPath) {
    try {
      const fs = require('fs').promises;
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backup = JSON.parse(backupContent);

      const restored = [];

      for (const [collectionName, data] of Object.entries(backup)) {
        const model = this.models[collectionName];
        
        if (!model) {
          console.warn(`Warning: Model '${collectionName}' not found, skipping restore`);
          continue;
        }

        // Clear existing data
        await model.deleteMany({});
        
        // Insert backup data
        await model.insertMany(data);
        restored.push(collectionName);
        
        console.log(`✓ Restored ${data.length} documents in '${collectionName}'`);
      }

      return {
        restored,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Drop all collections
   * @param {boolean} confirm - Confirmation flag
   * @returns {Array} - Dropped collections
   */
  async dropAllCollections(confirm = false) {
    if (!confirm) {
      throw new Error('Must confirm to drop all collections');
    }

    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const dropped = [];

      for (const collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        dropped.push(collection.name);
        console.log(`✓ Dropped collection '${collection.name}'`);
      }

      this.models = {};
      this.initialized = false;

      return dropped;
    } catch (error) {
      throw new Error(`Failed to drop collections: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   * @returns {Object} - Database stats
   */
  async getStats() {
    try {
      const stats = {
        connected: mongoose.connection.readyState === 1,
        database: mongoose.connection.name,
        collections: {},
        totalDocuments: 0
      };

      for (const [name, model] of Object.entries(this.models)) {
        const count = await model.countDocuments();
        stats.collections[name] = count;
        stats.totalDocuments += count;
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Check database health
   * @returns {Object} - Health check results
   */
  async healthCheck() {
    const health = {
      status: 'unknown',
      connected: false,
      initialized: this.initialized,
      models: Object.keys(this.models),
      issues: []
    };

    try {
      // Check connection
      if (mongoose.connection.readyState !== 1) {
        health.issues.push('Database not connected');
        health.status = 'unhealthy';
        return health;
      }

      health.connected = true;

      // Check collections
      for (const [name, model] of Object.entries(this.models)) {
        try {
          await model.findOne().limit(1);
        } catch (error) {
          health.issues.push(`Collection '${name}' error: ${error.message}`);
        }
      }

      health.status = health.issues.length === 0 ? 'healthy' : 'degraded';
      return health;
    } catch (error) {
      health.status = 'unhealthy';
      health.issues.push(error.message);
      return health;
    }
  }

  /**
   * Migrate database schema
   * @param {Object} migrations - Migration definitions
   * @returns {Object} - Migration results
   */
  async migrate(migrations) {
    const results = {
      applied: [],
      failed: [],
      skipped: []
    };

    for (const migration of migrations) {
      try {
        const { name, up, down, version } = migration;

        // Check if migration already applied
        const MigrationModel = await this.getMigrationModel();
        const existing = await MigrationModel.findOne({ name });

        if (existing) {
          results.skipped.push(name);
          continue;
        }

        // Apply migration
        await up(mongoose.connection.db);

        // Record migration
        await MigrationModel.create({
          name,
          version,
          appliedAt: new Date()
        });

        results.applied.push(name);
        console.log(`✓ Migration '${name}' applied`);
      } catch (error) {
        results.failed.push({ name: migration.name, error: error.message });
        console.error(`✗ Migration '${migration.name}' failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get or create migration tracking model
   * @returns {mongoose.Model} - Migration model
   */
  async getMigrationModel() {
    if (mongoose.models.Migration) {
      return mongoose.models.Migration;
    }

    const migrationSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      version: { type: String },
      appliedAt: { type: Date, default: Date.now }
    });

    return mongoose.model('Migration', migrationSchema);
  }

  /**
   * Disconnect from database
   * @returns {Promise} - Disconnect promise
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.connection = null;
      this.initialized = false;
      console.log('✓ Database disconnected');
    } catch (error) {
      throw new Error(`Disconnect failed: ${error.message}`);
    }
  }

  /**
   * Get model by name
   * @param {string} name - Model name
   * @returns {mongoose.Model|null} - Model or null
   */
  getModel(name) {
    return this.models[name] || null;
  }

  /**
   * Check if initialized
   * @returns {boolean} - Initialization status
   */
  isInitialized() {
    return this.initialized;
  }
}

module.exports = new DatabaseInitializer();
