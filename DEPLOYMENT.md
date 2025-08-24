# Vercel Deployment Guide

This guide explains how to deploy the Influencer Food Map application to Vercel with full-stack support (Next.js + FastAPI).

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Code must be in a GitHub repository
3. **External Services**: PostgreSQL database, Redis instance, API keys

## Quick Deployment

### Step 1: Prepare Your Repository

Ensure your repository has these files (already configured):

- `vercel.json` - Vercel configuration
- `requirements.txt` - Python dependencies (root level)
- `api/index.py` - API entry point
- `frontend/` - Next.js application
- `backend/` - FastAPI application

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: Leave blank (monorepo setup)
   - **Build Command**: `cd frontend && npm run build` (auto-configured)
   - **Output Directory**: `frontend/.next` (auto-configured)

3. **Deploy**: Click "Deploy" - first deployment will likely fail due to missing environment variables

### Step 3: Set Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and add:

#### Required Database Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
ASYNC_DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

#### Required Service Variables

```env
REDIS_URL=redis://user:password@host:6379
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

#### Required API Keys

```env
OPENAI_API_KEY=sk-your-openai-key
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

#### Application Configuration

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
CHUNK_SIZE=1000
TOKEN_SIZE=500
NODE_ENV=production
PYTHONPATH=/var/task
```

### Step 4: Redeploy

After setting environment variables:

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment

## Architecture Overview

### Vercel Deployment Structure

```
Your Domain (e.g., your-app.vercel.app)
├── / → Next.js Frontend (Static + SSR)
├── /restaurants → Frontend pages
├── /influencers → Frontend pages
└── /api/* → FastAPI Backend (Serverless Functions)
    ├── /api/restaurants → Restaurant API
    ├── /api/influencers → Influencer API
    ├── /api/listings → Listings API
    └── /api/admin/* → Admin API
```

### How It Works

1. **Frontend**: Next.js app served from `frontend/` directory
2. **Backend**: FastAPI app from `backend/` runs as serverless functions
3. **API Routes**: `/api/*` requests routed to Python backend
4. **Static Assets**: Served directly by Vercel CDN
5. **Database**: External PostgreSQL (recommend: Supabase, Railway, or Neon)
6. **Redis**: External Redis instance (recommend: Upstash or Railway)

## Database Setup

### Option 1: Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Get database URL from Settings → Database
3. Use the provided connection strings

### Option 2: Railway

1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Get connection string from Variables tab

### Option 3: Neon

1. Create project at [neon.tech](https://neon.tech)
2. Get connection string from dashboard

### Database Migration

```bash
# Run migrations locally first
cd backend
alembic upgrade head
```

## Redis Setup

### Option 1: Upstash (Recommended)

1. Create database at [upstash.com](https://upstash.com)
2. Copy the Redis URL

### Option 2: Railway

1. Add Redis service to your Railway project
2. Get connection string

## API Keys Setup

### OpenAI API

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add billing method for API usage

### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create credentials (API Key)

### Google Maps API

1. Enable Maps JavaScript API and Places API
2. Create API key with proper restrictions

## Verification Steps

After deployment, test these endpoints:

1. **Frontend**: `https://your-app.vercel.app/`
2. **API Health**: `https://your-app.vercel.app/api/`
3. **Restaurants**: `https://your-app.vercel.app/api/restaurants`
4. **Influencers**: `https://your-app.vercel.app/api/influencers`

## Troubleshooting

### Common Issues

#### Build Failures

- Check all environment variables are set
- Verify Python dependencies in `requirements.txt`
- Check Node.js version compatibility

#### API Errors (500/404)

- Verify `api/index.py` is properly configured
- Check Python import paths
- Ensure all environment variables are available

#### Database Connection Issues

- Test database URL format
- Check firewall/IP restrictions
- Verify SSL requirements

#### Function Timeouts

- Optimize database queries
- Reduce external API calls
- Consider caching strategies

### Debugging Tips

1. **Check Vercel Logs**:
   - Go to Functions tab in Vercel dashboard
   - Click on individual function invocations

2. **Local Testing**:

   ```bash
   # Test backend locally
   cd backend
   uvicorn app.main:app --reload
   
   # Test frontend locally
   cd frontend
   npm run dev
   ```

3. **Environment Variables**:

   ```bash
   # Check if variables are loaded
   curl https://your-app.vercel.app/api/
   ```

## Performance Optimization

### Frontend

- Enable Next.js Image Optimization
- Implement proper caching headers
- Use dynamic imports for heavy components

### Backend

- Optimize database queries
- Implement response caching
- Use connection pooling

### Database

- Create proper indexes
- Use read replicas if needed
- Implement query optimization

## Local Development

For local development, use Docker Compose:

```bash
# Full stack with hot reload
docker compose up -d

# Access services
# Frontend: http://localhost:4001
# Backend: http://localhost:8030
# Redis: localhost:6382
```

## Production Monitoring

- Monitor Vercel Analytics for performance
- Set up error tracking (Sentry recommended)
- Monitor database performance
- Track API usage and costs

## Scaling Considerations

- Vercel automatically scales serverless functions
- Consider database connection limits
- Monitor Redis memory usage
- Implement rate limiting if needed
