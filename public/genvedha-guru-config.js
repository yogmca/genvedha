/**
 * Genvedha Guru Configuration
 * 
 * Configure the chatbot behavior here
 */

const GENVEDHA_CONFIG = {
    // Set to true to enable Claude API integration (requires API key on server)
    // Set to false to use offline rule-based mode
    USE_CLAUDE_API: false,
    
    // Default port for generated apps
    DEFAULT_PORT: 5000,
    
    // Minimum requirements for app generation
    MIN_CATEGORIES: 2,
    
    // API endpoints
    API_ENDPOINTS: {
        ANALYZE: '/api/genvedha/analyze-requirements',
        GENERATE: '/api/genvedha/generate'
    },
    
    // Messages
    MESSAGES: {
        OFFLINE_MODE: '🔌 Running in offline mode - using smart pattern matching',
        ONLINE_MODE: '🌐 Connected to AI service',
        WELCOME: "👋 Hello! I'm Genvedha Guru, your AI assistant for creating e-commerce apps!\n\n" +
                 "I can help you build a complete, fully-functional e-commerce application in less than a minute! 🚀\n\n" +
                 "Click 'Start Creating' when you're ready, or ask me how it works!",
        START_OFFLINE: "Great! To get started, could you tell me:\n\n" +
                      "• What would you like to name your e-commerce business?\n" +
                      "• What type of products will you be selling?\n" +
                      "• What product categories do you need?",
        START_ONLINE: "Excellent! Let's get started. 🎉\n\n" +
                     "Tell me about your e-commerce business idea. You can share:\n" +
                     "• What you want to name your business\n" +
                     "• What products you'll be selling\n" +
                     "• Any other details about your vision\n\n" +
                     "Just chat naturally with me, and I'll gather all the information I need!"
    }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GENVEDHA_CONFIG;
}
