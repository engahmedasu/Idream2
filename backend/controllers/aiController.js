const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const config = require('../config/app');
const { getSystemPrompt, getProductSearchPrompt, getShopSearchPrompt } = require('../config/ai');

// Initialize OpenAI client if configured
let openaiClient = null;
if (config.ai.provider === 'openai' && config.ai.openai.apiKey) {
  try {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({
      apiKey: config.ai.openai.apiKey
    });
    console.log('✅ OpenAI client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
  }
}

// Search products for AI agent
const searchProducts = async (query, language = 'en', limit = null) => {
  const maxProducts = limit || config.ai.search.maxProducts;
  try {
    const searchRegex = { $regex: query, $options: 'i' };
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { productType: searchRegex }
      ],
      isActive: true
    })
      .populate('shop', 'name image category')
      .populate('category', 'name')
      .limit(maxProducts)
      .sort({ priority: -1, createdAt: -1 });

    return products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      shop: product.shop ? {
        name: product.shop.name,
        image: product.shop.image,
        category: product.shop.category?.name || product.category?.name
      } : null,
      category: product.category?.name || null,
      isHotOffer: product.isHotOffer,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Search shops for AI agent
const searchShops = async (query, language = 'en', limit = null) => {
  const maxShops = limit || config.ai.search.maxShops;
  try {
    const searchRegex = { $regex: query, $options: 'i' };
    const shops = await Shop.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      isActive: true
    })
      .populate('category', 'name')
      .limit(maxShops)
      .sort({ priority: -1, createdAt: -1 });

    return shops.map(shop => ({
      id: shop._id,
      name: shop.name,
      email: shop.email,
      mobile: shop.mobile,
      whatsapp: shop.whatsapp,
      image: shop.image,
      category: shop.category?.name || null,
      address: shop.address,
      website: shop.website,
      shareLink: shop.shareLink
    }));
  } catch (error) {
    console.error('Error searching shops:', error);
    return [];
  }
};

// Get categories for context
const getCategories = async () => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description')
      .sort({ order: 1 });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Get AI response using OpenAI
