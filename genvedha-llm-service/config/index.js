/**
 * GenVedha LLM Service Configuration
 * Loads all environment variables and configuration settings
 */

require('dotenv').config();

const config = {
  // Claude API Configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7
  },

  // NVIDIA API Configuration
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY,
    model: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-8b-instruction',
    maxTokens: parseInt(process.env.NVIDIA_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.NVIDIA_TEMPERATURE) || 0.7
  },

  // Template Repository Configuration
  template: {
    repoUrl: process.env.TEMPLATE_REPO_URL || 'https://github.com/yogmca/coorgmasala.git',
    branch: process.env.TEMPLATE_BRANCH || 'coorg_masal_genvedha_template',
    localPath: process.env.TEMPLATE_LOCAL_PATH || './templates/generic-template'
  },

  // Generated Apps Configuration
  generatedApps: {
    basePath: process.env.GENERATED_APPS_PATH || './generated-apps',
    maxApps: parseInt(process.env.MAX_GENERATED_APPS) || 100,
    cleanupDays: parseInt(process.env.CLEANUP_DAYS) || 30
  },

  // Service Configuration
  service: {
    port: parseInt(process.env.GENVEDHA_SERVICE_PORT) || 3001,
    maxConcurrentGenerations: parseInt(process.env.MAX_CONCURRENT_GENERATIONS) || 5,
    generationTimeout: parseInt(process.env.GENERATION_TIMEOUT) || 300000 // 5 minutes
  },

  // Security Configuration
  security: {
    enableAuth: process.env.ENABLE_AUTH === 'true',
    apiKey: process.env.GENVEDHA_API_KEY,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 10
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logPath: process.env.LOG_PATH || './logs'
  }
};

// Validation
function validateConfig() {
  const errors = [];

  // Check that at least one LLM is configured
  const hasClaude = config.claude && config.claude.apiKey;
  const hasNVIDIA = config.nvidia && config.nvidia.apiKey;

  if (!hasClaude && !hasNVIDIA) {
    errors.push('Either CLAUDE_API_KEY or NVIDIA_API_KEY must be configured');
  }

  if (!config.template.repoUrl) {
    errors.push('TEMPLATE_REPO_URL is required');
  }

  if (config.security.enableAuth && !config.security.apiKey) {
    errors.push('GENVEDHA_API_KEY is required when authentication is enabled');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }

  return true;
}

module.exports = {
  config,
  validateConfig
};
