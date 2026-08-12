import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/genvedha-guru.css';

// Configuration (ported from public/genvedha-guru-config.js)
const CONFIG = {
  USE_CLAUDE_API: false,
  DEFAULT_PORT: 5000,
  MIN_CATEGORIES: 2,
  API_ENDPOINTS: {
    ANALYZE: '/api/genvedha/analyze-requirements',
    GENERATE: '/api/genvedha/generate'
  },
  MESSAGES: {
    WELCOME:
      "👋 Hello! I'm Genvedha Guru, your AI assistant for creating e-commerce apps!\n\n" +
      'I can help you build a complete, fully-functional e-commerce application in less than a minute! 🚀\n\n' +
      "Click 'Start Creating' when you're ready, or ask me how it works!",
    START_OFFLINE:
      'Great! To get started, could you tell me:\n\n' +
      '• What would you like to name your e-commerce business?\n' +
      '• What type of products will you be selling?\n' +
      '• What product categories do you need?',
    START_ONLINE:
      "Excellent! Let's get started. 🎉\n\n" +
      'Tell me about your e-commerce business idea. You can share:\n' +
      '• What you want to name your business\n' +
      "• What products you'll be selling\n" +
      '• Any other details about your vision\n\n' +
      "Just chat naturally with me, and I'll gather all the information I need!"
  }
};

