/**
 * Image Upload Routes
 * API endpoints for image upload functionality
 */

const express = require('express');
const router = express.Router();
const imageUploadService = require('../services/image-upload');

/**
 * Upload single image
 * POST /api/images/upload
 */
router.post('/upload', (req, res) => {
  const upload = imageUploadService.getUploadMiddleware('image', false);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      const fileInfo = await imageUploadService.processUpload(req.file, {
        optimize: true,
        thumbnail: true
      });

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: fileInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * Upload multiple images
 * POST /api/images/upload-multiple
 */
router.post('/upload-multiple', (req, res) => {
  const upload = imageUploadService.getUploadMiddleware('images', true);
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      const filesInfo = await imageUploadService.processMultipleUploads(req.files, {
        optimize: true,
        thumbnail: true
      });

      res.json({
        success: true,
        message: `${filesInfo.length} images uploaded successfully`,
        data: filesInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * Delete image
 * DELETE /api/images/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const result = await imageUploadService.deleteFile(req.params.filename);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get image info
 * GET /api/images/:filename
 */
router.get('/:filename', async (req, res) => {
  try {
    const fileInfo = await imageUploadService.getFileInfo(req.params.filename);
    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all images
 * GET /api/images
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset, sortBy, order } = req.query;
    const files = await imageUploadService.listFiles({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      sortBy: sortBy || 'date',
      order: order || 'desc'
    });

    res.json({
      success: true,
      data: files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get storage statistics
 * GET /api/images/stats
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await imageUploadService.getStorageStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cleanup old files
 * POST /api/images/admin/cleanup
 */
router.post('/admin/cleanup', async (req, res) => {
  try {
    const { daysOld } = req.body;
    const results = await imageUploadService.cleanupOldFiles(daysOld || 30);
    res.json({
      success: true,
      message: 'Cleanup completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
