# AI Agent Prompt Configuration Guide

## Where to Configure Prompts

### Main Configuration File
**Location**: `backend/config/ai.js`

This file contains all system prompts and search prompts for the AI agent.

### Key Functions

1. **`getSystemPrompt(language)`** - Main system prompt that defines the AI's role and behavior
2. **`getProductSearchPrompt(language)`** - Instructions for product searches
3. **`getShopSearchPrompt(language)`** - Instructions for shop searches

## How to Customize Prompts

### 1. Edit System Prompt

Open `backend/config/ai.js` and modify the `getSystemPrompt` function:

```javascript
const getSystemPrompt = (language = 'en') => {
  const prompts = {
    en: `You are a helpful AI assistant for iDream...
         [Your custom instructions here]`,
    ar: `أنت مساعد ذكي مفيد...
         [تعليماتك المخصصة هنا]`
  };
  return prompts[language] || prompts.en;
};
```

### 2. What to Include in System Prompt

- **Role Definition**: What the AI is (e.g., "You are a helpful e-commerce assistant")
- **Capabilities**: What the AI can do (search products, find shops, answer questions)
- **Guidelines**: How to behave (friendly, accurate, concise)
- **Response Format**: How to structure responses
- **Limitations**: What the AI cannot do

### 3. Example Custom Prompt

```javascript
en: `You are an expert shopping assistant for iDream marketplace.

Your primary goals:
1. Help users find the best products at competitive prices
2. Recommend shops based on user needs
3. Provide accurate product information
4. Answer questions about shipping, returns, and policies

Guidelines:
- Always prioritize user satisfaction
- Be honest about product availability
- Suggest alternatives when products are out of stock
- Include prices and shop names in recommendations
- Use friendly, conversational tone

When searching:
- Use the provided search functions to get real-time data
- Present results in a clear, organized manner
- Highlight key features (price, rating, shop reputation)`
```

## Database Access

### How AI Retrieves Products

The AI agent uses the `searchProducts()` function in `aiController.js`:

```javascript
// Searches by:
- Product name (case-insensitive)
- Product description
- Product type

// Returns:
- Product details (name, price, image)
- Shop information (name, image, category)
- Category information
- Ratings and reviews count
```

### How AI Retrieves Shops

The AI agent uses the `searchShops()` function in `aiController.js`:

```javascript
// Searches by:
- Shop name (case-insensitive)
- Shop email

// Returns:
- Shop details (name, contact info)
- Category
- Address and website
- Share link
```

## Query Detection

The AI automatically detects what users are asking about:

### Product Queries
Keywords: `product`, `item`, `buy`, `price`, `purchase`, `shop`, `shopping`

### Shop Queries
Keywords: `shop`, `store`, `vendor`, `seller`, `merchant`

### Custom Keywords

Add more keywords in `aiController.js`:

```javascript
const productKeywords = [
  'product', 'item', 'buy', 'price', 
  'purchase', 'shop', 'shopping',
  'laptop', 'phone', 'electronics' // Add your keywords
];
```

## Response Format

The AI returns structured responses:

```javascript
{
  response: "Natural language response to user",
  searchResults: [
    {
      type: "products" | "shops",
      data: [...] // Array of products or shops
    }
  ],
  timestamp: Date
}
```

## Integration with External AI Services

### Current Implementation

The current implementation uses a simple rule-based system. To integrate with OpenAI, Anthropic, or other services:

1. **Install AI Service Package**
```bash
npm install openai  # or anthropic, etc.
```

2. **Update `aiController.js`**

Replace the response generation section with:

```javascript
// Import AI service
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In chat function:
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: `${context}\n\nUser: ${message}` }
  ]
});

const aiResponse = completion.choices[0].message.content;
```

3. **Add Environment Variable**
```env
OPENAI_API_KEY=sk-your-key-here
```

## Testing Your Prompts

1. **Test via API**:
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me laptops",
    "language": "en"
  }'
```

2. **Test in Frontend**:
- Open the AI chat widget
- Type test queries
- Check responses match your prompt guidelines

## Best Practices

1. **Be Specific**: Clearly define the AI's role and limitations
2. **Include Examples**: Add example responses in the prompt
3. **Language Support**: Always provide both English and Arabic prompts
4. **Update Regularly**: Refine prompts based on user interactions
5. **Test Thoroughly**: Test with various query types

## Advanced: Dynamic Prompt Updates

To allow admins to update prompts via API (future enhancement):

1. Create a `Prompt` model to store prompts in database
2. Update `getSystemPrompt` to fetch from database
3. Add admin endpoint to update prompts
4. Cache prompts for performance

## Support

For questions or issues:
1. Check `backend/docs/AI_AGENT_SETUP.md` for detailed setup
2. Review `backend/controllers/aiController.js` for implementation details
3. Test API endpoints using Swagger docs at `/api-docs`

