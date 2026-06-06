/**
 * Image Upload System
 * Handles image uploads for admin panel
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class ImageUploadService {
  constructor(uploadDir = 'uploads/images') {
    this.uploadDir = uploadDir;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  }

  /**
   * Initialize upload directory
   */
  async initializeUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Configure multer storage
   */
  getStorage() {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        await this.initializeUploadDir();
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    });
  }

  /**
   * File filter for multer
   */
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check file extension
    if (!this.allowedExtensions.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed: ${this.allowedExtensions.join(', ')}`), false);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed: ${this.allowedMimeTypes.join(', ')}`), false);
    }

    cb(null, true);
  }

  /**
   * Get multer upload middleware
   * @param {string} fieldName - Form field name
   * @param {boolean} multiple - Allow multiple files
   * @returns {Function} - Multer middleware
   */
  getUploadMiddleware(fieldName = 'image', multiple = false) {
    const upload = multer({
      storage: this.getStorage(),
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize
      }
    });

    return multiple ? upload.array(fieldName, 10) : upload.single(fieldName);
  }

  /**
   * Process uploaded file
   * @param {Object} file - Multer file object
   * @param {Object} options - Processing options
   * @returns {Object} - File information
   */
  async processUpload(file, options = {}) {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileInfo = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: `/uploads/images/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date()
    };

    // Optional: Add image optimization here
    if (options.optimize) {
      await this.optimizeImage(file.path);
    }

    // Optional: Generate thumbnail
    if (options.thumbnail) {
      fileInfo.thumbnail = await this.generateThumbnail(file.path);
    }

    return fileInfo;
  }

  /**
   * Process multiple uploaded files
   * @param {Array} files - Array of multer file objects
   * @param {Object} options - Processing options
   * @returns {Array} - Array of file information
   */
  async processMultipleUploads(files, options = {}) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const processedFiles = [];
    for (const file of files) {
      const fileInfo = await this.processUpload(file, options);
      processedFiles.push(fileInfo);
    }

    return processedFiles;
  }

  /**
   * Delete uploaded file
   * @param {string} filename - Filename to delete
   */
  async deleteFile(filename) {
    const filePath = path.join(this.uploadDir, filename);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   * @param {Array} filenames - Array of filenames to delete
   */
  async deleteMultipleFiles(filenames) {
    const results = [];
    
    for (const filename of filenames) {
      try {
        await this.deleteFile(filename);
        results.push({ filename, success: true });
      } catch (error) {
        results.push({ filename, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get file information
   * @param {string} filename - Filename
   * @returns {Object} - File stats
   */
  async getFileInfo(filename) {
    const filePath = path.join(this.uploadDir, filename);
    
    try {
      const stats = await fs.stat(filePath);
      return {
        filename,
        path: filePath,
        url: `/uploads/images/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      throw new Error(`File not found: ${filename}`);
    }
  }

  /**
   * List all uploaded files
   * @param {Object} options - Listing options
   * @returns {Array} - Array of file information
   */
  async listFiles(options = {}) {
    const { limit = 100, offset = 0, sortBy = 'date', order = 'desc' } = options;

    try {
      await this.initializeUploadDir();
      const files = await fs.readdir(this.uploadDir);
      
      const fileInfos = [];
      for (const filename of files) {
        try {
          const info = await this.getFileInfo(filename);
          fileInfos.push(info);
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }

      // Sort files
      fileInfos.sort((a, b) => {
        if (sortBy === 'date') {
          return order === 'desc' 
            ? b.createdAt - a.createdAt 
            : a.createdAt - b.createdAt;
        } else if (sortBy === 'size') {
          return order === 'desc' ? b.size - a.size : a.size - b.size;
        } else if (sortBy === 'name') {
          return order === 'desc'
            ? b.filename.localeCompare(a.filename)
            : a.filename.localeCompare(b.filename);
        }
        return 0;
      });

      // Apply pagination
      return fileInfos.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Optimize image (placeholder - requires sharp or similar library)
   * @param {string} filePath - Path to image file
   */
  async optimizeImage(filePath) {
    // TODO: Implement image optimization using sharp
    // const sharp = require('sharp');
    // await sharp(filePath)
    //   .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality: 85 })
    //   .toFile(filePath + '.optimized');
    
    return filePath;
  }

  /**
   * Generate thumbnail (placeholder - requires sharp or similar library)
   * @param {string} filePath - Path to image file
   * @returns {string} - Thumbnail URL
   */
  async generateThumbnail(filePath) {
    // TODO: Implement thumbnail generation using sharp
    // const sharp = require('sharp');
    // const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
    // await sharp(filePath)
    //   .resize(200, 200, { fit: 'cover' })
    //   .toFile(thumbnailPath);
    
    return filePath.replace(/(\.[^.]+)$/, '_thumb$1');
  }

  /**
   * Validate image dimensions
   * @param {string} filePath - Path to image file
   * @param {Object} constraints - Dimension constraints
   * @returns {boolean} - Validation result
   */
  async validateDimensions(filePath, constraints = {}) {
    // TODO: Implement dimension validation using sharp
    // const sharp = require('sharp');
    // const metadata = await sharp(filePath).metadata();
    // const { minWidth, maxWidth, minHeight, maxHeight } = constraints;
    
    return true;
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage stats
   */
  async getStorageStats() {
    try {
      const files = await this.listFiles({ limit: 10000 });
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        uploadDir: this.uploadDir
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Clean up old files
   * @param {number} daysOld - Delete files older than this many days
   * @returns {Object} - Cleanup results
   */
  async cleanupOldFiles(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const files = await this.listFiles({ limit: 10000 });
    const filesToDelete = files.filter(file => file.createdAt < cutoffDate);

    const results = await this.deleteMultipleFiles(
      filesToDelete.map(f => f.filename)
    );

    return {
      totalChecked: files.length,
      deleted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = new ImageUploadService();
