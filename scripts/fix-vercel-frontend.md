# Fix Vercel Frontend Routing Issue

## Problem
- Frontend works on `/frontend` but not on root `/`
- Static files (images, CSS, JS) are not loading correctly
- Need to serve the frontend at the root domain

## Solution Steps

### Step 1: Update Vercel Project Settings

Go to your Vercel project dashboard → Settings → General:

**Critical Settings:**
```
Framework Preset: Next.js
Root Directory: [LEAVE BLANK - DO NOT set to "frontend"]
Build Command: cd frontend && npm run build
Output Directory: frontend/.next  
Install Command: cd frontend && npm install
```

### Step 2: Verify vercel.json (Already Fixed)

Your current `vercel.json` is now correct:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/*.py",
      "use": "@vercel/python"
    }
  ]
}
```

### Step 3: Deploy and Test

1. **Commit the changes:**
```bash
git add vercel.json
git commit -m "Fix Vercel frontend routing"
git push origin main
```

2. **Force redeploy on Vercel:**
   - Go to Deployments tab
   - Click the three dots on latest deployment
   - Click "Redeploy"

3. **Test these URLs:**
   - `https://your-app.vercel.app/` (should show homepage)
   - `https://your-app.vercel.app/restaurants` (should show restaurants)
   - `https://your-app.vercel.app/api/test` (should show API response)

## Alternative: Manual Vercel CLI Deploy

If the issue persists, try deploying manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root directory
cd "C:\Users\talha\OneDrive\Software Engineering\Upwork\Influencer food map"
vercel --prod

# Follow the prompts:
# - Link to existing project: Yes
# - Select your existing project
# - Deploy
```

## Expected Behavior After Fix

✅ **Root domain** (`/`) serves the Next.js homepage  
✅ **Static files** load correctly (images, CSS, JS)  
✅ **API endpoints** work at `/api/*`  
✅ **Next.js routing** works properly  

## Debug Commands

**Test locally first:**
```bash
cd frontend
npm run build
npm run start
# Visit http://localhost:3000 - should work perfectly
```

**Check build output:**
```bash
cd frontend
npm run build
# Should complete without errors
ls -la .next/
# Should show server/, static/, etc.
```

## Common Issues & Solutions

### Issue 1: Still serving on /frontend
**Solution:** Check Root Directory setting is BLANK in Vercel dashboard

### Issue 2: 404 on static files
**Solution:** The simplified vercel.json should fix this

### Issue 3: Build succeeds but nothing loads
**Solution:** Clear Vercel cache:
- Go to Settings → Functions
- Click "Clear Cache" if available
- Redeploy

### Issue 4: Images not loading
**Check:** 
- Images exist in `frontend/public/`
- Next.js Image component is used correctly
- Image paths start with `/` (e.g., `/hero-main.jpg`)

## What Changed

**Before:** Complex routing rules caused conflicts  
**After:** Simple build configuration lets Vercel handle Next.js routing automatically

The key insight: `@vercel/next` builder handles all the routing automatically for Next.js apps when configured properly. We don't need manual route configuration.

## Next Steps

1. Update Vercel project settings as described above
2. Redeploy
3. Test the URLs
4. If still not working, try the manual Vercel CLI deployment

The root cause was conflicting routing rules. The simplified configuration should resolve both the routing issue and static file serving.
