/**
 * Claude API Client
 * Handles all interactions with Anthropic's Claude API
 */

const Anthropic = require('@anthropic-ai/sdk');
const { config } = require('../config');

class ClaudeClient {
  constructor() {
    if (!config.claude.apiKey) {
      throw new Error('Claude API key is not configured. Please set CLAUDE_API_KEY in .env');
    }

    this.client = new Anthropic({
      apiKey: config.claude.apiKey
    });

    this.model = config.claude.model;
    this.maxTokens = config.claude.maxTokens;
    this.temperature = config.claude.temperature;
  }

  /**
   * Generate customization instructions based on user requirements
   * @param {Object} params - Generation parameters
   * @param {string} params.userRequirements - Natural language requirements from user
   * @param {Object} params.templateInfo - Information about the template
   * @returns {Promise<Object>} Customization instructions
   */
  async generateCustomizations(params) {
    const { userRequirements, templateInfo } = params;

    const prompt = this._buildCustomizationPrompt(userRequirements, templateInfo);

    try {
      console.log('🤖 Sending request to Claude API...');
      const startTime = Date.now();

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Claude API response received in ${duration}ms`);

      // Extract the response content
      const responseText = message.content[0].text;
      
      // Parse JSON response
      const customizations = this._parseCustomizationResponse(responseText);

      return {
        success: true,
        customizations,
        metadata: {
          model: this.model,
          tokensUsed: message.usage,
          duration
        }
      };

    } catch (error) {
      console.error('❌ Claude API Error:', error.message);
      throw new Error(`Claude API request failed: ${error.message}`);
    }
  }

  /**
   * Build the prompt for Claude to generate customizations
   */
  _buildCustomizationPrompt(userRequirements, templateInfo) {
    return `You are an expert e-commerce application customization assistant. Your task is to analyze user requirements and generate precise customization instructions for an e-commerce template.

TEMPLATE INFORMATION:
- Base Template: Coorg Masala E-commerce Application
- Stack: MERN (MongoDB, Express, React, Node.js)
- Features: Product catalog, shopping cart, checkout, admin panel, user authentication
- Payment: Razorpay integration
- Database: MongoDB
- Email: Gmail SMTP

USER REQUIREMENTS:
${userRequirements}

TASK:
Generate a detailed customization plan in JSON format with the following structure:

{
  "appName": "string - The name of the e-commerce application",
  "businessType": "string - Type of business (e.g., 'spices', 'fashion', 'electronics')",
  "brandingChanges": {
    "companyName": "string",
    "tagline": "string",
    "primaryColor": "string - hex color",
    "secondaryColor": "string - hex color",
    "logoText": "string"
  },
  "productCategories": [
    "string - category names based on business type"
  ],
  "features": {
    "enableCOD": boolean,
    "enableWishlist": boolean,
    "enableReviews": boolean,
    "enableCoupons": boolean,
    "enableWhatsApp": boolean,
    "multiLanguage": boolean
  },
  "emailConfig": {
    "senderName": "string",
    "supportEmail": "string"
  },
  "seoConfig": {
    "metaTitle": "string",
    "metaDescription": "string",
    "keywords": ["string"]
  },
  "adminConfig": {
    "defaultAdminEmail": "string",
    "defaultAdminPassword": "string - generate a secure password"
  },
  "customizations": [
    {
      "file": "string - file path to modify",
      "changes": "string - description of changes needed",
      "priority": "high|medium|low"
    }
  ]
}

IMPORTANT:
1. Keep the core MERN stack structure intact
2. Only suggest modifications that maintain compatibility
3. Generate realistic business names and branding
4. Ensure all configurations are production-ready
5. Include security best practices
6. Return ONLY valid JSON, no additional text

Generate the customization plan now:`;
  }

  /**
   * Parse Claude's response and extract customization data
   */
  _parseCustomizationResponse(responseText) {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const customizations = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = ['appName', 'businessType', 'brandingChanges'];
      for (const field of requiredFields) {
        if (!customizations[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return customizations;

    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error.message);
      console.error('Response text:', responseText);
      throw new Error(`Failed to parse customization response: ${error.message}`);
    }
  }

  /**
   * Generate code modifications based on customizations
   * @param {Object} customizations - The customization plan
   * @param {Array} templateFiles - List of template files
   * @returns {Promise<Object>} Code modifications
   */
  async generateCodeModifications(customizations, templateFiles) {
    const prompt = `You are an expert MERN stack developer. Generate specific code modifications for the following customization plan.

CUSTOMIZATION PLAN:
${JSON.stringify(customizations, null, 2)}

TEMPLATE FILES AVAILABLE:
${templateFiles.slice(0, 50).join('\n')}

TASK:
Generate specific code changes needed for each file. Return a JSON array with this structure:

[
  {
    "file": "path/to/file.js",
    "action": "modify|create|delete",
    "changes": [
      {
        "type": "replace|insert|delete",
        "search": "string to find (for replace)",
        "replace": "new content",
        "line": number (optional),
        "description": "what this change does"
      }
    ]
  }
]

Focus on:
1. Branding changes (company name, colors, logo text)
2. Configuration updates (email, payment, database)
3. Feature toggles
4. SEO metadata
5. Admin credentials

Return ONLY valid JSON, no additional text.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for more precise code
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('❌ Failed to generate code modifications:', error.message);
      throw error;
    }
  }

  /**
   * Health check for Claude API
   */
  async healthCheck() {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Respond with "OK" if you can read this.'
        }]
      });

      return {
        status: 'healthy',
        model: this.model,
        response: message.content[0].text
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = ClaudeClient;
