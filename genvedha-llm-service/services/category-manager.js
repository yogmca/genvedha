/**
 * Dynamic Category Manager
 * Loads and manages categories from configuration
 */

const fs = require('fs').promises;
const path = require('path');

class CategoryManager {
  constructor() {
    this.categories = [];
    this.configPath = null;
    this.cacheEnabled = true;
    this.lastLoadTime = null;
  }

  /**
   * Load categories from configuration file
   * @param {string} configPath - Path to category config file
   * @returns {Array} - Array of categories
   */
  async loadFromConfig(configPath) {
    try {
      this.configPath = configPath;
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      this.categories = this.validateCategories(config.categories || []);
      this.lastLoadTime = Date.now();
      
      return this.categories;
    } catch (error) {
      throw new Error(`Failed to load categories from config: ${error.message}`);
    }
  }

  /**
   * Load categories from object
   * @param {Object} config - Configuration object
   * @returns {Array} - Array of categories
   */
  loadFromObject(config) {
    this.categories = this.validateCategories(config.categories || []);
    this.lastLoadTime = Date.now();
    return this.categories;
  }

  /**
   * Validate category structure
   * @param {Array} categories - Categories to validate
   * @returns {Array} - Validated categories
   */
  validateCategories(categories) {
    return categories.map(category => {
      if (!category.id || !category.name) {
        throw new Error('Category must have id and name');
      }

      return {
        id: category.id,
        name: category.name,
        slug: category.slug || this.generateSlug(category.name),
        description: category.description || '',
        icon: category.icon || null,
        image: category.image || null,
        parent: category.parent || null,
        order: category.order || 0,
        active: category.active !== false,
        metadata: category.metadata || {}
      };
    });
  }

