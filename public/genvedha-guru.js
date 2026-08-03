/**
 * Genvedha Guru - AI E-commerce App Creator
 * Interactive chatbot for gathering requirements and creating apps
 */

class GenvedhaGuru {
    constructor() {
        // Load configuration from config file or use defaults
        const config = typeof GENVEDHA_CONFIG !== 'undefined' ? GENVEDHA_CONFIG : { USE_CLAUDE_API: false };
        
        // Configuration: Set to false to disable Claude API and use offline mode
        this.USE_CLAUDE_API = config.USE_CLAUDE_API || false;
        this.config = config;
        
        this.requirements = {
            businessName: null,
            productType: null,
            description: null,
            categories: null,
            port: null
        };
        this.conversationHistory = [];
        this.conversationStarted = false;
        this.allRequirementsGathered = false;

        // Feature flag: whether the "Start Creating" flow is enabled.
        // Controlled server-side via the ENABLE_GENVEDHA_CREATION env variable.
        this.creationEnabled = false;

        this.init();
    }

    init() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.quickActions = document.getElementById('quickActions');
        this.robotSpeech = document.getElementById('robotSpeech');
        this.robotStatus = document.getElementById('robotStatus');
        
        // Modal elements
        this.requirementsModal = document.getElementById('requirementsModal');
        this.progressModal = document.getElementById('progressModal');
        this.successModal = document.getElementById('successModal');
        
        this.setupEventListeners();
        this.showWelcomeMessage();
        this.showModeIndicator();

