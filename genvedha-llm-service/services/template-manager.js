/**
 * Template Manager
 * Handles cloning, caching, and managing the e-commerce template
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { config } = require('../config');

const execAsync = promisify(exec);

class TemplateManager {
  constructor() {
    this.templatePath = config.template.localPath;
    this.repoUrl = config.template.repoUrl;
    this.branch = config.template.branch;
    this.isInitialized = false;
  }

  /**
   * Initialize the template (clone if not exists, update if exists)
   */
  async initialize() {
    try {
      console.log('📦 Initializing template manager...');

      // Ensure templates directory exists
      await fs.ensureDir(path.dirname(this.templatePath));

      // Check if template already exists
      if (await fs.pathExists(this.templatePath)) {
        console.log('✅ Template already exists, updating...');
        await this.updateTemplate();
      } else {
        console.log('📥 Cloning template from GitHub...');
        await this.cloneTemplate();
      }

      this.isInitialized = true;
      console.log('✅ Template manager initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize template:', error.message);
      throw error;
    }
  }

  /**
   * Clone the template repository
   */
  async cloneTemplate() {
    try {
      const command = `git clone -b ${this.branch} ${this.repoUrl} ${this.templatePath}`;
      console.log(`Executing: ${command}`);

      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Git clone warning:', stderr);
      }

      console.log('✅ Template cloned successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clone template:', error.message);
      throw new Error(`Template clone failed: ${error.message}`);
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate() {
    try {
      const command = `cd ${this.templatePath} && git pull origin ${this.branch}`;
      const { stdout, stderr } = await execAsync(command);
      
      console.log('✅ Template updated successfully');
      return true;
    } catch (error) {
      console.warn('⚠️  Failed to update template, will use existing version:', error.message);
      return false;
    }
  }

  /**
   * Copy template to a new location for customization
   * @param {string} destinationPath - Where to copy the template
   * @returns {Promise<string>} Path to the copied template
   */
  async copyTemplate(destinationPath) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📋 Copying template to ${destinationPath}...`);

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(destinationPath));

      // Copy template
      await fs.copy(this.templatePath, destinationPath, {
        filter: (src) => {
          // Exclude .git directory and node_modules
          const basename = path.basename(src);
          return basename !== '.git' && basename !== 'node_modules';
        }
      });

      console.log('✅ Template copied successfully');
      return destinationPath;
    } catch (error) {
      console.error('❌ Failed to copy template:', error.message);
      throw error;
    }
  }

  /**
   * Get list of all files in the template
   * @returns {Promise<Array<string>>} List of file paths
   */
  async getTemplateFiles() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const files = [];
      
      async function walkDir(dir, baseDir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);
          
          // Skip certain directories
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          
          if (entry.isDirectory()) {
            await walkDir(fullPath, baseDir);
          } else {
            files.push(relativePath);
          }
        }
      }

      await walkDir(this.templatePath, this.templatePath);
      return files;
    } catch (error) {
      console.error('❌ Failed to get template files:', error.message);
      throw error;
    }
  }

  /**
   * Get template information
   */
  async getTemplateInfo() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const packageJsonPath = path.join(this.templatePath, 'package.json');
      const readmePath = path.join(this.templatePath, 'README.md');

      const info = {
        name: 'Coorg Masala E-commerce Template',
        path: this.templatePath,
        exists: await fs.pathExists(this.templatePath)
      };

      // Read package.json if exists
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        info.version = packageJson.version;
        info.dependencies = Object.keys(packageJson.dependencies || {});
      }

      // Read README if exists
      if (await fs.pathExists(readmePath)) {
        const readme = await fs.readFile(readmePath, 'utf-8');
        info.description = readme.split('\n')[0]; // First line
      }

      return info;
    } catch (error) {
      console.error('❌ Failed to get template info:', error.message);
      throw error;
    }
  }

  /**
   * Validate template structure
   */
  async validateTemplate() {
    try {
      const requiredFiles = [
        'package.json',
        'server.js',
        '.env.example'
      ];

      const requiredDirs = [
        'src',
        'public'
      ];

      const errors = [];

      // Check required files
      for (const file of requiredFiles) {
        const filePath = path.join(this.templatePath, file);
        if (!await fs.pathExists(filePath)) {
          errors.push(`Missing required file: ${file}`);
        }
      }

      // Check required directories
      for (const dir of requiredDirs) {
        const dirPath = path.join(this.templatePath, dir);
        if (!await fs.pathExists(dirPath)) {
          errors.push(`Missing required directory: ${dir}`);
        }
      }

      if (errors.length > 0) {
        return {
          valid: false,
          errors
        };
      }

      return {
        valid: true,
        message: 'Template structure is valid'
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }
}

module.exports = TemplateManager;
