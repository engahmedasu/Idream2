# AI Agent Setup Guide

## Overview

The AI Agent is integrated into the frontend portal to help users search for products, shops, and answer questions about the platform. The system uses configurable prompts and can retrieve real-time data from the database.

## Architecture

### Backend Components

1. **AI Controller** (`backend/controllers/aiController.js`)
   - Handles chat requests
   - Searches products and shops from database
   - Processes user queries and generates responses

2. **AI Configuration** (`backend/config/ai.js`)
   - System prompts (English and Arabic)
   - Search prompts for products and shops
   - Language-specific configurations

3. **AI Routes** (`backend/routes/ai.js`)
   - `/api/ai/chat` - Main chat endpoint
   - `/api/ai/prompt` - Get/Update system prompts

### Frontend Components

1. **AIAgent Component** (`frontend-portal/src/components/AIAgent.js`)
   - Chat interface
   - Sends messages to backend API
   - Displays AI responses

## Configuration

### 1. System Prompt Configuration

Edit `backend/config/ai.js` to customize the AI agent's behavior:

```javascript
const getSystemPrompt = (language = 'en') => {
  const prompts = {
    en: `Your custom system prompt here...`,
    ar: `النص الخاص بك هنا...`
  };
  return prompts[language] || prompts.en;
};
```

### 2. Product Search Configuration

The AI agent automatically searches products when users ask about:
- Products, items, buying, prices
- Keywords: "product", "item", "buy", "price", "purchase", "shop"

### 3. Shop Search Configuration

The AI agent searches shops when users ask about:
- Shops, stores, vendors, sellers
- Keywords: "shop", "store", "vendor", "seller", "merchant"

## How It Works

### 1. User Sends Message

User types a message in the AI chat interface.

### 2. Frontend Sends Request

```javascript
POST /api/ai/chat
{
  "message": "I'm looking for laptops",
  "language": "en",
  "conversationHistory": [...]
}
```

### 3. Backend Processing

1. **Query Analysis**: Detects if query is about products or shops
2. **Database Search**: 
   - Searches `Product` collection for product queries
   - Searches `Shop` collection for shop queries
3. **Response Generation**: Formats results into natural language

### 4. Response Format

```json
{
  "response": "I found 5 products related to your search...",
  "searchResults": [
    {
      "type": "products",
      "data": [
        {
          "id": "...",
          "name": "Product Name",
          "price": 100,
          "shop": { "name": "Shop Name" },
          "category": "Category Name"
        }
      ]
    }
  ],
  "timestamp": "2025-01-XX..."
}
```

## Database Access

### Product Search

The AI agent can search products by:
- Product name
- Description
- Product type
- Category (via populated shop/category)

**Query Example:**
```javascript
Product.find({
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { description: { $regex: query, $options: 'i' } },
    { productType: { $regex: query, $options: 'i' } }
  ],
  isActive: true
})
.populate('shop', 'name image category')
.populate('category', 'name')
```

### Shop Search

The AI agent can search shops by:
- Shop name
- Email
- Category

**Query Example:**
```javascript
Shop.find({
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } }
  ],
  isActive: true
})
.populate('category', 'name')
```

## Integrating with External AI Services

To integrate with OpenAI, Anthropic, or other AI services:

### Option 1: OpenAI Integration

1. Install OpenAI package:
```bash
cd backend
npm install openai
```

2. Update `backend/controllers/aiController.js`:

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.chat = async (req, res) => {
  // ... existing code ...
  
  // Replace the response generation with:
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: fullPrompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const aiResponse = completion.choices[0].message.content;
  
  res.json({
    response: aiResponse,
    searchResults: searchResults,
    timestamp: new Date()
  });
};
```

3. Add to `.env`:
```
OPENAI_API_KEY=your_api_key_here
```

### Option 2: Custom AI Service

Replace the response generation in `aiController.js` with your custom AI service API call.

## Customization

### Adding More Search Capabilities

1. **Add new search function** in `aiController.js`:
```javascript
const searchCategories = async (query, language = 'en') => {
  // Your search logic
};
```

2. **Update query detection**:
```javascript
const categoryKeywords = ['category', 'type', 'kind'];
const isCategoryQuery = categoryKeywords.some(keyword => userMessage.includes(keyword));
```

3. **Add to response**:
```javascript
if (isCategoryQuery) {
  const categories = await searchCategories(userMessage, language);
  // Add to context and response
}
```

### Modifying Response Format

Edit the response generation in `aiController.js` to customize how results are presented to users.

## Testing

### Test Product Search
```
User: "Show me laptops"
Expected: Returns products matching "laptop" in name/description
```

### Test Shop Search
```
User: "Find electronics shops"
Expected: Returns shops matching "electronics" or related categories
```

### Test General Query
```
User: "What can you help me with?"
Expected: Returns general help message
```

## Environment Variables

Add to `.env` if using external AI service:
```
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here
```

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Input Validation**: All user inputs are sanitized
3. **API Keys**: Store AI service API keys securely in environment variables
4. **Access Control**: AI endpoints are public, but you can add authentication if needed

## Troubleshooting

### AI not finding products
- Check if products have `isActive: true`
- Verify product names/descriptions contain searchable text
- Check database connection

### Responses not in correct language
- Verify `language` parameter is sent correctly
- Check `i18n.language` in frontend
- Ensure prompts exist for the language

### Slow responses
- Optimize database queries with indexes
- Consider caching frequently searched items
- Use pagination for large result sets

