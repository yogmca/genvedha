/**
 * GenVedha LLM Service API Routes
 */

const express = require('express');
const router = express.Router();
const AppGenerator = require('../services/app-generator');
const { validateGenerationRequest, validateCredentials } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limit');

const appGenerator = new AppGenerator();

/**
 * POST /api/genvedha/generate
 * Generate a new e-commerce app
 */
router.post('/generate', rateLimiter, authenticate, validateGenerationRequest, async (req, res) => {
  try {
    const { userRequirements, credentials, userId } = req.body;

    console.log(`\n📨 New generation request from user: ${userId || 'anonymous'}`);

    const credValidation = validateCredentials(credentials);
    if (!credValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials',
        details: credValidation.errors
      });
    }

    const result = await appGenerator.generateApp({
      userRequirements,
      credentials,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'App generated successfully',
      data: {
        generationId: result.generationId,
        appName: result.appName,
        appPath: result.appPath,
        duration: result.duration,
        customizations: result.customizations
      }
    });

  } catch (error) {
    console.error('❌ Generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'App generation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/genvedha/status/:generationId
 */
router.get('/status/:generationId', authenticate, async (req, res) => {
  try {
    const { generationId } = req.params;
    const status = appGenerator.getGenerationStatus(generationId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Generation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { generationId, ...status }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * GET /api/genvedha/health
 */
router.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      service: 'GenVedha LLM Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
