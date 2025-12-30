# OpenAI Model Selection Guide

## Common Error: Model Not Found

If you see this error:
```
OpenAI API Error: 404 The model `gpt-4` does not exist or you do not have access to it.
```

It means you're trying to use a model that either:
- Doesn't exist
- Requires special access/permissions
- Is not available in your OpenAI account tier

## Available Models

### ✅ Recommended: `gpt-3.5-turbo` (Default)
- **Most accessible** - Available to all OpenAI users
- **Fast and cost-effective**
- **Good quality** for most use cases
- **No special access required**

### ✅ Alternative: `gpt-4-turbo-preview` or `gpt-4-turbo`
- **Better quality** than gpt-3.5-turbo
- **Requires GPT-4 access** (may need to request access)
- **More expensive** than gpt-3.5-turbo
- **Slower** response times

### ❌ Not Available by Default: `gpt-4`
- **Requires special access** - Must request from OpenAI
- **Most expensive**
- **Best quality** but not accessible to all users

## How to Fix

### Option 1: Use Default (gpt-3.5-turbo)
The default is now `gpt-3.5-turbo`. Just restart your server - no changes needed!

### Option 2: Specify Model in .env
Add to your `backend/.env` file:

```env
# Use gpt-3.5-turbo (recommended)
OPENAI_MODEL=gpt-3.5-turbo

# Or if you have GPT-4 access:
OPENAI_MODEL=gpt-4-turbo-preview
```

### Option 3: Check Your OpenAI Account
1. Go to https://platform.openai.com/models
2. Check which models you have access to
3. Use one of the available models

## Model Comparison

| Model | Access | Speed | Cost | Quality | Best For |
|-------|--------|-------|------|---------|----------|
| `gpt-3.5-turbo` | ✅ All users | Fast | Low | Good | Most use cases |
| `gpt-4-turbo` | ⚠️ Requires access | Medium | Medium | Excellent | Complex queries |
| `gpt-4` | ❌ Special access | Slow | High | Best | Advanced use cases |

## Current Configuration

The default model is now **`gpt-3.5-turbo`** which should work for most users.

To change it, add to `.env`:
```env
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4-turbo-preview if you have access
```

## Testing

After updating, test with:
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "language": "en"
  }'
```

If you still get errors, check:
1. Your OpenAI API key is valid
2. You have credits in your OpenAI account
3. The model name is correct (case-sensitive)

## Need GPT-4 Access?

If you want to use GPT-4:
1. Go to https://platform.openai.com/account/limits
2. Check if you have GPT-4 access
3. If not, you may need to:
   - Upgrade your account
   - Request access (may take time)
   - Use `gpt-3.5-turbo` in the meantime (works great!)

## Recommendation

**For most users**: Stick with `gpt-3.5-turbo` - it's fast, affordable, and provides excellent results for e-commerce search and recommendations.

