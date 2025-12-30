# AI Agent Troubleshooting Guide

## 404 Error: Route Not Found

If you're getting a 404 error when calling the AI endpoint, follow these steps:

### 1. Verify Backend Server is Running

```bash
# Check if backend is running on port 5000
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "iDream API is running",
  "database": "connected"
}
```

### 2. Restart Backend Server

The AI routes were just added, so you need to restart the backend:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### 3. Verify Route Registration

Check that the route is registered in `backend/server.js`:

```javascript
app.use('/api/ai', checkDBConnection, require('./routes/ai'));
```

### 4. Test the Endpoint Directly

Test the AI endpoint using curl or Postman:

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "language": "en"
  }'
```

Expected response:
```json
{
  "response": "...",
  "searchResults": [],
  "timestamp": "..."
}
```

### 5. Check Frontend API Configuration

Verify the frontend is using the correct API base URL:

**File**: `frontend-portal/src/config/app.js`

```javascript
api: {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  ...
}
```

The frontend calls `/ai/chat`, which with baseURL `http://localhost:5000/api` becomes:
`http://localhost:5000/api/ai/chat` ✅

### 6. Check Browser Console

Open browser DevTools (F12) and check:
- Network tab: See the exact URL being called
- Console tab: Check for any CORS or other errors

### 7. Verify CORS Configuration

Check `backend/config/app.js` CORS settings include your frontend URL:

```javascript
cors: {
  origin: ['http://localhost:3000', 'http://localhost:3001', ...],
  ...
}
```

### 8. Check Server Logs

Look at the backend server console for:
- Route registration messages
- Any error messages when the route is accessed
- Database connection status

## Common Issues

### Issue: "Cannot GET /api/ai/chat"
**Solution**: You're using GET instead of POST. The endpoint requires POST.

### Issue: "Route not found"
**Solution**: 
1. Restart backend server
2. Verify `backend/routes/ai.js` exists
3. Check `backend/server.js` has the route registered

### Issue: "Module not found"
**Solution**: 
1. Check `backend/controllers/aiController.js` exists
2. Check `backend/config/ai.js` exists
3. Run `npm install` in backend directory

### Issue: CORS Error
**Solution**: Add your frontend URL to CORS origins in `backend/config/app.js`

## Quick Fix Checklist

- [ ] Backend server is running
- [ ] Backend server was restarted after adding AI routes
- [ ] `backend/routes/ai.js` exists
- [ ] `backend/controllers/aiController.js` exists
- [ ] `backend/config/ai.js` exists
- [ ] Route is registered in `backend/server.js`
- [ ] Frontend API baseURL is correct
- [ ] No errors in backend console
- [ ] No errors in browser console

## Still Not Working?

1. Check the exact error message in browser DevTools Network tab
2. Check backend server logs for errors
3. Verify MongoDB is running (AI needs database for product/shop search)
4. Test the endpoint directly with curl/Postman

