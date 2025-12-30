# AI Agent Prompt Quick Reference

## ✅ What's Been Updated

I've enhanced your AI agent prompts to be **search-focused** and better at helping users discover products and shops through natural conversation.

## 🎯 Key Improvements

### Enhanced Search Capabilities
- ✅ Understands price ranges ("under 1000", "between 500-2000")
- ✅ Handles category-based searches
- ✅ Prioritizes high-rated products
- ✅ Detects hot offers and special deals
- ✅ Searches by product type
- ✅ Finds shops by category or specialization

### Better Response Format
- ✅ Clear numbered lists for products
- ✅ Includes all relevant details (price, shop, category, ratings)
- ✅ Highlights special offers and high ratings
- ✅ Suggests alternatives when no results found

### Comprehensive Information
- ✅ Product details: name, price, category, shop, ratings, shipping, warranty
- ✅ Shop details: name, category, contact info, social media, address, website

## 📝 Current Prompts

The enhanced prompts are now set as **default** in `backend/config/ai.js`. They will be used automatically unless you override them with `.env` variables.

## 🔧 How to Customize

### Option 1: Use Default (Already Active)
The enhanced prompts are already active! Just restart your backend server.

### Option 2: Override with .env (For Customization)

Add to `backend/.env`:

```env
# Custom English prompt (optional - only if you want to override)
AI_SYSTEM_PROMPT_EN=Your custom prompt here...

# Custom Arabic prompt (optional - only if you want to override)
AI_SYSTEM_PROMPT_AR=تعليماتك المخصصة هنا...
```

## 🧪 Test Queries

Try these queries to see the enhanced search in action:

### Product Searches
- "Show me laptops under 5000 EGP"
- "Find products in electronics category"
- "What are the best rated products?"
- "Show me hot offers"
- "Find phones between 2000-5000 EGP"
- "What products does [shop name] have?"

### Shop Searches
- "Find shops selling electronics"
- "Show me clothing stores"
- "What shops are in the [category] category?"
- "Find shops with WhatsApp"

### General Queries
- "What categories do you have?"
- "Show me the cheapest products"
- "What are the most popular products?"
- "Help me find [product type]"

## 📊 Example Responses

### Product Search Response
```
I found 3 laptops under 5000 EGP. Here are the top matches:

1. HP Laptop 15s - 4500 EGP
   From: TechStore | Category: Electronics | ⭐ 4.5 stars (12 reviews)
   Hot Offer: Yes 🔥

2. Dell Inspiron 15 - 4800 EGP
   From: ComputerWorld | Category: Electronics | ⭐ 4.2 stars (8 reviews)
```

### Shop Search Response
```
I found 2 electronics shops:

1. TechStore
   Category: Electronics | 📞 01234567890 | 💬 WhatsApp: 01234567890
   Address: 123 Main Street, Cairo
   Website: www.techstore.com

2. ComputerWorld
   Category: Electronics | 📞 01987654321
   Specializes in: Laptops, Computers, Accessories
```

## 🚀 Next Steps

1. **Restart your backend server** to load the new prompts
2. **Test the AI chat** with various search queries
3. **Customize if needed** using `.env` variables
4. **Monitor responses** and adjust prompts based on user feedback

## 📚 Documentation

- **Full Enhanced Prompts**: See `backend/docs/AI_ENHANCED_PROMPTS.md`
- **OpenAI Setup**: See `backend/docs/OPENAI_SETUP.md`
- **Environment Config**: See `backend/docs/AI_ENV_CONFIGURATION.md`
- **Prompt Configuration**: See `backend/docs/AI_PROMPT_CONFIGURATION.md`

## 💡 Tips

1. **Price Ranges**: Users can say "under 1000", "less than 500", "between 1000-2000"
2. **Categories**: Mention category names or ask "what categories do you have?"
3. **Ratings**: Ask for "best rated", "highly rated", or "top products"
4. **Hot Offers**: Ask for "deals", "offers", "hot offers", or "special prices"
5. **Product Types**: Search by specific types like "laptop", "phone", "clothing"

The AI will now provide much better, more detailed search results! 🎉

