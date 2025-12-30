# OpenAI GPT Integration Setup Guide

## Overview

Your AI agent now supports OpenAI GPT for better, more natural responses! The system automatically uses GPT when configured, and falls back to rule-based responses if OpenAI is unavailable.

## Quick Setup

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-`)

### 2. Add to `.env` File

Add these lines to your `backend/.env` file:

```env
# Enable OpenAI
AI_PROVIDER=openai

# Your OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Customize model and settings
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=500
```

### 3. Restart Backend Server

```bash
cd backend
npm run dev
```

You should see: `✅ OpenAI client initialized`

## Configuration Options

### Model Selection

Choose the GPT model that fits your needs:

```env
# GPT-4 (Best quality, slower, more expensive)
OPENAI_MODEL=gpt-4

# GPT-4 Turbo (Good balance)
OPENAI_MODEL=gpt-4-turbo-preview

# GPT-3.5 Turbo (Faster, cheaper, good quality)
OPENAI_MODEL=gpt-3.5-turbo
```

### Temperature

Controls creativity (0.0 = focused, 2.0 = creative):

```env
# More focused, consistent responses
OPENAI_TEMPERATURE=0.3

# Balanced (default)
OPENAI_TEMPERATURE=0.7

# More creative, varied responses
OPENAI_TEMPERATURE=1.0
```

### Max Tokens

Maximum length of AI response:

```env
# Short responses (default)
OPENAI_MAX_TOKENS=500

# Medium responses
OPENAI_MAX_TOKENS=1000

# Long, detailed responses
OPENAI_MAX_TOKENS=2000
```

## How It Works

1. **Database Search**: The system first searches your database for products/shops
2. **Context Building**: Search results are formatted as context
3. **GPT Processing**: OpenAI GPT generates a natural language response using:
   - Your custom system prompt
   - Database search results
   - Conversation history
   - User's current question
4. **Fallback**: If OpenAI fails or isn't configured, it uses rule-based responses

## Features

✅ **Natural Language**: GPT provides conversational, human-like responses  
✅ **Context Aware**: Uses database search results in responses  
✅ **Bilingual**: Supports both English and Arabic  
✅ **Conversation History**: Remembers last 5 messages for context  
✅ **Automatic Fallback**: Works even if OpenAI is unavailable  

## Testing

### Test via API

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me laptops under 5000 EGP",
    "language": "en"
  }'
```

### Test in Frontend

1. Open your frontend portal
2. Click the AI chat widget (bottom right)
3. Ask questions like:
   - "Show me products under 1000 EGP"
   - "Find shops selling electronics"
   - "What categories do you have?"

## Cost Management

### Monitor Usage

- Check usage at: https://platform.openai.com/usage
- Set spending limits at: https://platform.openai.com/account/billing/limits

### Optimize Costs

1. **Use GPT-3.5 Turbo** for lower costs:
   ```env
   OPENAI_MODEL=gpt-3.5-turbo
   ```

2. **Reduce Max Tokens**:
   ```env
   OPENAI_MAX_TOKENS=300
   ```

3. **Disable for Development**:
   ```env
   AI_PROVIDER=none
   ```

## Troubleshooting

### "OpenAI client not initialized"

**Check:**
- `AI_PROVIDER=openai` is set in `.env`
- `OPENAI_API_KEY` is set and valid
- Restart server after adding keys

### "API Error: Invalid API Key"

**Solution:**
- Verify your API key at https://platform.openai.com/api-keys
- Make sure key starts with `sk-`
- Check for extra spaces in `.env` file

### "Rate limit exceeded"

**Solution:**
- You've hit OpenAI's rate limit
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan
- System will automatically fallback to rule-based responses

### Responses not using database results

**Check:**
- Products/shops exist in database with `isActive: true`
- Search keywords match product/shop names
- `AI_ENABLE_PRODUCT_SEARCH=true` and `AI_ENABLE_SHOP_SEARCH=true`

## Disable OpenAI

To go back to rule-based responses:

```env
AI_PROVIDER=none
```

Or simply remove/comment out the OpenAI configuration.

## Advanced: Custom Prompts

You can customize the AI's behavior by setting custom prompts in `.env`:

```env
AI_SYSTEM_PROMPT_EN=You are an expert shopping assistant for iDream. Your role is to help users find the best products and shops. Always mention prices, shop names, and be friendly.

AI_SYSTEM_PROMPT_AR=أنت مساعد تسوق خبير لمنصة iDream. دورك هو مساعدة المستخدمين في العثور على أفضل المنتجات والمتاجر. اذكر دائماً الأسعار وأسماء المتاجر وكن ودوداً.
```

## Support

- OpenAI Documentation: https://platform.openai.com/docs
- API Reference: https://platform.openai.com/docs/api-reference
- For issues: Check server logs and OpenAI dashboard