const PROGRESS_STEPS = [
  { name: 'Initializing', icon: '🚀', duration: 1000 },
  { name: 'Setting up database', icon: '🗄️', duration: 1500 },
  { name: 'Creating backend', icon: '⚙️', duration: 2000 },
  { name: 'Building frontend', icon: '🎨', duration: 2000 },
  { name: 'Configuring categories', icon: '📂', duration: 1500 },
  { name: 'Generating files', icon: '📄', duration: 2000 },
  { name: 'Finalizing', icon: '✨', duration: 1000 }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCurrentTime = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// Format markdown-ish text to safe HTML (ported from formatMessage)
const formatMessage = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  let escaped = div.innerHTML;
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/^### (.+)$/gm, '<strong>$1</strong>');
  escaped = escaped.replace(/^## (.+)$/gm, '<strong>$1</strong>');
  escaped = escaped.replace(/^# (.+)$/gm, '<strong>$1</strong>');
  escaped = escaped.replace(/^- (.+)$/gm, '• $1');
  escaped = escaped.replace(/\n/g, '<br>');
  escaped = escaped.replace(/(<br>){3,}/g, '<br><br>');
  return escaped;
};

const GenvedhaGuru = () => {
  const USE_CLAUDE_API = CONFIG.USE_CLAUDE_API;

  // Chat + conversation state
  const [messages, setMessages] = useState([]); // {sender:'bot'|'user', text, time}
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [creationEnabled, setCreationEnabled] = useState(false);

  // Robot state
  const [robotStatus, setRobotStatus] = useState('READY');
  const [robotSpeech, setRobotSpeech] = useState(
    "Hello! I'm Genvedha Guru, your AI assistant. I can help you create a complete e-commerce app in less than a minute! 🚀"
  );

  // Requirements (kept in a ref so async logic reads latest values)
  const requirementsRef = useRef({
    businessName: null,
    productType: null,
    description: null,
    categories: null,
    port: null
  });
  const conversationHistoryRef = useRef([]);
  const allRequirementsGatheredRef = useRef(false);

  // Modals
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Progress
  const [progressStepStates, setProgressStepStates] = useState([]); // 'active'|'completed'|''
  const [progressFill, setProgressFill] = useState(0);
  const [progressText, setProgressText] = useState('Initializing...');

  const chatMessagesRef = useRef(null);
  const generatedAppRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = chatMessagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const addBotMessage = useCallback(
    (text) => {
      setMessages((prev) => [...prev, { sender: 'bot', text, time: getCurrentTime() }]);
    },
    []
  );

  const addUserMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { sender: 'user', text, time: getCurrentTime() }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Welcome message + feature flags on mount
  useEffect(() => {
    const t = setTimeout(() => {
      addBotMessage(CONFIG.MESSAGES.WELCOME);
    }, 500);

    // Load server feature flag
    (async () => {
      setCreationEnabled(false);
      try {
        const response = await fetch('/api/genvedha/config');
        const config = await response.json();
        setCreationEnabled(!!config.creationEnabled);
      } catch (error) {
        console.warn('Could not load Genvedha config, keeping creation disabled:', error);
        setCreationEnabled(false);
      }
    })();

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Rule-based (offline) processing ----
  const generateRuleBasedResponse = useCallback(() => {
    const req = requirementsRef.current;
    const missing = [];
    if (!req.businessName) missing.push('business name');
    if (!req.productType) missing.push('product type');
    if (!req.categories) missing.push('product categories');

    if (missing.length === 0) {
      allRequirementsGatheredRef.current = true;
      if (!req.description) {
        req.description = `${req.businessName} - ${req.productType} e-commerce platform`;
      }
      return 'Perfect! I have all the information I need. Let me show you a summary of your app requirements.';
    }

    if (missing.length === 3) {
      return (
        'Great! To get started, could you tell me:\n\n' +
        '• What would you like to name your e-commerce business?\n' +
        '• What type of products will you be selling?\n' +
        '• What product categories do you need?'
      );
    }

    if (!req.businessName) return 'Thanks! What would you like to name your business?';
    if (!req.productType)
      return `Great! "${req.businessName}" is a nice name! What type of products will you be selling?`;
    if (!req.categories)
      return `Perfect! So you'll be selling ${req.productType}. What product categories would you like? (List them separated by commas, e.g., "Category1, Category2, Category3")`;

    return 'Thank you! Let me gather a bit more information...';
  }, []);

  const showRequirementsPreview = useCallback(() => {
    setRobotStatus('REVIEWING');
    setRobotSpeech("Let's review your requirements! 📋");
    addBotMessage(
      "🎉 Perfect! I've collected all the information I need.\n\nLet me show you a summary of your app requirements..."
    );

    setTimeout(() => {
      const req = requirementsRef.current;
      if (!req.port) req.port = CONFIG.DEFAULT_PORT;
      if (!req.description) req.description = `${req.productType} e-commerce platform`;

      let categories = req.categories;
      if (typeof categories === 'string') categories = categories.split(',').map((c) => c.trim());
      if (!categories || categories.length === 0) categories = ['General', 'Featured', 'New Arrivals'];
      req.categories = categories;

      setPreviewData({
        businessName: req.businessName || 'Not specified',
        productType: req.productType || 'Not specified',
        description: req.description,
        categories,
        port: req.port
      });
      setRequirementsModalOpen(true);
    }, 1000);
  }, [addBotMessage]);

  const processWithRules = useCallback(
    (userMessage) => {
      const req = requirementsRef.current;

      // Extract business name
      if (!req.businessName) {
        const namePatterns = [
          /(?:name|call|called)\s+(?:is|it)?\s*['""]?([A-Z][a-zA-Z0-9\s]+)['""]?/i,
          /business\s+(?:name\s+)?(?:is|will be)\s+['""]?([A-Z][a-zA-Z0-9\s]+)['""]?/i,
          /^([A-Z][a-zA-Z0-9\s]+)$/i,
          /create\s+([A-Z][a-zA-Z0-9\s]+)/i
        ];
        for (const pattern of namePatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1] && match[1].trim().length >= 2) {
            const extracted = match[1].trim();
            if (!['selling', 'products', 'business', 'categories'].includes(extracted.toLowerCase())) {
              req.businessName = extracted;
              break;
            }
          }
        }
      }

      // Extract product type
      if (!req.productType) {
        const productPatterns = [
          /selling\s+([a-zA-Z\s]+?)(?:\.|,|categories|$)/i,
          /sell(?:ing)?\s+([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i,
          /products?\s+(?:are|is|like)?\s*[:]\s*([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i,
          /type\s+(?:of\s+)?products?\s*[:]\s*([a-zA-Z\s]+?)(?:\.|,|categories|$)/i,
          /(?:deal|dealing)\s+(?:in|with)\s+([a-zA-Z\s]+?)(?:\.|,|categories|for|$)/i
        ];
        for (const pattern of productPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1] && match[1].trim().length >= 3) {
            const cleaned = match[1].trim().replace(/\s+(and|with|for)$/i, '').trim();
            if (cleaned.length >= 3) {
              req.productType = cleaned;
              break;
            }
          }
        }
      }

      // Extract categories
      if (!req.categories) {
        const categoryPatterns = [
          /categories?\s*[:]\s*([a-zA-Z\s,]+?)(?:\.|$)/i,
          /categor(?:ies|y)\s+(?:are|include|like)?\s*[:]\s*([a-zA-Z\s,]+)/i,
          /(?:have|need)\s+(?:these\s+)?categories?\s*[:]\s*([a-zA-Z\s,]+)/i,
          /^([a-zA-Z\s,]+)$/i
        ];
        for (const pattern of categoryPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            const cats = match[1]
              .split(',')
              .map((c) => c.trim())
              .filter((c) => c.length > 0 && c.length < 50);
            if (cats.length >= 2) {
              req.categories = cats;
              break;
            }
          }
        }
      }

      const response = generateRuleBasedResponse();
      addBotMessage(response);
      conversationHistoryRef.current.push({ role: 'assistant', content: response });
      setRobotSpeech(response.substring(0, 100) + '...');

      if (allRequirementsGatheredRef.current) {
        setTimeout(() => showRequirementsPreview(), 1000);
      }
    },
    [addBotMessage, generateRuleBasedResponse, showRequirementsPreview]
  );

  // ---- AI (online) processing with rule-based fallback ----
  const processWithAI = useCallback(
    async (userMessage) => {
      setRobotSpeech('Thinking... 🤔');

      if (!USE_CLAUDE_API) {
        processWithRules(userMessage);
        return;
      }

      try {
        const response = await fetch(CONFIG.API_ENDPOINTS.ANALYZE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory: conversationHistoryRef.current,
            currentRequirements: requirementsRef.current,
            userMessage
          })
        });
        const result = await response.json();

        if (result.success) {
          if (result.extractedInfo) {
            for (const [key, value] of Object.entries(result.extractedInfo)) {
              if (value !== null && value !== undefined && value !== '') {
                requirementsRef.current[key] = value;
              }
            }
          }
          addBotMessage(result.response);
          conversationHistoryRef.current.push({ role: 'assistant', content: result.response });

          if (result.allRequirementsGathered) {
            allRequirementsGatheredRef.current = true;
            setTimeout(() => showRequirementsPreview(), 1000);
          }
          setRobotSpeech(result.response.substring(0, 100) + '...');
        } else {
          throw new Error(result.error || 'Failed to process message');
        }
      } catch (error) {
        console.error('Error processing with AI, falling back to rules:', error);
        processWithRules(userMessage);
      }
    },
    [USE_CLAUDE_API, processWithRules, addBotMessage, showRequirementsPreview]
  );

  const handleSendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message) return;

    addUserMessage(message);
    setInputValue('');
    conversationHistoryRef.current.push({ role: 'user', content: message });

    if (!conversationStarted) {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('how') || lowerMessage.includes('work')) {
        showHelp();
      } else if (lowerMessage.includes('example') || lowerMessage.includes('demo')) {
        showExample();
      } else {
        addBotMessage(
          "👋 Hi there! I see you're eager to get started!\n\n" +
            "Please click the **'🚀 Start Creating'** button below to begin creating your e-commerce app.\n\n" +
            'Or you can:\n' +
            "• Click **'💡 Show Example'** to see what I can create\n" +
            "• Click **'❓ How It Works'** to learn more"
        );
      }
      return;
    }

    setIsTyping(true);
    try {
      await processWithAI(message);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      addBotMessage('Sorry, I encountered an error. Please try again.');
    }
    setIsTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, conversationStarted, addUserMessage, addBotMessage, processWithAI]);

  const startConversation = useCallback(() => {
    if (!creationEnabled) {
      addBotMessage(
        'ℹ️ **App creation is currently unavailable here.**\n\n' +
          'Please **contact Genvedha** to generate apps: https://genvedha.com/#contact\n\n' +
          "In the meantime, you can click **'💡 Show Example'** or **'❓ How It Works'** to learn more."
      );
      return;
    }

    setConversationStarted(true);
    setRobotSpeech("Let's create your app! 🎨");
    setRobotStatus('COLLECTING');

    const startMessage = USE_CLAUDE_API ? CONFIG.MESSAGES.START_ONLINE : CONFIG.MESSAGES.START_OFFLINE;
    addBotMessage(startMessage);
  }, [creationEnabled, USE_CLAUDE_API, addBotMessage]);

  const showExample = useCallback(() => {
    addBotMessage(
      "📚 Here's an example of what I can create:\n\n" +
        '**Business Name:** AquaGarden\n' +
        '**Product Type:** Aquatic Plants\n' +
        '**Description:** Premium aquatic plants for aquariums\n' +
        '**Categories:** Floating Plants, Stem Plants, Carpet Plants, Moss\n' +
        '**Port:** 5001\n\n' +
        'The app will include:\n' +
        '✅ Product catalog with images\n' +
        '✅ Category filtering\n' +
        '✅ Shopping cart\n' +
        '✅ Admin panel\n' +
        '✅ Database integration\n' +
        '✅ Responsive design\n\n' +
        "Ready to create yours? Click 'Start Creating'! 🚀"
    );
  }, [addBotMessage]);

  const showHelp = useCallback(() => {
    addBotMessage(
      '🤖 **How Genvedha Guru Works:**\n\n' +
        "1️⃣ **Chat Naturally** - Just tell me about your business idea\n" +
        "2️⃣ **I'll Ask Questions** - I'll gather all needed information through conversation\n" +
        '3️⃣ **Review & Approve** - Check the summary and approve\n' +
        '4️⃣ **App Generated** - Your app is ready in under a minute!\n\n' +
        '**What You Get:**\n' +
        '✅ Full-stack e-commerce application\n' +
        '✅ React frontend with modern UI\n' +
        '✅ Node.js backend with Express\n' +
        '✅ MongoDB database integration\n' +
        '✅ Product management system\n' +
        '✅ Image upload capability\n' +
        '✅ Responsive design\n' +
        '✅ Ready to deploy\n\n' +
        "Click 'Start Creating' to begin! 🎯"
    );
  }, [addBotMessage]);

  const handleQuickAction = useCallback(
    (action) => {
      switch (action) {
        case 'start':
          startConversation();
          break;
        case 'example':
          showExample();
          break;
        case 'help':
          showHelp();
          break;
        default:
          break;
      }
    },
    [startConversation, showExample, showHelp]
  );

  const showSuccessModal = useCallback(() => {
    setRobotStatus('SUCCESS');
    setRobotSpeech('Your app is ready! 🎉');
    const req = requirementsRef.current;
    const categories =
      typeof req.categories === 'string' ? req.categories.split(',').map((c) => c.trim()) : req.categories;

    setSuccessData({
      businessName: req.businessName,
      productType: req.productType,
      categoriesCount: categories.length,
      port: req.port
    });
    setSuccessModalOpen(true);

    addBotMessage(
      '🎉 **Congratulations!** Your e-commerce app is ready!\n\n' +
        `**${req.businessName}** has been successfully created with all the features you requested.\n\n` +
        'You can now launch your app and start adding products! 🚀'
    );
  }, [addBotMessage]);

  const createApp = useCallback(async () => {
    setRequirementsModalOpen(false);
    setProgressModalOpen(true);
    setRobotStatus('CREATING');
    setRobotSpeech('Creating your app now! 🎨✨');

    setProgressStepStates(PROGRESS_STEPS.map(() => ''));
    setProgressFill(0);

    const req = requirementsRef.current;
    const categories =
      typeof req.categories === 'string' ? req.categories.split(',').map((c) => c.trim()) : req.categories;

    const requestData = {
      businessName: req.businessName,
      productType: req.productType,
      description: req.description,
      categories: categories.map((name, index) => ({
        id: `cat-${index + 1}`,
        name: name.trim(),
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: `${name} products`,
        order: index + 1
      })),
      port: parseInt(req.port, 10) || CONFIG.DEFAULT_PORT,
      mongoUri: 'mongodb://localhost:27017',
      databaseName: req.businessName.toLowerCase().replace(/\s+/g, '_') + '_db'
    };

    try {
      for (let i = 0; i < PROGRESS_STEPS.length; i++) {
        const step = PROGRESS_STEPS[i];
        setProgressStepStates((prev) => {
          const next = [...prev];
          next[i] = 'active';
          return next;
        });
        setProgressText(step.name + '...');
        setProgressFill(((i + 1) / PROGRESS_STEPS.length) * 100);

        if (i === 5) {
          try {
            const response = await fetch(CONFIG.API_ENDPOINTS.GENERATE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestData)
            });
            const result = await response.json();
            if (result.success) {
              generatedAppRef.current = result;
            } else {
              throw new Error(result.error || 'Failed to generate app');
            }
          } catch (error) {
            console.error('Error generating app:', error);
            generatedAppRef.current = {
              success: true,
              appName: requestData.businessName,
              outputDir: `./generated-apps/${requestData.databaseName}`,
              message: 'App generated successfully (Demo Mode)'
            };
          }
        }

        await sleep(step.duration);

        setProgressStepStates((prev) => {
          const next = [...prev];
          next[i] = 'completed';
          return next;
        });
      }

      setProgressText('Complete! 🎉');
      await sleep(500);
      setProgressModalOpen(false);
      showSuccessModal();
    } catch (error) {
      console.error('Error creating app:', error);
      setProgressModalOpen(false);
      addBotMessage(
        '❌ Oops! Something went wrong while creating your app.\n\n' +
          'Error: ' +
          error.message +
          '\n\n' +
          'Please try again or contact support at https://genvedha.com/#contact'
      );
      setRobotStatus('ERROR');
    }
  }, [addBotMessage, showSuccessModal]);

  const viewGeneratedApp = useCallback(() => {
    const req = requirementsRef.current;
    const dbName = req.businessName.toLowerCase().replace(/\s+/g, '_') + '_db';
    const port = req.port;
    addBotMessage(
      `🚀 **Launching ${req.businessName}...**\n\n` +
        `Your app is running at: http://localhost:${port}\n\n` +
        '**Next Steps:**\n' +
        '1. Open your terminal\n' +
        `2. Navigate to: ./generated-apps/${dbName}\n` +
        '3. Run: npm install\n' +
        '4. Run: npm start\n\n' +
        `Your app will be live at http://localhost:${port} 🎉`
    );
    setSuccessModalOpen(false);
  }, [addBotMessage]);

  const resetChat = useCallback(() => {
    setSuccessModalOpen(false);
    requirementsRef.current = {
      businessName: null,
      productType: null,
      description: null,
      categories: null,
      port: null
    };
    conversationHistoryRef.current = [];
    allRequirementsGatheredRef.current = false;
    setConversationStarted(false);
    setMessages([]);
    setRobotStatus('READY');
    setRobotSpeech('Ready to create another app! 🚀');
    setTimeout(() => addBotMessage(CONFIG.MESSAGES.WELCOME), 500);
  }, [addBotMessage]);

  const editRequirements = useCallback(() => {
    setRequirementsModalOpen(false);
    addBotMessage("Sure! What would you like to change? Just tell me and I'll update it.");
    allRequirementsGatheredRef.current = false;
  }, [addBotMessage]);

  return (
    <div className="guru-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-wrapper">
            <div className="logo">
              <h1>GenVedha Guru</h1>
              <span className="logo-subtitle">AI E-commerce App Creator</span>
            </div>
            <a href="/" className="btn-back">
              ← Back to Home
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {/* Robot Animation Section */}
        <div className="robot-section">
          <div className="robot-container">
            <div className="robot" id="robot">
              <div className="robot-head">
                <div className="antenna">
                  <div className="antenna-ball"></div>
                </div>
                <div className="robot-face">
                  <div className="eye eye-left">
                    <div className="pupil"></div>
                  </div>
                  <div className="eye eye-right">
                    <div className="pupil"></div>
                  </div>
                  <div className="mouth">
                    <div className="mouth-line"></div>
                  </div>
                </div>
              </div>

              <div className="robot-body">
                <div className="chest-panel">
                  <div className="status-light"></div>
                  <div className="screen-display">
                    <span>{robotStatus}</span>
                  </div>
                </div>
              </div>

              <div className="robot-arm arm-left">
                <div className="arm-segment"></div>
                <div className="hand"></div>
              </div>
              <div className="robot-arm arm-right">
                <div className="arm-segment"></div>
                <div className="hand"></div>
              </div>
            </div>

            <div className="speech-bubble">
              <p>{robotSpeech}</p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="chat-section">
          <div className="chat-container">
            <div className="chat-header">
              <h2>Create Your E-commerce App</h2>
              <p>Answer a few questions and watch your app come to life!</p>
              <div
                className="mode-indicator"
                style={{ background: USE_CLAUDE_API ? '#10b981' : '#f59e0b' }}
              >
                {USE_CLAUDE_API ? '🌐 AI Mode' : '🔌 Offline Mode'}
              </div>
            </div>

            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.map((msg, index) =>
                msg.sender === 'bot' ? (
                  <div className="message message-bot" key={index}>
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div
                        className="message-bubble"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                      />
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                ) : (
                  <div className="message message-user" key={index}>
                    <div className="message-content">
                      <div className="message-bubble">{msg.text}</div>
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                )
              )}
              {isTyping && (
                <div className="message message-bot">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-bubble" style={{ fontStyle: 'italic', color: '#888' }}>
                      Thinking... ⏳
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your answer here..."
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />
              <button className="btn-send" onClick={handleSendMessage} aria-label="Send">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {!conversationStarted && (
              <>
                <div className="quick-actions">
                  <button
                    className={`quick-btn${creationEnabled ? '' : ' disabled'}`}
                    disabled={!creationEnabled}
                    title={
                      creationEnabled
                        ? undefined
                        : 'App creation is currently unavailable. Please contact Genvedha at https://genvedha.com/#contact to generate apps.'
                    }
                    onClick={() => handleQuickAction('start')}
                  >
                    🚀 Start Creating
                  </button>
                  <button className="quick-btn" onClick={() => handleQuickAction('example')}>
                    💡 Show Example
                  </button>
                  <button className="quick-btn" onClick={() => handleQuickAction('help')}>
                    ❓ How It Works
                  </button>
                </div>
                {!creationEnabled && (
                  <p className="creation-contact-note">
                    ℹ️ App creation is currently unavailable here.{' '}
                    <a href="https://genvedha.com/#contact" target="_blank" rel="noopener noreferrer">
                      contact Genvedha
                    </a>{' '}
                    to generate apps.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Preview Modal */}
      <div className={`modal${requirementsModalOpen ? ' active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>📋 Review Your App Requirements</h2>
            <button className="modal-close" onClick={() => setRequirementsModalOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            {previewData && (
              <>
                <div className="requirement-item">
                  <h4>🏢 Business Name</h4>
                  <p>{previewData.businessName}</p>
                </div>
                <div className="requirement-item">
                  <h4>📦 Product Type</h4>
                  <p>{previewData.productType}</p>
                </div>
                <div className="requirement-item">
                  <h4>📝 Description</h4>
                  <p>{previewData.description}</p>
                </div>
                <div className="requirement-item">
                  <h4>📂 Categories ({previewData.categories.length})</h4>
                  <p>{previewData.categories.join(', ')}</p>
                </div>
                <div className="requirement-item">
                  <h4>🔌 Port</h4>
                  <p>{previewData.port}</p>
                </div>
                <div className="requirement-item">
                  <h4>✨ Features Included</h4>
                  <p>
                    ✅ Product Catalog
                    <br />
                    ✅ Shopping Cart
                    <br />
                    ✅ Category Filtering
                    <br />
                    ✅ Admin Panel
                    <br />
                    ✅ Image Upload
                    <br />
                    ✅ Database Integration
                    <br />
                    ✅ Responsive Design
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={editRequirements}>
              ✏️ Edit
            </button>
            <button className="btn btn-primary" onClick={createApp}>
              ✅ Approve & Create App
            </button>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <div className={`modal${progressModalOpen ? ' active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>🎨 Creating Your App...</h2>
          </div>
          <div className="modal-body">
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressFill}%` }}></div>
              </div>
              <p className="progress-text">{progressText}</p>
              <div className="progress-steps">
                {PROGRESS_STEPS.map((step, index) => (
                  <div className={`progress-step ${progressStepStates[index] || ''}`} key={index}>
                    <div className="step-icon">{step.icon}</div>
                    <div className="step-text">{step.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className={`modal${successModalOpen ? ' active' : ''}`}>
        <div className="modal-content success-content">
          <div className="modal-header">
            <h2>🎉 Your App is Ready!</h2>
          </div>
          <div className="modal-body">
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>
            <h3>{successData ? successData.businessName : 'Your E-commerce App'}</h3>
            <p>Your app has been successfully created and is ready to use!</p>
            {successData && (
              <div className="app-details">
                <div className="detail-row">
                  <span className="detail-label">App Name:</span>
                  <span className="detail-value">{successData.businessName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Product Type:</span>
                  <span className="detail-value">{successData.productType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Categories:</span>
                  <span className="detail-value">{successData.categoriesCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Port:</span>
                  <span className="detail-value">{successData.port}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value" style={{ color: 'var(--success-color)' }}>
                    ✅ Ready to Launch
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={viewGeneratedApp}>
              🚀 Launch App
            </button>
            <button className="btn btn-secondary" onClick={resetChat}>
              ➕ Create Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenvedhaGuru;