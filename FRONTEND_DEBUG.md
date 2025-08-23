# Frontend Deployment Debugging Guide

## Current Issue: Frontend Not Showing Up

The deployment is successful but the frontend is not loading. Here are steps to debug and fix this issue.

## Quick Fixes to Try

### 1. **Check Vercel Project Settings**

1. Go to your Vercel dashboard → Your project → Settings
2. **Framework Preset**: Should be "Next.js"
3. **Root Directory**: Should be blank (not "frontend")
4. **Build Command**: Should be auto-detected or use: `cd frontend && npm run build`
5. **Output Directory**: Should be `frontend/.next`
6. **Install Command**: Should be `cd frontend && npm install`

### 2. **Verify Build Logs**

1. Go to Deployments tab in Vercel
2. Click on the latest deployment
3. Check the build logs for:
   - ✅ Frontend build completed successfully
   - ✅ Static files were generated
   - ❌ Any errors during the build process

### 3. **Test Individual URLs**

Try accessing these URLs directly:

- `https://your-app.vercel.app/` (should show homepage)
- `https://your-app.vercel.app/restaurants` (should show restaurants page)
- `https://your-app.vercel.app/api/` (should show API response)
- `https://your-app.vercel.app/api/test` (should show test API)

### 4. **Check Browser Console**

1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Look for 404s or CORS issues

## Common Causes & Solutions

### **Issue 1: Monorepo Path Problems**

**Symptoms**: Vercel builds but serves 404 for all pages

**Solution**: Update `vercel.json` configuration (already done):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### **Issue 2: Missing Static Files**

**Symptoms**: Homepage loads but styling/images are broken

**Solution**: 
1. Check if `frontend/public/` directory exists
2. Verify `frontend/public/hero-main.jpg` exists (used on homepage)
3. Check Next.js Image configuration in `frontend/next.config.ts`

### **Issue 3: Build Output Directory**

**Symptoms**: Build succeeds but no files are served

**Solution**: Verify Vercel project settings:
- **Output Directory**: `frontend/.next` 
- **Root Directory**: Leave blank (auto-detect)

### **Issue 4: Node.js Version**

**Symptoms**: Build fails with dependency errors

**Solution**: Add to root `package.json`:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### **Issue 5: Environment Variables**

**Symptoms**: Frontend loads but API calls fail

**Solution**: 
1. Add environment variables in Vercel dashboard
2. Prefix client-side variables with `NEXT_PUBLIC_`
3. Check API endpoints are responding

## Testing Steps

### Local Test (Should work)
```bash
cd frontend
npm install
npm run build
npm run start
# Visit http://localhost:3000
```

### Vercel Test
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root directory
vercel --prod

# Or link to existing project
vercel link
vercel --prod
```

## Debug Commands

### Check Build Output
```bash
cd frontend
npm run build
ls -la .next/
# Should see: server/, static/, export-marker.json, etc.
```

### Verify Static Files
```bash
cd frontend
ls -la public/
# Should see: hero-main.jpg, favicon.ico, etc.
```

### Test API Endpoints
```bash
# Test local API files
python -c "from api.index import handler; print('API handler OK')"
python -c "from api.test import handler; print('Test handler OK')"
```

## Manual Deployment Steps

If automatic deployment isn't working, try manual deployment:

1. **Fork/Clone** repository to a clean location
2. **Push to GitHub** (ensure all changes are committed)
3. **Import to Vercel** fresh project
4. **Configure settings** manually:
   - Framework: Next.js
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/.next`
   - Install Command: `cd frontend && npm install`
5. **Add environment variables** from `VERCEL_ENV_VARS.md`
6. **Deploy**

## Expected File Structure

```
your-vercel-app/
├── frontend/           # Next.js app
│   ├── .next/         # Build output (generated)
│   ├── app/           # App Router pages
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
├── api/               # Serverless functions
│   ├── index.py       # Main API
│   ├── test.py        # Test endpoint  
│   └── restaurants.py # Restaurants API
├── vercel.json        # Deployment config
└── package.json       # Root package.json
```

## Contact/Next Steps

If the issue persists after trying these solutions:

1. **Check Vercel Status**: https://vercel-status.com
2. **Vercel Community**: https://github.com/vercel/vercel/discussions
3. **Review Build Logs** carefully for any hidden errors
4. **Try deploying** a minimal Next.js app first to isolate the issue

The current configuration should work with the updated `vercel.json`. Try redeploying with the new configuration.
