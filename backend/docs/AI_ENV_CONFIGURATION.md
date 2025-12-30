# AI Agent Environment Variables Configuration

## Overview

All AI agent configuration can be managed through environment variables in your `.env` file. This allows you to configure the AI service, prompts, and behavior without modifying code.

## Environment Variables

Add these variables to your `.env`, `.env.dev`, or `.env.prod` file:

### AI Service Provider

```env
# Choose your AI provider: 'openai', 'anthropic', 'custom', or 'none'
# 'none' = rule-based responses (current default)
AI_PROVIDER=none
```

### OpenAI Configuration

```env
# OpenAI API Key (required if using OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI Model (default: gpt-4)
OPENAI_MODEL=gpt-4

# Temperature (0.0 to 2.0, default: 0.7)
# Lower = more focused, Higher = more creative
OPENAI_TEMPERATURE=0.7

# Maximum tokens in response (default: 500)
OPENAI_MAX_TOKENS=500
```

### Anthropic Configuration

```env
# Anthropic API Key (required if using Anthropic)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Anthropic Model (default: claude-3-opus-20240229)
ANTHROPIC_MODEL=claude-3-opus-20240229

# Maximum tokens in response (default: 500)
ANTHROPIC_MAX_TOKENS=500
```

### Custom AI Service Configuration

```env
# Custom AI Service API URL
CUSTOM_AI_API_URL=https://your-custom-ai-service.com/api

# Custom AI Service API Key
CUSTOM_AI_API_KEY=your-custom-api-key-here
```

### Search Configuration

```env
# Maximum number of products to return in search (default: 5)
AI_MAX_PRODUCTS=5

# Maximum number of shops to return in search (default: 5)
AI_MAX_SHOPS=5

# Enable/disable product search (default: true)
AI_ENABLE_PRODUCT_SEARCH=true

# Enable/disable shop search (default: true)
AI_ENABLE_SHOP_SEARCH=true
```

### Response Configuration

```env
# Include product/shop images in responses (default: false)
AI_INCLUDE_IMAGES=false

# Include links to products/shops in responses (default: true)
AI_INCLUDE_LINKS=true

# Maximum response length in characters (default: 1000)
AI_MAX_RESPONSE_LENGTH=1000
```

### Custom System Prompts

You can override the default system prompts by setting these variables:

```env
# Custom English system prompt (optional)
AI_SYSTEM_PROMPT_EN=You are a helpful AI assistant for iDream marketplace. Your custom instructions here...

# Custom Arabic system prompt (optional)
AI_SYSTEM_PROMPT_AR=أنت مساعد ذكي مفيد لمنصة iDream. تعليماتك المخصصة هنا...
```

**Note**: If you set custom prompts, they will completely replace the default prompts. Leave empty to use defaults.

## Example .env Configuration

### Basic Configuration (Rule-based, no external AI)

```env
AI_PROVIDER=none
AI_MAX_PRODUCTS=5
AI_MAX_SHOPS=5
AI_ENABLE_PRODUCT_SEARCH=true
AI_ENABLE_SHOP_SEARCH=true
```

### OpenAI Configuration

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=500
AI_MAX_PRODUCTS=5
AI_MAX_SHOPS=5
```

### Anthropic Configuration

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-opus-20240229
ANTHROPIC_MAX_TOKENS=500
AI_MAX_PRODUCTS=5
AI_MAX_SHOPS=5
```

## How It Works

1. **Configuration Loading**: The `backend/config/app.js` reads all AI-related environment variables
2. **Access in Code**: Use `config.ai` to access AI configuration:
   ```javascript
   const config = require('../config/app');
   const apiKey = config.ai.openai.apiKey;
   const maxProducts = config.ai.search.maxProducts;
   ```
3. **Prompt Override**: If `AI_SYSTEM_PROMPT_EN` or `AI_SYSTEM_PROMPT_AR` is set, it overrides the default prompts

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate API keys** regularly
4. **Use environment-specific files**: `.env.dev` for development, `.env.prod` for production

## Testing Configuration

After updating `.env`:

1. Restart your backend server
2. Test the AI chat endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "language": "en"}'
   ```
3. Check server logs for configuration loading messages

## Troubleshooting

### AI not responding
- Check if `AI_PROVIDER` is set correctly
- Verify API keys are valid (if using external AI)
- Check server logs for errors

### Custom prompts not working
- Ensure environment variable names are exact: `AI_SYSTEM_PROMPT_EN` or `AI_SYSTEM_PROMPT_AR`
- Restart server after changing prompts
- Check for typos in variable names

### Search not working
- Verify `AI_ENABLE_PRODUCT_SEARCH` and `AI_ENABLE_SHOP_SEARCH` are set to `true`
- Check database connection
- Verify products/shops have `isActive: true`

## Next Steps

1. Add your API keys to `.env` file
2. Set `AI_PROVIDER` to your chosen service
3. Customize search limits and response settings
4. Optionally set custom system prompts
5. Restart the backend server

For integration with external AI services, see `backend/docs/AI_AGENT_SETUP.md`.

