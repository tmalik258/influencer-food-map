# Vercel Environment Variables Setup

This document provides a comprehensive list of environment variables needed for deploying the Influencer Food Map to Vercel.

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable below with its appropriate value
4. Set the environment to **Production**, **Preview**, and **Development** as needed

## Required Environment Variables

### Database Configuration

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ Yes |
| `ASYNC_DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` | ✅ Yes |

### Redis Configuration

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379` | ✅ Yes |

### Supabase Configuration

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://abcdefg.supabase.co` | ✅ Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1...` | ✅ Yes |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | `your-jwt-secret-key` | ✅ Yes |

### API Keys

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI processing | `sk-proj-abcd1234...` | ✅ Yes |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | `AIzaSyAbc123...` | ✅ Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | `AIzaSyDef456...` | ✅ Yes |

### Admin Configuration

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `ADMIN_USERNAME` | Admin panel username | `admin` | ✅ Yes |
| `ADMIN_PASSWORD` | Admin panel password | `secure-password-123` | ✅ Yes |

### Application Configuration

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `CHUNK_SIZE` | Processing chunk size | `1000` | ✅ Yes |
| `TOKEN_SIZE` | Token processing size | `500` | ✅ Yes |
| `NODE_ENV` | Node.js environment | `production` | ✅ Yes |
| `PYTHONPATH` | Python path for serverless functions | `/var/task` | ✅ Yes |

## Environment Variables by Service

### Database Setup Options

#### Option 1: Supabase (Recommended)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### Option 2: Railway
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

#### Option 3: Neon
```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DBNAME]?sslmode=require
ASYNC_DATABASE_URL=postgresql+asyncpg://[USER]:[PASSWORD]@[HOST]/[DBNAME]?sslmode=require
```

### Redis Setup Options

#### Option 1: Upstash (Recommended)
```env
REDIS_URL=redis://:[PASSWORD]@[HOST]:[PORT]
```

#### Option 2: Railway
```env
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### API Keys Setup Guide

#### OpenAI API Key
1. Visit [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new secret key
4. Copy the key (starts with `sk-proj-` or `sk-`)

#### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key to YouTube Data API v3

#### Google Maps API
1. In the same Google Cloud project
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API** (optional)
3. Create an API Key or use the same key
4. Add domain restrictions for security

## Copy-Paste Template for Vercel

Use this template to quickly add all variables to Vercel:

```env
# Database
DATABASE_URL=postgresql://your-user:your-password@your-host:5432/your-database
ASYNC_DATABASE_URL=postgresql+asyncpg://your-user:your-password@your-host:5432/your-database

# Redis
REDIS_URL=redis://your-redis-url

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Keys
OPENAI_API_KEY=sk-your-openai-key
YOUTUBE_API_KEY=your-youtube-key
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# App Config
CHUNK_SIZE=1000
TOKEN_SIZE=500
NODE_ENV=production
PYTHONPATH=/var/task
```

## Environment Variable Validation

You can test if your environment variables are properly set by:

1. **Deploy and check logs**:
   - Go to Vercel Functions tab
   - Check function execution logs

2. **Test API endpoint**:
   ```bash
   curl https://your-app.vercel.app/api/
   ```

3. **Test database connection**:
   ```bash
   curl https://your-app.vercel.app/api/restaurants
   ```

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use different keys** for development and production
3. **Restrict API keys** to specific domains/IPs when possible
4. **Rotate keys regularly** for security
5. **Use strong passwords** for admin access
6. **Enable SSL** for all database connections

## Troubleshooting

### Common Issues

#### Database Connection Fails
- Check if the database URL format is correct
- Verify the database is accessible from external connections
- Ensure SSL is properly configured

#### API Keys Don't Work
- Verify the API key is active and has sufficient quota
- Check if the API service is enabled in Google Cloud Console
- Ensure proper permissions are set

#### Environment Variables Not Loading
- Check spelling and formatting
- Ensure variables are set for the correct environment (Production/Preview)
- Redeploy after adding new variables

### Testing Environment Variables

Create a simple test endpoint to verify variables are loaded:

```python
# Add to your FastAPI app for testing
@app.get("/test-env")
def test_env():
    return {
        "database_url": os.getenv("DATABASE_URL", "NOT_SET")[:20] + "...",
        "redis_url": os.getenv("REDIS_URL", "NOT_SET")[:20] + "...",
        "openai_key": "SET" if os.getenv("OPENAI_API_KEY") else "NOT_SET",
        "youtube_key": "SET" if os.getenv("YOUTUBE_API_KEY") else "NOT_SET",
    }
```

## Production Checklist

Before going live, ensure:

- [ ] All required environment variables are set
- [ ] Database migrations are applied
- [ ] API keys have sufficient quotas
- [ ] Admin credentials are secure
- [ ] External services (Database, Redis) are properly configured
- [ ] CORS settings allow your Vercel domain
- [ ] SSL certificates are properly configured