        // Load the server-side feature flag and apply button state
        this.loadFeatureFlags();
    }

    async loadFeatureFlags() {
        // Disable the Start Creating button by default until we confirm it's enabled
        this.setCreationEnabled(false);

        try {
            const response = await fetch('/api/genvedha/config');
            const config = await response.json();
            this.setCreationEnabled(!!config.creationEnabled);
        } catch (error) {
            console.warn('Could not load Genvedha config, keeping creation disabled:', error);
            this.setCreationEnabled(false);
        }
    }

    setCreationEnabled(enabled) {
        this.creationEnabled = enabled;

        const startBtn = document.querySelector('.quick-btn[data-action="start"]');
        if (startBtn) {
            // Keep the label as "Start Creating" in both states; only toggle the disabled state
            startBtn.textContent = '🚀 Start Creating';

            if (enabled) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
                startBtn.removeAttribute('title');
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
            } else {
                startBtn.disabled = true;
                startBtn.classList.add('disabled');
                startBtn.setAttribute('title', 'App creation is currently unavailable. Please contact Genvedha at https://genvedha.com/#contact to generate apps.');
                startBtn.style.opacity = '0.5';
                startBtn.style.cursor = 'not-allowed';
            }
        }

        this.updateContactNote(enabled);
    }

    updateContactNote(enabled) {
        const quickActions = document.getElementById('quickActions');
        if (!quickActions) return;

        let note = document.getElementById('creationContactNote');

        if (enabled) {
            // Remove the note when creation is enabled
            if (note) note.remove();
            return;
        }

        // Create the note if it doesn't exist yet
        if (!note) {
            note = document.createElement('p');
            note.id = 'creationContactNote';
            note.style.cssText = `
                margin-top: 12px;
                font-size: 14px;
                text-align: center;
                color: #666;
                line-height: 1.5;
            `;
            quickActions.insertAdjacentElement('afterend', note);
        }

        note.innerHTML = 'ℹ️ App creation is currently unavailable here. ' +
            'Please <a href="https://genvedha.com/#contact" target="_blank" rel="noopener">contact Genvedha</a> to generate apps.';
    }
    
    showModeIndicator() {
        // Add mode indicator to chat header
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader && !document.getElementById('modeIndicator')) {
            const modeIndicator = document.createElement('div');
            modeIndicator.id = 'modeIndicator';
            modeIndicator.style.cssText = `
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-top: 8px;
                background: ${this.USE_CLAUDE_API ? '#10b981' : '#f59e0b'};
                color: white;
            `;
            modeIndicator.textContent = this.USE_CLAUDE_API ?
                '🌐 AI Mode' : '🔌 Offline Mode';
            chatHeader.appendChild(modeIndicator);
        }
    }

    setupEventListeners() {
        // Send button
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Enter key
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
        
        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Modal buttons
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.requirementsModal.classList.remove('active');
        });
        
        document.getElementById('editRequirements')?.addEventListener('click', () => {
            this.requirementsModal.classList.remove('active');
            this.addBotMessage("Sure! What would you like to change? Just tell me and I'll update it.");
            this.allRequirementsGathered = false;
        });
        
        document.getElementById('approveRequirements')?.addEventListener('click', () => {
            this.requirementsModal.classList.remove('active');
            this.createApp();
        });
        
        document.getElementById('viewApp')?.addEventListener('click', () => {
            this.viewGeneratedApp();
        });
        
        document.getElementById('createAnother')?.addEventListener('click', () => {
            this.resetChat();
        });
    }

    showWelcomeMessage() {
        setTimeout(() => {
            const welcomeMsg = this.config.MESSAGES?.WELCOME ||
                "👋 Hello! I'm Genvedha Guru, your AI assistant for creating e-commerce apps!\n\n" +
                "I can help you build a complete, fully-functional e-commerce application in less than a minute! 🚀\n\n" +
                "Click 'Start Creating' when you're ready, or ask me how it works!";
            
            const modeNote = this.USE_CLAUDE_API ?
                "" : "\n\n🔌 **Note:** Running in offline mode with smart pattern matching.";
            
            this.addBotMessage(welcomeMsg + modeNote);
        }, 500);
    }

    handleQuickAction(action) {
        switch(action) {
            case 'start':
                this.startConversation();
                break;
            case 'example':
                this.showExample();
                break;
            case 'help':
                this.showHelp();
                break;
        }
    }

    startConversation() {
        // Guard: do not allow starting the creation flow when disabled
        if (!this.creationEnabled) {
            this.addBotMessage(
                "ℹ️ **App creation is currently unavailable here.**\n\n" +
                "Please **contact Genvedha** to generate apps: https://genvedha.com/#contact\n\n" +
                "In the meantime, you can click **'💡 Show Example'** or **'❓ How It Works'** to learn more."
            );
            return;
        }

        this.quickActions.style.display = 'none';
        this.conversationStarted = true;
        
        this.updateRobotSpeech("Let's create your app! 🎨");
        this.updateRobotStatus("COLLECTING");
        
        // Show different message based on API availability
        const startMessage = this.USE_CLAUDE_API ?
            (this.config.MESSAGES?.START_ONLINE ||
             "Excellent! Let's get started. 🎉\n\n" +
             "Tell me about your e-commerce business idea. You can share:\n" +
             "• What you want to name your business\n" +
             "• What products you'll be selling\n" +
             "• Any other details about your vision\n\n" +
             "Just chat naturally with me, and I'll gather all the information I need!") :
            (this.config.MESSAGES?.START_OFFLINE ||
             "Great! To get started, could you tell me:\n\n" +
             "• What would you like to name your e-commerce business?\n" +
             "• What type of products will you be selling?\n" +
             "• What product categories do you need?");
        
        this.addBotMessage(startMessage);
    }

    showExample() {
        this.addBotMessage(
            "📚 Here's an example of what I can create:\n\n" +
            "**Business Name:** AquaGarden\n" +
            "**Product Type:** Aquatic Plants\n" +
            "**Description:** Premium aquatic plants for aquariums\n" +
            "**Categories:** Floating Plants, Stem Plants, Carpet Plants, Moss\n" +
            "**Port:** 5001\n\n" +
            "The app will include:\n" +
            "✅ Product catalog with images\n" +
            "✅ Category filtering\n" +
            "✅ Shopping cart\n" +
            "✅ Admin panel\n" +
            "✅ Database integration\n" +
            "✅ Responsive design\n\n" +
            "Ready to create yours? Click 'Start Creating'! 🚀"
        );
    }

    showHelp() {
        this.addBotMessage(
            "🤖 **How Genvedha Guru Works:**\n\n" +
            "1️⃣ **Chat Naturally** - Just tell me about your business idea\n" +
            "2️⃣ **I'll Ask Questions** - I'll gather all needed information through conversation\n" +
            "3️⃣ **Review & Approve** - Check the summary and approve\n" +
            "4️⃣ **App Generated** - Your app is ready in under a minute!\n\n" +
            "**What You Get:**\n" +
            "✅ Full-stack e-commerce application\n" +
            "✅ React frontend with modern UI\n" +
            "✅ Node.js backend with Express\n" +
            "✅ MongoDB database integration\n" +
            "✅ Product management system\n" +
            "✅ Image upload capability\n" +
            "✅ Responsive design\n" +
            "✅ Ready to deploy\n\n" +
            "Click 'Start Creating' to begin! 🎯"
        );
    }

    async handleSendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) {
            console.log('Empty message, ignoring');
            return;
        }
        
        console.log('handleSendMessage called with:', message);
        console.log('conversationStarted:', this.conversationStarted);
        
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });
        
        if (!this.conversationStarted) {
            console.log('Conversation not started, handling pre-conversation message');
            // Handle pre-conversation messages
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('how') || lowerMessage.includes('work')) {
                this.showHelp();
            } else if (lowerMessage.includes('example') || lowerMessage.includes('demo')) {
                this.showExample();
            } else {
                this.addBotMessage(
                    "👋 Hi there! I see you're eager to get started!\n\n" +
                    "Please click the **'🚀 Start Creating'** button below to begin creating your e-commerce app.\n\n" +
                    "Or you can:\n" +
                    "• Click **'💡 Show Example'** to see what I can create\n" +
                    "• Click **'❓ How It Works'** to learn more"
                );
            }
            return;
        }
        
        console.log('Processing message with AI...');
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-bot';
        typingDiv.id = 'typing-indicator';
        const typingAvatar = document.createElement('div');
        typingAvatar.className = 'message-avatar';
        typingAvatar.textContent = '🤖';
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        const typingBubble = document.createElement('div');
        typingBubble.className = 'message-bubble';
        typingBubble.textContent = 'Thinking... ⏳';
        typingBubble.style.fontStyle = 'italic';
        typingBubble.style.color = '#888';
        typingContent.appendChild(typingBubble);
        typingDiv.appendChild(typingAvatar);
        typingDiv.appendChild(typingContent);
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        
        // Process the message with AI
        try {
            await this.processWithAI(message);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            this.addBotMessage("Sorry, I encountered an error. Please try again.");
        }
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async processWithAI(userMessage) {
        console.log('processWithAI called with:', userMessage);
        
        // Show typing indicator
        this.updateRobotSpeech("Thinking... 🤔");
        
        // Check if Claude API is enabled
        if (!this.USE_CLAUDE_API) {
            console.log('Claude API disabled, using offline mode');
            this.processWithRules(userMessage);
            return;
        }
        
        try {
            console.log('Calling API /api/genvedha/analyze-requirements');
            console.log('Conversation history length:', this.conversationHistory.length);
            console.log('Current requirements:', this.requirements);
            
            // Call the LLM API to analyze the conversation
            const response = await fetch('/api/genvedha/analyze-requirements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationHistory: this.conversationHistory,
                    currentRequirements: this.requirements,
                    userMessage: userMessage
                })
            });
            
            console.log('API response status:', response.status);
            
            const result = await response.json();
            console.log('API result:', result);
            
            if (result.success) {
                console.log('API call successful');
                
                // Update requirements with extracted information (only non-null values)
                if (result.extractedInfo) {
                    console.log('Extracted info:', result.extractedInfo);
                    for (const [key, value] of Object.entries(result.extractedInfo)) {
                        if (value !== null && value !== undefined && value !== '') {
                            this.requirements[key] = value;
                        }
                    }
                    console.log('Updated requirements:', this.requirements);
                }
                
                // Show AI response
                console.log('About to call addBotMessage with:', result.response ? result.response.substring(0, 50) : 'EMPTY');
                console.log('chatMessages element:', this.chatMessages);
                console.log('chatMessages children before:', this.chatMessages ? this.chatMessages.children.length : 'N/A');
                this.addBotMessage(result.response);
                console.log('chatMessages children after:', this.chatMessages ? this.chatMessages.children.length : 'N/A');
                
                // Add to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: result.response
                });
                
                // Check if all requirements are gathered
                if (result.allRequirementsGathered) {
                    console.log('All requirements gathered!');
                    this.allRequirementsGathered = true;
                    setTimeout(() => {
                        this.showRequirementsPreview();
                    }, 1000);
                }
                
                this.updateRobotSpeech(result.response.substring(0, 100) + '...');
            } else {
                console.log('API returned success=false, using fallback');
                throw new Error(result.error || 'Failed to process message');
            }
            
        } catch (error) {
            console.error('Error processing with AI:', error);
            console.log('Falling back to rule-based processing');
            
            // Fallback to rule-based processing
            this.processWithRules(userMessage);
        }
    }

    processWithRules(userMessage) {
        console.log('Using rule-based processing (offline mode)');
        console.log('Processing message:', userMessage);
        const lowerMessage = userMessage.toLowerCase();
        
        // Extract business name - improved patterns
        if (!this.requirements.businessName) {
            const namePatterns = [
                /(?:name|call|called)\s+(?:is|it)?\s*['""]?([A-Z][a-zA-Z0-9\s]+)['""]?/i,
                /business\s+(?:name\s+)?(?:is|will be)\s+['""]?([A-Z][a-zA-Z0-9\s]+)['""]?/i,
                /^([A-Z][a-zA-Z0-9\s]+)$/i,  // Just the name alone
                /create\s+([A-Z][a-zA-Z0-9\s]+)/i,  // "create AquaGarden"
            ];
            
            for (const pattern of namePatterns) {
                const match = userMessage.match(pattern);
                if (match && match[1] && match[1].trim().length >= 2) {
                    const extracted = match[1].trim();
                    // Avoid extracting common words
                    if (!['selling', 'products', 'business', 'categories'].includes(extracted.toLowerCase())) {
                        this.requirements.businessName = extracted;
                        console.log('✅ Extracted business name:', this.requirements.businessName);
                        break;
                    }
                }
            }
        }
        
        // Extract product type - improved patterns
        if (!this.requirements.productType) {
            const productPatterns = [
                /selling\s+([a-zA-Z\s]+?)(?:\.|,|categories|$)/i,  // "selling aquatic plants"
                /sell(?:ing)?\s+([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i,
                /products?\s+(?:are|is|like)?\s*[:]\s*([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i,
                /type\s+(?:of\s+)?products?\s*[:]\s*([a-zA-Z\s]+?)(?:\.|,|categories|$)/i,
                /(?:deal|dealing)\s+(?:in|with)\s+([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i
            ];
            
            for (const pattern of productPatterns) {
                const match = userMessage.match(pattern);
                if (match && match[1] && match[1].trim().length >= 3) {
                    const extracted = match[1].trim();
                    // Clean up common trailing words
                    const cleaned = extracted.replace(/\s+(and|with|for)$/i, '').trim();
                    if (cleaned.length >= 3) {
                        this.requirements.productType = cleaned;
                        console.log('✅ Extracted product type:', this.requirements.productType);
                        break;
                    }
                }
            }
        }
        
        // Extract categories - improved patterns
        if (!this.requirements.categories) {
            const categoryPatterns = [
                /categories?\s*[:]\s*([a-zA-Z\s,]+?)(?:\.|$)/i,  // "Categories: A, B, C"
                /categor(?:ies|y)\s+(?:are|include|like)?\s*[:]\s*([a-zA-Z\s,]+)/i,
                /(?:have|need)\s+(?:these\s+)?categories?\s*[:]\s*([a-zA-Z\s,]+)/i,
                /^([a-zA-Z\s,]+)$/i  // Just comma-separated list
            ];
            
            for (const pattern of categoryPatterns) {
                const match = userMessage.match(pattern);
                if (match && match[1]) {
                    const cats = match[1].split(',').map(c => c.trim()).filter(c => c.length > 0 && c.length < 50);
                    if (cats.length >= 2) {  // At least 2 categories
                        this.requirements.categories = cats;
                        console.log('✅ Extracted categories:', this.requirements.categories);
                        break;
                    }
                }
            }
        }
        
        // Generate response based on what's missing
        let response = this.generateRuleBasedResponse();
        this.addBotMessage(response);
        
        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });
        
        this.updateRobotSpeech(response.substring(0, 100) + '...');
        
        // Check if all requirements gathered
        if (this.allRequirementsGathered) {
            setTimeout(() => {
                this.showRequirementsPreview();
            }, 1000);
        }
    }

    generateRuleBasedResponse() {
        console.log('Generating rule-based response...');
        console.log('Current requirements:', this.requirements);
        
        const missing = [];
        
        if (!this.requirements.businessName) missing.push('business name');
        if (!this.requirements.productType) missing.push('product type');
        if (!this.requirements.categories) missing.push('product categories');
        
        console.log('Missing:', missing);
        
        if (missing.length === 0) {
            // All requirements gathered
            console.log('✅ All requirements gathered!');
            this.allRequirementsGathered = true;
            
            // Auto-generate description if not provided
            if (!this.requirements.description) {
                this.requirements.description = `${this.requirements.businessName} - ${this.requirements.productType} e-commerce platform`;
            }
            
            return "Perfect! I have all the information I need. Let me show you a summary of your app requirements.";
        }
        
        if (missing.length === 3) {
            // Nothing gathered yet
            return "Great! To get started, could you tell me:\n\n" +
                   "• What would you like to name your e-commerce business?\n" +
                   "• What type of products will you be selling?\n" +
                   "• What product categories do you need?";
        }
        
        // Some info gathered, ask for missing
        if (!this.requirements.businessName) {
            return "Thanks! What would you like to name your business?";
        }
        
        if (!this.requirements.productType) {
            return `Great! "${this.requirements.businessName}" is a nice name! What type of products will you be selling?`;
        }
        
        if (!this.requirements.categories) {
            return `Perfect! So you'll be selling ${this.requirements.productType}. What product categories would you like? (List them separated by commas, e.g., "Category1, Category2, Category3")`;
        }
        
        return "Thank you! Let me gather a bit more information...";
    }

    showRequirementsPreview() {
        this.updateRobotStatus("REVIEWING");
        this.updateRobotSpeech("Let's review your requirements! 📋");
        
        this.addBotMessage(
            "🎉 Perfect! I've collected all the information I need.\n\n" +
            "Let me show you a summary of your app requirements..."
        );
        
        setTimeout(() => {
            this.displayRequirementsModal();
        }, 1000);
    }

    displayRequirementsModal() {
        const preview = document.getElementById('requirementsPreview');
        
        // Set defaults if not provided
        if (!this.requirements.port) {
            this.requirements.port = 5000;
        }
        
        if (!this.requirements.description) {
            this.requirements.description = `${this.requirements.productType} e-commerce platform`;
        }
        
        // Parse categories
        let categories = this.requirements.categories;
        if (typeof categories === 'string') {
            categories = categories.split(',').map(c => c.trim());
        }
        if (!categories || categories.length === 0) {
            categories = ['General', 'Featured', 'New Arrivals'];
        }
        this.requirements.categories = categories;
        
        preview.innerHTML = `
            <div class="requirement-item">
                <h4>🏢 Business Name</h4>
                <p>${this.requirements.businessName || 'Not specified'}</p>
            </div>
            <div class="requirement-item">
                <h4>📦 Product Type</h4>
                <p>${this.requirements.productType || 'Not specified'}</p>
            </div>
            <div class="requirement-item">
                <h4>📝 Description</h4>
                <p>${this.requirements.description}</p>
            </div>
            <div class="requirement-item">
                <h4>📂 Categories (${categories.length})</h4>
                <p>${categories.join(', ')}</p>
            </div>
            <div class="requirement-item">
                <h4>🔌 Port</h4>
                <p>${this.requirements.port}</p>
            </div>
            <div class="requirement-item">
                <h4>✨ Features Included</h4>
                <p>
                    ✅ Product Catalog<br>
                    ✅ Shopping Cart<br>
                    ✅ Category Filtering<br>
                    ✅ Admin Panel<br>
                    ✅ Image Upload<br>
                    ✅ Database Integration<br>
                    ✅ Responsive Design
                </p>
            </div>
        `;
        
        this.requirementsModal.classList.add('active');
    }

    async createApp() {
        this.progressModal.classList.add('active');
        this.updateRobotStatus("CREATING");
        this.updateRobotSpeech("Creating your app now! 🎨✨");
        
        const steps = [
            { name: 'Initializing', icon: '🚀', duration: 1000 },
            { name: 'Setting up database', icon: '🗄️', duration: 1500 },
            { name: 'Creating backend', icon: '⚙️', duration: 2000 },
            { name: 'Building frontend', icon: '🎨', duration: 2000 },
            { name: 'Configuring categories', icon: '📂', duration: 1500 },
            { name: 'Generating files', icon: '📄', duration: 2000 },
            { name: 'Finalizing', icon: '✨', duration: 1000 }
        ];
        
        const progressSteps = document.getElementById('progressSteps');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // Create step elements
        progressSteps.innerHTML = steps.map((step, index) => `
            <div class="progress-step" id="step-${index}">
                <div class="step-icon">${step.icon}</div>
                <div class="step-text">${step.name}</div>
            </div>
        `).join('');
        
        // Prepare request data
        const categories = typeof this.requirements.categories === 'string' 
            ? this.requirements.categories.split(',').map(c => c.trim())
            : this.requirements.categories;
        
        const requestData = {
            businessName: this.requirements.businessName,
            productType: this.requirements.productType,
            description: this.requirements.description,
            categories: categories.map((name, index) => ({
                id: `cat-${index + 1}`,
                name: name.trim(),
                slug: name.toLowerCase().replace(/\s+/g, '-'),
                description: `${name} products`,
                order: index + 1
            })),
            port: parseInt(this.requirements.port) || 5000,
            mongoUri: 'mongodb://localhost:27017',
            databaseName: this.requirements.businessName.toLowerCase().replace(/\s+/g, '_') + '_db'
        };
        
        try {
            // Animate progress
            let currentProgress = 0;
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepElement = document.getElementById(`step-${i}`);
                
                stepElement.classList.add('active');
                progressText.textContent = step.name + '...';
                
                currentProgress = ((i + 1) / steps.length) * 100;
                progressFill.style.width = currentProgress + '%';
                
                // If this is the "Generating files" step, make the API call
                if (i === 5) {
                    try {
                        const response = await fetch('/api/genvedha/generate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestData)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            this.generatedApp = result;
                        } else {
                            throw new Error(result.error || 'Failed to generate app');
                        }
                    } catch (error) {
                        console.error('Error generating app:', error);
                        // Continue with demo mode
                        this.generatedApp = {
                            success: true,
                            appName: requestData.businessName,
                            outputDir: `./generated-apps/${requestData.databaseName}`,
                            message: 'App generated successfully (Demo Mode)'
                        };
                    }
                }
                
                await this.sleep(step.duration);
                
                stepElement.classList.remove('active');
                stepElement.classList.add('completed');
            }
            
            progressText.textContent = 'Complete! 🎉';
            
            await this.sleep(500);
            
            this.progressModal.classList.remove('active');
            this.showSuccessModal();
            
        } catch (error) {
            console.error('Error creating app:', error);
            this.progressModal.classList.remove('active');
            this.addBotMessage(
                "❌ Oops! Something went wrong while creating your app.\n\n" +
                "Error: " + error.message + "\n\n" +
                "Please try again or contact support at https://genvedha.com/#contact"
            );
            this.updateRobotStatus("ERROR");
        }
    }

    showSuccessModal() {
        this.updateRobotStatus("SUCCESS");
        this.updateRobotSpeech("Your app is ready! 🎉");
        
        const appName = document.getElementById('appName');
        const appDetails = document.getElementById('appDetails');
        
        appName.textContent = this.requirements.businessName;
        
        const categories = typeof this.requirements.categories === 'string'
            ? this.requirements.categories.split(',').map(c => c.trim())
            : this.requirements.categories;
        
        appDetails.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">App Name:</span>
                <span class="detail-value">${this.requirements.businessName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Product Type:</span>
                <span class="detail-value">${this.requirements.productType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Categories:</span>
                <span class="detail-value">${categories.length}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Port:</span>
                <span class="detail-value">${this.requirements.port}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: var(--success-color);">✅ Ready to Launch</span>
            </div>
        `;
        
        this.successModal.classList.add('active');
        
        this.addBotMessage(
            "🎉 **Congratulations!** Your e-commerce app is ready!\n\n" +
            `**${this.requirements.businessName}** has been successfully created with all the features you requested.\n\n` +
            "You can now launch your app and start adding products! 🚀"
        );
    }

    viewGeneratedApp() {
        const dbName = this.requirements.businessName.toLowerCase().replace(/\s+/g, '_') + '_db';
        const port = this.requirements.port;
        
        this.addBotMessage(
            `🚀 **Launching ${this.requirements.businessName}...**\n\n` +
            `Your app is running at: http://localhost:${port}\n\n` +
            `**Next Steps:**\n` +
            `1. Open your terminal\n` +
            `2. Navigate to: ./generated-apps/${dbName}\n` +
            `3. Run: npm install\n` +
            `4. Run: npm start\n\n` +
            `Your app will be live at http://localhost:${port} 🎉`
        );
        
        this.successModal.classList.remove('active');
    }

    resetChat() {
        this.successModal.classList.remove('active');
        this.requirements = {
            businessName: null,
            productType: null,
            description: null,
            categories: null,
            port: null
        };
        this.conversationHistory = [];
        this.conversationStarted = false;
        this.allRequirementsGathered = false;
        this.chatMessages.innerHTML = '';
        this.quickActions.style.display = 'flex';
        this.updateRobotStatus("READY");
        this.updateRobotSpeech("Ready to create another app! 🚀");
        this.showWelcomeMessage();
    }

    addBotMessage(text) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-bot';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = '🤖';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = this.formatMessage(text);
            
            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = this.getCurrentTime();
            
            content.appendChild(bubble);
            content.appendChild(time);
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
            
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        } catch (error) {
            console.error('Error adding bot message:', error);
            // Fallback: just add plain text
            const div = document.createElement('div');
            div.className = 'message message-bot';
            div.textContent = text;
            this.chatMessages.appendChild(div);
        }
    }

    addUserMessage(text) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message message-user';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = text;
            
            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = this.getCurrentTime();
            
            content.appendChild(bubble);
            content.appendChild(time);
            messageDiv.appendChild(content);
            
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        } catch (error) {
            console.error('Error adding user message:', error);
        }
    }

    formatMessage(text) {
        if (!text) return '';
        try {
            // Escape HTML first to prevent XSS
            const div = document.createElement('div');
            div.textContent = text;
            let escaped = div.innerHTML;
            // Convert markdown bold
            escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Convert markdown headers
            escaped = escaped.replace(/^### (.+)$/gm, '<strong>$1</strong>');
            escaped = escaped.replace(/^## (.+)$/gm, '<strong>$1</strong>');
            escaped = escaped.replace(/^# (.+)$/gm, '<strong>$1</strong>');
            // Convert bullet lists
            escaped = escaped.replace(/^- (.+)$/gm, '• $1');
            // Convert newlines
            escaped = escaped.replace(/\n/g, '<br>');
            // Clean up multiple breaks
            escaped = escaped.replace(/(<br>){3,}/g, '<br><br>');
            return escaped;
        } catch (error) {
            console.error('Error formatting message:', error);
            return text;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateRobotSpeech(text) {
        this.robotSpeech.textContent = text;
    }

    updateRobotStatus(status) {
        this.robotStatus.textContent = status;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GenvedhaGuru();
});