const getOpenAIResponse = async (systemPrompt, userMessage, context, conversationHistory = [], language = 'en') => {
  if (!openaiClient) {
    return null;
  }

  try {
    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 5 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-5).forEach(msg => {
        if (msg.type === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.type === 'bot') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      });
    }

    // Add context if available
    if (context) {
      messages.push({
        role: 'system',
        content: `Context from database:\n${context}`
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Try with configured model first
    let model = config.ai.openai.model;
    let completion;
    
    try {
      completion = await openaiClient.chat.completions.create({
        model: model,
        messages: messages,
        temperature: config.ai.openai.temperature,
        max_tokens: config.ai.openai.maxTokens,
      });
    } catch (modelError) {
      // If model not found (404), try fallback to gpt-3.5-turbo
      if (modelError.status === 404 && model !== 'gpt-3.5-turbo') {
        console.warn(`⚠️  Model "${model}" not available, falling back to gpt-3.5-turbo`);
        model = 'gpt-3.5-turbo';
        completion = await openaiClient.chat.completions.create({
          model: model,
          messages: messages,
          temperature: config.ai.openai.temperature,
          max_tokens: config.ai.openai.maxTokens,
        });
      } else {
        throw modelError; // Re-throw if it's a different error
      }
    }

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    if (error.status === 404) {
      console.error(`❌ Model "${config.ai.openai.model}" not found. Please check your .env file and use a valid model like "gpt-3.5-turbo"`);
    }
    // Return null to fallback to rule-based response
    return null;
  }
};

// Generate rule-based response (fallback)
const generateRuleBasedResponse = (searchResults, language, userMessage = '', categories = []) => {
  let aiResponse = '';

  if (searchResults.length > 0) {
    if (searchResults[0].type === 'products' && searchResults[0].data.length > 0) {
      const products = searchResults[0].data;
      if (language === 'ar') {
        aiResponse = `وجدت ${products.length} منتج(ات) متعلق(ة) ببحثك:\n\n`;
        products.forEach((product, index) => {
          aiResponse += `${index + 1}. ${product.name} - ${product.price} جنيه\n`;
          if (product.shop) aiResponse += `   من متجر: ${product.shop.name}\n`;
          if (product.category) aiResponse += `   الفئة: ${product.category}\n`;
          if (product.isHotOffer) aiResponse += `   🔥 عرض ساخن\n`;
          if (product.averageRating > 0) aiResponse += `   ⭐ ${product.averageRating} نجوم (${product.totalReviews} مراجعة)\n`;
          aiResponse += '\n';
        });
      } else {
        aiResponse = `I found ${products.length} product(s) related to your search:\n\n`;
        products.forEach((product, index) => {
          aiResponse += `${index + 1}. ${product.name} - ${product.price} EGP\n`;
          if (product.shop) aiResponse += `   From shop: ${product.shop.name}\n`;
          if (product.category) aiResponse += `   Category: ${product.category}\n`;
          if (product.isHotOffer) aiResponse += `   🔥 Hot Offer\n`;
          if (product.averageRating > 0) aiResponse += `   ⭐ ${product.averageRating} stars (${product.totalReviews} reviews)\n`;
          aiResponse += '\n';
        });
      }
    } else if (searchResults[0].type === 'shops' && searchResults[0].data.length > 0) {
      const shops = searchResults[0].data;
      if (language === 'ar') {
        aiResponse = `وجدت ${shops.length} متجر(ات) متعلق(ة) ببحثك:\n\n`;
        shops.forEach((shop, index) => {
          aiResponse += `${index + 1}. ${shop.name}\n`;
          if (shop.category) aiResponse += `   الفئة: ${shop.category}\n`;
          if (shop.mobile) aiResponse += `   📞 الهاتف: ${shop.mobile}\n`;
          if (shop.whatsapp) aiResponse += `   💬 واتساب: ${shop.whatsapp}\n`;
          aiResponse += '\n';
        });
      } else {
        aiResponse = `I found ${shops.length} shop(s) related to your search:\n\n`;
        shops.forEach((shop, index) => {
          aiResponse += `${index + 1}. ${shop.name}\n`;
          if (shop.category) aiResponse += `   Category: ${shop.category}\n`;
          if (shop.mobile) aiResponse += `   📞 Phone: ${shop.mobile}\n`;
          if (shop.whatsapp) aiResponse += `   💬 WhatsApp: ${shop.whatsapp}\n`;
          aiResponse += '\n';
        });
      }
    }
  } else {
    // More helpful response when no results found
    if (language === 'ar') {
      aiResponse = `لم أجد نتائج مطابقة لبحثك "${userMessage}".\n\n`;
      if (categories.length > 0) {
        aiResponse += `يمكنك البحث في الفئات التالية: ${categories.slice(0, 5).map(c => c.name).join('، ')}.\n\n`;
      }
      aiResponse += 'جرب البحث بـ:\n';
      aiResponse += '- اسم المنتج أو نوعه (مثل: لابتوب، هاتف، ملابس)\n';
      aiResponse += '- نطاق السعر (مثل: أقل من 1000 جنيه)\n';
      aiResponse += '- اسم الفئة\n';
      aiResponse += '- اسم المتجر';
    } else {
      aiResponse = `I couldn't find results matching "${userMessage}".\n\n`;
      if (categories.length > 0) {
        aiResponse += `You can search in these categories: ${categories.slice(0, 5).map(c => c.name).join(', ')}.\n\n`;
      }
      aiResponse += 'Try searching by:\n';
      aiResponse += '- Product name or type (e.g., laptop, phone, clothing)\n';
      aiResponse += '- Price range (e.g., under 1000 EGP)\n';
      aiResponse += '- Category name\n';
      aiResponse += '- Shop name';
    }
  }

  return aiResponse;
};

// Main AI chat endpoint
exports.chat = async (req, res) => {
  try {
    const { message, language = 'en', conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const userMessage = message.trim().toLowerCase();
    const originalMessage = message.trim(); // Keep original for OpenAI
    const systemPrompt = getSystemPrompt(language);

    // Expanded keyword detection - more flexible matching
    const productKeywords = [
      'product', 'item', 'buy', 'price', 'purchase', 'shop', 'shopping', 
      'show me', 'find', 'search', 'looking for', 'need', 'want', 'get',
      'laptop', 'phone', 'mobile', 'computer', 'electronics', 'clothing', 
      'fashion', 'accessories', 'offer', 'deal', 'discount', 'cheap', 'best',
      'منتج', 'سلعة', 'شراء', 'سعر', 'ابحث', 'أريد', 'أحتاج', 'أعرض', 'عرض'
    ];
    const shopKeywords = [
      'shop', 'store', 'vendor', 'seller', 'merchant', 'retailer', 
      'where to buy', 'who sells', 'find shop', 'find store',
      'متجر', 'بائع', 'تاجر', 'محل', 'أين أشتري'
    ];
    
    // More flexible detection - check if message contains keywords OR looks like a search query
    const isProductQuery = productKeywords.some(keyword => userMessage.includes(keyword)) ||
                          userMessage.length > 3; // If message is longer than 3 chars, likely a search
    const isShopQuery = shopKeywords.some(keyword => userMessage.includes(keyword));

    let context = '';
    let searchResults = [];

    // Always try to search products (more flexible)
    if (config.ai.search.enableProductSearch) {
      const products = await searchProducts(originalMessage, language); // Use original message for better search
      if (products.length > 0) {
        searchResults.push({ type: 'products', data: products });
        context += `\n\nAvailable Products:\n${JSON.stringify(products, null, 2)}`;
      }
    }

    // Search shops if keywords detected or if product search found nothing
    if ((isShopQuery || searchResults.length === 0) && config.ai.search.enableShopSearch) {
      const shops = await searchShops(originalMessage, language);
      if (shops.length > 0) {
        searchResults.push({ type: 'shops', data: shops });
        context += `\n\nAvailable Shops:\n${JSON.stringify(shops, null, 2)}`;
      }
    }

    // Always get categories for context (helps AI provide better responses)
    const categories = await getCategories();
    if (categories.length > 0) {
      context += `\n\nAvailable Categories: ${categories.map(c => c.name).join(', ')}`;
    }

    // Build context string for AI
    let contextString = '';
    if (context) {
      contextString = context;
    }

    // Try to get response from OpenAI if configured
    let aiResponse = null;
    if (config.ai.provider === 'openai' && openaiClient) {
      aiResponse = await getOpenAIResponse(
        systemPrompt,
        originalMessage, // Use original message (not lowercased)
        contextString,
        conversationHistory,
        language
      );
    }

    // Fallback to rule-based response if OpenAI is not available or failed
    if (!aiResponse) {
      aiResponse = generateRuleBasedResponse(searchResults, language, originalMessage, categories);
    }

    res.json({
      response: aiResponse,
      searchResults: searchResults,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      message: language === 'ar' 
        ? 'حدث خطأ أثناء معالجة طلبك' 
        : 'An error occurred while processing your request',
      error: error.message 
    });
  }
};

// Get AI system prompt (for configuration)
exports.getSystemPrompt = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const prompt = getSystemPrompt(language);
    res.json({ prompt, language });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update system prompt (admin only)
exports.updateSystemPrompt = async (req, res) => {
  try {
    // This would typically save to database or config file
    // For now, we'll use the config file approach
    res.json({ 
      message: 'System prompt updated successfully',
      note: 'Update the prompt in backend/config/ai.js to change the system prompt'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

