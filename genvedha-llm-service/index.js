/**
 * GenVedha LLM Service - Main Entry Point
 * AI-Powered E-commerce App Generator
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { config, validateConfig } = require('./config');
const routes = require('./api/routes');
const AppGenerator = require('./services/app-generator');

class GenvedhaLLMService {
  constructor() {
    this.app = express();
    this.appGenerator = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 GenVedha LLM Service - Initializing...');
      console.log('='.repeat(60) + '\n');

      // Validate configuration
      if (!validateConfig()) {
        throw new Error('Configuration validation failed');
      }

      // Setup middleware
      this._setupMiddleware();

      // Setup routes
      this._setupRoutes();

      // Initialize app generator
      console.log('📦 Initializing App Generator...');
      this.appGenerator = new AppGenerator();
      await this.appGenerator.initialize();

      console.log('\n' + '='.repeat(60));
      console.log('✅ GenVedha LLM Service - Ready!');
      console.log('='.repeat(60) + '\n');

      return true;
    } catch (error) {
      console.error('\n❌ Failed to initialize GenVedha LLM Service:', error.message);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  _setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Body parser
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
      });
    });
  }

  /**
   * Setup API routes
   */
  _setupRoutes() {
    // Mount GenVedha routes
    this.app.use('/api/genvedha', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'GenVedha LLM Service',
        version: '1.0.0',
        status: 'running',
        description: 'AI-Powered E-commerce App Generator',
        endpoints: {
          generate: 'POST /api/genvedha/generate',
          status: 'GET /api/genvedha/status/:id',
          health: 'GET /api/genvedha/health'
        }
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
      });
    });
  }

  /**
   * Start the service
   */
  async start() {
    try {
      await this.initialize();

      const port = config.service.port;
      this.app.listen(port, () => {
        console.log(`\n🌐 GenVedha LLM Service listening on port ${port}`);
        console.log(`📍 Service URL: http://localhost:${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/api/genvedha/health\n`);
      });
    } catch (error) {
      console.error('❌ Failed to start service:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

// Export for integration with main server
module.exports = GenvedhaLLMService;

// Run standalone if executed directly
if (require.main === module) {
  const service = new GenvedhaLLMService();
  service.start();
}