  /**
   * Generate slug from name
   * @param {string} name - Category name
   * @returns {string} - Slug
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get all categories
   * @param {Object} options - Query options
   * @returns {Array} - Filtered categories
   */
  getAll(options = {}) {
    let result = [...this.categories];

    // Filter by active status
    if (options.activeOnly) {
      result = result.filter(cat => cat.active);
    }

    // Filter by parent
    if (options.parent !== undefined) {
      result = result.filter(cat => cat.parent === options.parent);
    }

    // Sort by order
    result.sort((a, b) => a.order - b.order);

    return result;
  }

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Object|null} - Category object
   */
  getById(id) {
    return this.categories.find(cat => cat.id === id) || null;
  }

  /**
   * Get category by slug
   * @param {string} slug - Category slug
   * @returns {Object|null} - Category object
   */
  getBySlug(slug) {
    return this.categories.find(cat => cat.slug === slug) || null;
  }

  /**
   * Get root categories (no parent)
   * @returns {Array} - Root categories
   */
  getRootCategories() {
    return this.categories
      .filter(cat => !cat.parent && cat.active)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get child categories
   * @param {string} parentId - Parent category ID
   * @returns {Array} - Child categories
   */
  getChildren(parentId) {
    return this.categories
      .filter(cat => cat.parent === parentId && cat.active)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get category tree (hierarchical structure)
   * @returns {Array} - Category tree
   */
  getTree() {
    const buildTree = (parentId = null) => {
      return this.categories
        .filter(cat => cat.parent === parentId && cat.active)
        .sort((a, b) => a.order - b.order)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };

    return buildTree();
  }

  /**
   * Get category path (breadcrumb)
   * @param {string} categoryId - Category ID
   * @returns {Array} - Array of categories from root to current
   */
  getPath(categoryId) {
    const path = [];
    let current = this.getById(categoryId);

    while (current) {
      path.unshift(current);
      current = current.parent ? this.getById(current.parent) : null;
    }

    return path;
  }

  /**
   * Add new category
   * @param {Object} category - Category data
   * @returns {Object} - Added category
   */
  add(category) {
    const validated = this.validateCategories([category])[0];
    
    // Check for duplicate ID
    if (this.getById(validated.id)) {
      throw new Error(`Category with ID ${validated.id} already exists`);
    }

    this.categories.push(validated);
    return validated;
  }

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated category
   */
  update(id, updates) {
    const index = this.categories.findIndex(cat => cat.id === id);
    
    if (index === -1) {
      throw new Error(`Category with ID ${id} not found`);
    }

    const updated = {
      ...this.categories[index],
      ...updates,
      id // Prevent ID change
    };

    this.categories[index] = this.validateCategories([updated])[0];
    return this.categories[index];
  }

  /**
   * Delete category
   * @param {string} id - Category ID
   * @param {boolean} deleteChildren - Also delete child categories
   * @returns {boolean} - Success status
   */
  delete(id, deleteChildren = false) {
    const index = this.categories.findIndex(cat => cat.id === id);
    
    if (index === -1) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Check for children
    const children = this.getChildren(id);
    if (children.length > 0 && !deleteChildren) {
      throw new Error(`Category has ${children.length} children. Set deleteChildren=true to delete them.`);
    }

    // Delete children recursively
    if (deleteChildren) {
      children.forEach(child => this.delete(child.id, true));
    }

    this.categories.splice(index, 1);
    return true;
  }

  /**
   * Save categories to config file
   * @param {string} configPath - Path to save config (optional)
   * @returns {boolean} - Success status
   */
  async saveToConfig(configPath = null) {
    const savePath = configPath || this.configPath;
    
    if (!savePath) {
      throw new Error('No config path specified');
    }

    try {
      const config = {
        categories: this.categories,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(savePath, JSON.stringify(config, null, 2), 'utf-8');
      return true;
    } catch (error) {
      throw new Error(`Failed to save categories: ${error.message}`);
    }
  }

  /**
   * Reload categories from config
   * @returns {Array} - Reloaded categories
   */
  async reload() {
    if (!this.configPath) {
      throw new Error('No config path set. Use loadFromConfig first.');
    }

    return await this.loadFromConfig(this.configPath);
  }

  /**
   * Search categories
   * @param {string} query - Search query
   * @returns {Array} - Matching categories
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.categories.filter(cat => 
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery) ||
      cat.slug.includes(lowerQuery)
    );
  }

  /**
   * Get category statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      total: this.categories.length,
      active: this.categories.filter(cat => cat.active).length,
      inactive: this.categories.filter(cat => !cat.active).length,
      root: this.getRootCategories().length,
      lastLoadTime: this.lastLoadTime
    };
  }

  /**
   * Export categories to different formats
   * @param {string} format - Export format (json, csv)
   * @returns {string} - Exported data
   */
  export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.categories, null, 2);
    } else if (format === 'csv') {
      const headers = ['id', 'name', 'slug', 'description', 'parent', 'order', 'active'];
      const rows = this.categories.map(cat => 
        headers.map(h => cat[h] || '').join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Import categories from different formats
   * @param {string} data - Data to import
   * @param {string} format - Import format (json, csv)
   * @param {boolean} merge - Merge with existing or replace
   * @returns {Array} - Imported categories
   */
  import(data, format = 'json', merge = false) {
    let imported = [];

    if (format === 'json') {
      imported = JSON.parse(data);
    } else if (format === 'csv') {
      const lines = data.split('\n');
      const headers = lines[0].split(',');
      
      imported = lines.slice(1).map(line => {
        const values = line.split(',');
        const category = {};
        headers.forEach((header, i) => {
          category[header] = values[i];
        });
        return category;
      });
    } else {
      throw new Error(`Unsupported import format: ${format}`);
    }

    const validated = this.validateCategories(imported);

    if (merge) {
      validated.forEach(cat => {
        const existing = this.getById(cat.id);
        if (existing) {
          this.update(cat.id, cat);
        } else {
          this.add(cat);
        }
      });
    } else {
      this.categories = validated;
    }

    return this.categories;
  }

  /**
   * Create default category configuration
   * @param {string} businessType - Type of business
   * @returns {Array} - Default categories
   */
  static createDefaultConfig(businessType = 'ecommerce') {
    const configs = {
      ecommerce: [
        { id: 'electronics', name: 'Electronics', order: 1 },
        { id: 'clothing', name: 'Clothing', order: 2 },
        { id: 'home', name: 'Home & Garden', order: 3 },
        { id: 'sports', name: 'Sports & Outdoors', order: 4 }
      ],
      food: [
        { id: 'spices', name: 'Spices', order: 1 },
        { id: 'grains', name: 'Grains', order: 2 },
        { id: 'beverages', name: 'Beverages', order: 3 },
        { id: 'snacks', name: 'Snacks', order: 4 }
      ],
      fashion: [
        { id: 'mens', name: "Men's Fashion", order: 1 },
        { id: 'womens', name: "Women's Fashion", order: 2 },
        { id: 'kids', name: "Kids' Fashion", order: 3 },
        { id: 'accessories', name: 'Accessories', order: 4 }
      ],
      services: [
        { id: 'consulting', name: 'Consulting', order: 1 },
        { id: 'design', name: 'Design', order: 2 },
        { id: 'development', name: 'Development', order: 3 },
        { id: 'marketing', name: 'Marketing', order: 4 }
      ]
    };

    return configs[businessType] || configs.ecommerce;
  }
}

module.exports = new CategoryManager();
