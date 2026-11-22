/**
 * NVIDIA API Client
 * Handles all interactions with NVIDIA's LLM API
 */

const axios = require('axios');
const { config } = require('../config');

class NVIDIAClient {
  constructor() {
    if (!config.nvidia.apiKey) {
      throw new Error('NVIDIA API key is not configured. Please set NVIDIA_API_KEY in .env');
    }

    this.apiKey = config.nvidia.apiKey;
    this.model = config.nvidia.model;
    this.maxTokens = config.nvidia.maxTokens;
    this.temperature = config.nvidia.temperature;
  }

  async generateCustomizations(params) {
    const { userRequirements, templateInfo } = params;
    const prompt = this._buildCustomizationPrompt(userRequirements, templateInfo);
    try {
      console.log('🤖 Sending request to NVIDIA API...');
      const startTime = Date.now();

      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': 'Bearer ' + this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      const duration = Date.now() - startTime;
      console.log('✅ NVIDIA API response in ' + duration + 'ms');

      const responseText = response.data.choices[0].message.content;
      const customizations = this._parseCustomizationResponse(responseText);

      return { success: true, customizations, metadata: { model: this.model, tokensUsed: response.data.usage, duration } };
    } catch (error) {
      console.error('❌ NVIDIA API Error:', error.message);
      throw new Error('NVIDIA API request failed: ' + error.message);
    }
  }

  _buildCustomizationPrompt(userRequirements, templateInfo) {
    return 'You are an expert e-commerce application customization assistant. Your task is to analyze user requirements and generate precise customization instructions for an e-commerce template.\n\nTEMPLATE INFORMATION:\n- Base Template: Coorg Masala E-commerce Application\n- Stack: MERN (MongoDB, Express, React, Node.js)\n- Features: Product catalog, shopping cart, checkout, admin panel, user authentication\n- Payment: Razorpay integration\n- Database: MongoDB\n- Email: Gmail SMTP\n\nUSER REQUIREMENTS:\n' + userRequirements + '\n\nTASK:\nGenerate a detailed customization plan in JSON format with this structure:\n\n{\n  "appName": "string",\n  "businessType": "string",\n  "brandingChanges": {\n    "companyName": "string",\n    "tagline": "string",\n    "primaryColor": "string - hex color",\n    "secondaryColor": "string - hex color",\n    "logoText": "string"\n  },\n  "productCategories": ["string"],\n  "features": {"enabled": ["string"]},\n  "adminConfig": {"defaultAdminEmail": "string", "defaultAdminPassword": "string"}\n}\n\nReturn ONLY valid JSON, no additional text.';
  }

  _parseCustomizationResponse(responseText) {
    const jsonMatch = responseText.match(/\{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in NVIDIA response');
    }
    const customizations = JSON.parse(jsonMatch[0]);
    const requiredFields = ['appName', 'businessType', 'brandingChanges'];
    for (const field of requiredFields) {
      if (!customizations[field]) {
        throw new Error('Missing required field: ' + field);
      }
    }
    return customizations;
  }

  async healthCheck() {
    try {
      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: this.model,
          max_tokens: 100,
          messages: [{ role: 'user', content: 'Respond with OK if you can read this.' }]
        },
        {
          headers: {
            'Authorization': 'Bearer ' + this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return { status: 'healthy', model: this.model, response: response.data.choices[0].message.content };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = NVIDIAClient;
