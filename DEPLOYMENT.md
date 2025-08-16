# Vercel Deployment Guide

This guide explains how to deploy the Influencer Food Map application to Vercel.

## Prerequisites

1. A Vercel account
2. GitHub repository with your code
3. Required environment variables (see `.env.example`)

## Deployment Steps

### 1. Environment Variables

Set up the following environment variables in your Vercel project dashboard:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
ASYNC_DATABASE_URL=postgresql+asyncpg://username:password@host:port/database

# Redis Configuration
REDIS_URL=redis://your-redis-url

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# API Keys
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Application Configuration
CHUNK_SIZE=1000
TOKEN_SIZE=500
NODE_ENV=production
```

### 2. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the configuration from `vercel.json`
3. The deployment will:
   - Build the Next.js frontend from the `frontend/` directory
   - Deploy the FastAPI backend from `backend/app/main.py` as serverless functions
   - Route `/api/*` requests to the Python backend
   - Serve the frontend for all other routes

### 3. Project Structure

```
├── vercel.json          # Vercel configuration
├── requirements.txt     # Python dependencies for backend
├── .env.example        # Environment variables template
├── frontend/           # Next.js application
│   ├── package.json
│   └── ...
└── backend/           # FastAPI application
    ├── app/
    │   ├── main.py    # FastAPI entry point
    │   └── ...
    └── requirements.txt
```

### 4. Verification

After deployment:
1. Check that the frontend loads correctly
2. Test API endpoints at `/api/*`
3. Verify database connections work
4. Test authentication flows

## Troubleshooting

- **Build failures**: Check that all environment variables are set
- **API errors**: Verify database URLs and API keys
- **CORS issues**: Ensure frontend domain is allowed in FastAPI CORS settings
- **Function timeouts**: Optimize database queries and API calls

## Local Development

For local development, use Docker Compose:

```bash
docker compose up -d
```

This will run:
- Frontend on `http://localhost:4001`
- Backend on `http://localhost:8030`