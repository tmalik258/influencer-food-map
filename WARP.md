# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The Influencer Food Map is a full-stack application that helps users discover restaurants through food influencer recommendations. It consists of:

- **Frontend**: Next.js 15 application with TypeScript, Tailwind CSS
- **Backend**: FastAPI application with PostgreSQL, Redis, and AI processing capabilities
- **Services**: YouTube API integration, Google Maps API, OpenAI for transcription and processing

## Common Development Commands

### Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies (in virtual environment)
cd backend && pip install -r requirements.txt
```

### Development Server
```bash
# Start full stack with Docker (recommended)
docker compose up -d

# OR start services individually:

# Frontend only (requires backend running)
cd frontend && npm run dev

# Backend only (requires PostgreSQL and Redis)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Building and Testing
```bash
# Frontend build and lint
cd frontend && npm run build
cd frontend && npm run lint

# Backend testing
cd backend && python -m pytest tests/

# Run specific test file
cd backend && python -m pytest tests/login_test.py
```

### Database Operations
```bash
# Create new migration
cd backend && alembic revision --autogenerate -m "description"

# Apply migrations
cd backend && alembic upgrade head

# Rollback migration
cd backend && alembic downgrade -1
```

### Seeding and Data Processing
```bash
# Run photo seed script
cd backend && python run_photo_seed.py

# Test audio transcription
curl http://localhost:8030/test-transcribe
```

## Architecture Overview

### Frontend Architecture (Clean Separation Pattern)

The frontend follows a **clean separation of concerns** with:

- **Actions Layer** (`/frontend/lib/actions/`): Pure API service functions organized by domain
  - `restaurant-actions.ts` - Restaurant API calls
  - `influencer-actions.ts` - Influencer API calls  
  - `listing-actions.ts` - Listing API calls

- **Hooks Layer** (`/frontend/lib/hooks/`): Custom hooks for state management
  - `useRestaurants.ts` - Restaurant data fetching with loading/error states
  - `useInfluencers.ts` - Influencer data management
  - `useListings.ts` - Listing relationships management

**Key Pattern**: Always use hooks in components, not direct API calls. Hooks provide automatic loading states, error handling, and caching.

### Backend Architecture (FastAPI + SQLAlchemy)

The backend is organized in a modular structure:

- **Models** (`/backend/app/models/`): SQLAlchemy ORM models
- **Routes** (`/backend/app/routes/`): FastAPI route handlers organized by domain
- **API Schema** (`/backend/app/api_schema/`): Pydantic models for request/response validation
- **Scripts** (`/backend/app/scripts/`): AI processing and automation scripts

**Core Services**:
- Restaurant and influencer data management
- AI-powered video transcription and processing (OpenAI Whisper)
- Google Maps integration for location data
- YouTube API for video content
- Admin interface for content approval

### Database Schema

Key relationships:
- **Restaurants** ↔ **Listings** ↔ **Influencers** (many-to-many through listings)
- **Videos** link to specific listings with transcription data
- **Tags** categorize restaurants
- **Listings** have approval status and confidence scores

### Deployment Architecture

- **Development**: Docker Compose setup with hot reloading
- **Production**: Vercel deployment (frontend + serverless API)
- **Services**: External PostgreSQL, Redis, and API services

## Development Workflows

### Adding New Features

1. **Backend API**: Create routes → models → schemas
2. **Frontend Integration**: Add actions → create hooks → use in components
3. **Database Changes**: Create Alembic migration
4. **Testing**: Add backend tests, verify frontend integration

### Working with AI Processing

The app includes AI-powered features:
- Video transcription using OpenAI Whisper
- Restaurant data extraction from video content
- Confidence scoring for recommendations

Files: `/backend/app/scripts/gpt_food_place_processor.py`

### Environment Configuration

**Required Environment Variables**:
- Database: `DATABASE_URL`, `ASYNC_DATABASE_URL`
- Redis: `REDIS_URL`
- APIs: `OPENAI_API_KEY`, `YOUTUBE_API_KEY`, `GOOGLE_MAPS_API_KEY`
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
- Admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD`

### Port Configuration

- **Frontend**: `localhost:3000` (dev) / `localhost:4001` (Docker)
- **Backend**: `localhost:8000` (dev) / `localhost:8030` (Docker)
- **Redis**: `localhost:6379` (dev) / `localhost:6382` (Docker)

### API Endpoints Structure

```
/influencers - Influencer management
/restaurants - Restaurant data and search
/listings - Restaurant-influencer relationships
/videos - Video content and transcription
/tags - Restaurant categorization
/google-reviews - Google business data
/admin/listings - Content approval interface
/process - AI processing workflows
```

### Frontend Component Patterns

**Preferred Pattern** (using hooks):
```typescript
import { useRestaurants } from '@/lib/hooks';

function RestaurantsPage() {
  const { restaurants, loading, error, searchByCity } = useRestaurants();
  // Component logic with automatic state management
}
```

**Avoid** direct API calls in components - use the hooks layer instead.

### Database Migration Workflow

1. Modify models in `/backend/app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration in `/backend/migrations/versions/`
4. Apply: `alembic upgrade head`

### Key Integration Points

- **Next.js API Routes**: Proxy `/api/*` to FastAPI backend
- **CORS Configuration**: FastAPI configured for localhost development
- **Image Handling**: Next.js Image optimization with external domain support
- **Maps Integration**: React Leaflet for interactive maps
- **Form Handling**: React Hook Form with Zod validation

## Troubleshooting

### Common Issues

**API Connection**: Verify backend is running on correct port and CORS is configured
**Database**: Ensure PostgreSQL is running and migrations are applied
**Environment**: Check all required environment variables are set
**Docker**: Use `docker compose logs [service]` to debug container issues
**Frontend Build**: Clear `.next` directory if encountering build cache issues
