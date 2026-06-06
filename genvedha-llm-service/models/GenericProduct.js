/**
 * Generic Product Model
 * Flexible schema that can adapt to different product types
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Create a dynamic product schema based on configuration
 * @param {Object} customFields - Custom fields to add to the schema
 * @param {string} collectionName - Name of the collection
 * @returns {mongoose.Model} - Mongoose model
 */
function createProductModel(customFields = {}, collectionName = 'products') {
  // Base fields that every product should have
  const baseFields = {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      index: true
    },
    images: [{
      url: String,
      alt: String,
      isPrimary: { type: Boolean, default: false }
    }],
    inStock: {
      type: Boolean,
      default: true,
      index: true
    },
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  };

  // Merge base fields with custom fields
  const schemaDefinition = { ...baseFields, ...customFields };

  // Create schema
  const productSchema = new Schema(schemaDefinition, {
    timestamps: true,
    collection: collectionName
  });

  // Indexes for better query performance
  productSchema.index({ name: 'text', description: 'text', tags: 'text' });
  productSchema.index({ category: 1, price: 1 });
  productSchema.index({ featured: 1, createdAt: -1 });

  // Virtual for primary image
  productSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary || (this.images.length > 0 ? this.images[0] : null);
  });

  // Method to add custom field dynamically
  productSchema.methods.addCustomField = function(fieldName, value) {
    this.metadata.set(fieldName, value);
    return this.save();
  };

  // Method to get custom field
  productSchema.methods.getCustomField = function(fieldName) {
    return this.metadata.get(fieldName);
  };

  // Static method to search products
  productSchema.statics.search = function(query, options = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      skip = 0
    } = options;

    const filter = {};

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Stock filter
    if (inStock !== undefined) {
      filter.inStock = inStock;
    }

    // Featured filter
    if (featured !== undefined) {
      filter.featured = featured;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    return this.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
  };

  // Static method to get products by category
  productSchema.statics.getByCategory = function(category, options = {}) {
    return this.search('', { ...options, category });
  };

  // Static method to get featured products
  productSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ featured: true, inStock: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  };

  // Pre-save middleware to update timestamp
  productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  // Create and return model
  const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
  
  // Check if model already exists to avoid OverwriteModelError
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  return mongoose.model(modelName, productSchema);
}

/**
 * Predefined schema configurations for common product types
 */
const schemaPresets = {
  // E-commerce generic product
  ecommerce: {
    sku: { type: String, unique: true, sparse: true },
    stock: { type: Number, default: 0, min: 0 },
    weight: { type: Number },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    },
    discount: {
      percentage: { type: Number, min: 0, max: 100 },
      startDate: Date,
      endDate: Date
    }
  },

  // Food/Spice products
  food: {
    weight: { type: String, required: true },
    unit: { type: String, required: true },
    organic: { type: Boolean, default: false },
    origin: { type: String },
    expiryDate: { type: Date },
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    },
    allergens: [String],
    certifications: [String]
  },

  // Fashion/Clothing products
  fashion: {
    sizes: [{ type: String }],
    colors: [{ type: String }],
    material: { type: String },
    brand: { type: String },
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
    season: { type: String, enum: ['spring', 'summer', 'fall', 'winter', 'all'] }
  },

  // Electronics products
  electronics: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    specifications: {
      type: Map,
      of: String
    },
    warranty: {
      duration: Number,
      unit: { type: String, default: 'months' }
    },
    powerRequirements: String,
    connectivity: [String]
  },

  // Digital products
  digital: {
    fileType: { type: String },
    fileSize: { type: String },
    downloadUrl: { type: String },
    version: { type: String },
    license: { type: String },
    compatibility: [String]
  },

  // Service products
  service: {
    duration: { type: Number },
    durationUnit: { type: String, default: 'hours' },
    availability: [{
      day: String,
      startTime: String,
      endTime: String
    }],
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
      address: String
    },
    maxBookings: { type: Number }
  }
};

/**
 * Create a product model with a preset configuration
 * @param {string} presetName - Name of the preset (ecommerce, food, fashion, etc.)
 * @param {Object} additionalFields - Additional custom fields
 * @param {string} collectionName - Collection name
 * @returns {mongoose.Model} - Mongoose model
 */
function createProductModelWithPreset(presetName, additionalFields = {}, collectionName = 'products') {
  const presetFields = schemaPresets[presetName] || {};
  const customFields = { ...presetFields, ...additionalFields };
  return createProductModel(customFields, collectionName);
}

/**
 * Get available schema presets
 * @returns {Array} - List of available preset names
 */
function getAvailablePresets() {
  return Object.keys(schemaPresets);
}

/**
 * Get preset configuration
 * @param {string} presetName - Name of the preset
 * @returns {Object} - Preset configuration
 */
function getPresetConfig(presetName) {
  return schemaPresets[presetName] || null;
}

module.exports = {
  createProductModel,
  createProductModelWithPreset,
  getAvailablePresets,
  getPresetConfig,
  schemaPresets
};
