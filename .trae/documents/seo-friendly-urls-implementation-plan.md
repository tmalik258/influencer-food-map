# SEO-Friendly URLs Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for changing the URL structure from ID-based to name-based (slug) URLs for restaurant and influencer detail pages. This change will improve SEO by making URLs more readable and keyword-rich.

## Current State Analysis

### Backend Structure

* **Restaurant Model**: Uses UUID primary key (`id`), has `name` field with unique constraint

* **Influencer Model**: Uses UUID primary key (`id`), has `name` field (not unique)

* **Current API Endpoints**:

  * `GET /restaurants/{restaurant_id}/` - Get restaurant by ID

  * `GET /influencers/{id}/` - Get influencer by ID

### Frontend Structure

* **Current Routes**:

  * `/restaurants/[id]/page.tsx` - Restaurant detail page

  * `/influencers/[id]/page.tsx` - Influencer detail page

* **URL Generation**: Uses `${window.location.origin}/restaurants/${restaurant.id}`

## Implementation Plan

### 1. Database Schema Changes

#### 1.1 Add Slug Fields to Models

**Restaurant Model** (`backend/app/models/restaurant.py`):

```python
# Add to imports
from sqlalchemy import Index

# Add to Restaurant class (after existing columns)
slug = Column(String(255), nullable=False, unique=True, index=True)

# Add composite index for slug lookups
__table_args__ = (
    Index('idx_restaurant_slug_active', 'slug', 'is_active'),
)
```

**Influencer Model** (`backend/app/models/influencer.py`):

```python
# Add to Influencer class (after existing columns)
slug = Column(String(255), nullable=False, index=True)

# Add composite index for slug lookups
__table_args__ = (
    Index('idx_influencer_slug_active', 'slug', 'created_at'),
)
```

#### 1.2 Create Migration Script

Create `backend/scripts/generate_slugs.py`:

```python
import asyncio
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_async_db
from app.models import Restaurant, Influencer

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove special characters except alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug or 'unnamed'

async def generate_unique_slug(session: AsyncSession, name: str, model, existing_slug: str = None) -> str:
    """Generate unique slug, handling duplicates"""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    while True:
        # Check if slug exists (excluding current record if updating)
        query = select(model).filter(model.slug == slug)
        if existing_slug:
            query = query.filter(model.slug != existing_slug)
        
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            break
            
        # If duplicate exists, append counter
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

async def migrate_restaurants():
    """Generate slugs for existing restaurants"""
    async with get_async_db() as session:
        # Get all restaurants without slugs
        result = await session.execute(select(Restaurant))
        restaurants = result.scalars().all()
        
        for restaurant in restaurants:
            if not restaurant.slug:
                restaurant.slug = await generate_unique_slug(
                    session, restaurant.name, Restaurant
                )
        
        await session.commit()
        print(f"Migrated {len(restaurants)} restaurants")

async def migrate_influencers():
    """Generate slugs for existing influencers"""
    async with get_async_db() as session:
        # Get all influencers without slugs
        result = await session.execute(select(Influencer))
        influencers = result.scalars().all()
        
        for influencer in influencers:
            if not influencer.slug:
                influencer.slug = await generate_unique_slug(
                    session, influencer.name, Influencer
                )
        
        await session.commit()
        print(f"Migrated {len(influencers)} influencers")

if __name__ == "__main__":
    asyncio.run(migrate_restaurants())
    asyncio.run(migrate_influencers())
```

### 2. Backend API Modifications

#### 2.1 Create Utility Functions

Create `backend/app/utils/slug_utils.py`:

```python
import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Restaurant, Influencer

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    if not name:
        return 'unnamed'
    
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove special characters except alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug or 'unnamed'

async def generate_unique_slug(
    session: AsyncSession, 
    name: str, 
    model, 
    existing_id: Optional[str] = None
) -> str:
    """Generate unique slug, handling duplicates"""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    while True:
        # Check if slug exists (excluding current record if updating)
        query = select(model).filter(model.slug == slug)
        if existing_id:
            query = query.filter(model.id != existing_id)
        
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            break
            
        # If duplicate exists, append counter
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

async def get_restaurant_by_slug(session: AsyncSession, slug: str) -> Optional[Restaurant]:
    """Get restaurant by slug"""
    result = await session.execute(
        select(Restaurant).filter(Restaurant.slug == slug, Restaurant.is_active == True)
    )
    return result.scalar_one_or_none()

async def get_influencer_by_slug(session: AsyncSession, slug: str) -> Optional[Influencer]:
    """Get influencer by slug"""
    result = await session.execute(
        select(Influencer).filter(Influencer.slug == slug)
    )
    return result.scalar_one_or_none()
```

#### 2.2 Update Restaurant Routes

Modify `backend/app/routes/restaurants.py`:

```python
# Add to imports
from app.utils.slug_utils import get_restaurant_by_slug

# Add new endpoint for slug-based lookup
@router.get("/by-slug/{slug}/", response_model=RestaurantResponse)
async def get_restaurant_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurants"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details")
):
    """Get restaurant by slug"""
    try:
        # Get restaurant by slug
        restaurant = await get_restaurant_by_slug(db, slug)
        
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        # Load relationships if needed
        if include_listings:
            query = select(Restaurant).filter(Restaurant.id == restaurant.id).options(
                joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
                joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
                joinedload(Restaurant.listings).joinedload(Listing.video),
                joinedload(Restaurant.listings).joinedload(Listing.influencer)
            )
            result = await db.execute(query)
            restaurant = result.unique().scalar_one_or_none()
        
        # Process response (reuse existing logic from get_restaurant_by_id)
        # ... (include the same processing logic as existing endpoint)
        
        return restaurant
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant by slug {slug}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Update existing endpoint to also support slug lookup (optional)
@router.get("/{restaurant_identifier}/", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_identifier: str,  # Can be ID or slug
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with restaurants"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details")
):
    """Get restaurant by ID or slug"""
    try:
        # Try to parse as UUID first
        try:
            restaurant_id = UUID(restaurant_identifier)
            # Look up by ID
            restaurant = await get_restaurant_by_id(db, restaurant_id, include_listings, include_video_details)
        except ValueError:
            # Not a valid UUID, try as slug
            restaurant = await get_restaurant_by_slug(db, restaurant_identifier)
            if restaurant and include_listings:
                # Load relationships if needed
                query = select(Restaurant).filter(Restaurant.id == restaurant.id).options(
                    joinedload(Restaurant.restaurant_tags).joinedload(RestaurantTag.tag),
                    joinedload(Restaurant.restaurant_cuisines).joinedload(RestaurantCuisine.cuisine),
                    joinedload(Restaurant.listings).joinedload(Listing.video),
                    joinedload(Restaurant.listings).joinedload(Listing.influencer)
                )
                result = await db.execute(query)
                restaurant = result.unique().scalar_one_or_none()
        
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return restaurant
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant {restaurant_identifier}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

#### 2.3 Update Influencer Routes

Modify `backend/app/routes/influencers.py`:

```python
# Add to imports
from app.utils.slug_utils import get_influencer_by_slug

# Add new endpoint for slug-based lookup
@router.get("/by-slug/{slug}/", response_model=InfluencerResponse)
async def get_influencer_by_slug_endpoint(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with influencers"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details")
):
    """Get influencer by slug"""
    try:
        # Get influencer by slug
        influencer = await get_influencer_by_slug(db, slug)
        
        if not influencer:
            raise HTTPException(status_code=404, detail="Influencer not found")
        
        # Load relationships if needed
        if include_listings:
            query = select(Influencer).filter(Influencer.id == influencer.id).options(
                joinedload(Influencer.listings)
                .joinedload(Listing.video),
                joinedload(Influencer.listings)
                .joinedload(Listing.restaurant)
            )
            result = await db.execute(query)
            influencer = result.unique().scalar_one_or_none()
        
        # Process response (reuse existing logic)
        # ... (include the same processing logic as existing endpoint)
        
        return influencer
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching influencer by slug {slug}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Update existing endpoint to also support slug lookup
@router.get("/{influencer_identifier}/", response_model=InfluencerResponse)
async def get_influencer(
    influencer_identifier: str,  # Can be ID or slug
    db: AsyncSession = Depends(get_async_db),
    include_listings: Optional[bool] = Query(False, description="Include listings with influencers"),
    include_video_details: Optional[bool] = Query(False, description="Include full video details")
):
    """Get influencer by ID or slug"""
    try:
        # Try to parse as UUID first
        try:
            influencer_id = UUID(influencer_identifier)
            # Look up by ID
            influencer = await get_influencer_by_id(db, influencer_id, include_listings, include_video_details)
        except ValueError:
            # Not a valid UUID, try as slug
            influencer = await get_influencer_by_slug(db, influencer_identifier)
            if influencer and include_listings:
                # Load relationships if needed
                query = select(Influencer).filter(Influencer.id == influencer.id).options(
                    joinedload(Influencer.listings)
                    .joinedload(Listing.video),
                    joinedload(Influencer.listings)
                    .joinedload(Listing.restaurant)
                )
                result = await db.execute(query)
                influencer = result.unique().scalar_one_or_none()
        
        if not influencer:
            raise HTTPException(status_code=404, detail="Influencer not found")
        
        return influencer
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching influencer {influencer_identifier}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

#### 2.4 Update Admin Routes

Modify admin routes to handle slug generation:

**Admin Restaurants** (`backend/app/routes/admin/restaurants.py`):

```python
# Add to imports
from app.utils.slug_utils import generate_unique_slug

# In create restaurant endpoint, add slug generation
async def create_restaurant(
    restaurant: RestaurantCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Create a new restaurant (Admin only)"""
    try:
        # Generate unique slug
        slug = await generate_unique_slug(db, restaurant.name, Restaurant)
        
        # Create restaurant with slug
        db_restaurant = Restaurant(
            **restaurant.model_dump(),
            slug=slug
        )
        
        # ... rest of the logic

# In update restaurant endpoint, handle slug updates
async def update_restaurant(
    restaurant_id: UUID,
    restaurant_update: RestaurantUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin = Depends(get_current_admin)
):
    """Update an existing restaurant (Admin only)"""
    try:
        # Get existing restaurant
        existing_restaurant = await get_restaurant_by_id(db, restaurant_id)
        
        # If name is being changed, update slug
        if restaurant_update.name and restaurant_update.name != existing_restaurant.name:
            new_slug = await generate_unique_slug(
                db, 
                restaurant_update.name, 
                Restaurant, 
                existing_restaurant.id
            )
            restaurant_update.slug = new_slug
        
        # ... rest of the logic
```

### 3. Frontend Routing Changes

#### 3.1 Create Utility Functions

Create `frontend/lib/utils/slug-utils.ts`:

```typescript
export function generateSlug(name: string): string {
  if (!name) return 'unnamed';
  
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unnamed';
}

export function getRestaurantUrl(restaurant: { id: string; name: string }): string {
  const slug = generateSlug(restaurant.name);
  return `/restaurants/${slug}`;
}

export function getInfluencerUrl(influencer: { id: string; name: string }): string {
  const slug = generateSlug(influencer.name);
  return `/influencers/${slug}`;
}

export function getRestaurantShareUrl(restaurant: { id: string; name: string }): string {
  if (typeof window !== 'undefined') {
    const slug = generateSlug(restaurant.name);
    return `${window.location.origin}/restaurants/${slug}`;
  }
  return '';
}

export function getInfluencerShareUrl(influencer: { id: string; name: string }): string {
  if (typeof window !== 'undefined') {
    const slug = generateSlug(influencer.name);
    return `${window.location.origin}/influencers/${slug}`;
  }
  return '';
}
```

#### 3.2 Update Route Structure

Rename and modify route files:

**Move**: `frontend/app/(routes)/restaurants/[id]/page.tsx` → `frontend/app/(routes)/restaurants/[slug]/page.tsx`

Update the restaurant detail page:

```typescript
// Update imports and params usage
import { notFound } from 'next/navigation';

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantSlug = params.slug as string;

  // Update hook to use slug instead of ID
  const {
    restaurant,
    loading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useRestaurantWithListingsBySlug(restaurantSlug, true);

  // ... rest of the component remains the same
}
```

**Move**: `frontend/app/(routes)/influencers/[id]/page.tsx` → `frontend/app/(routes)/influencers/[slug]/page.tsx`

Update the influencer detail page:

```typescript
// Update imports and params usage
import { notFound } from 'next/navigation';

export default function InfluencerDetailPage() {
  const params = useParams() as { slug: string };
  const influencerSlug = params?.slug;

  // Update hook to use slug instead of ID
  const {
    influencer,
    loading: influencerLoading,
    error: influencerError,
    refetch: refetchInfluencer,
  } = useInfluencerBySlug(influencerSlug);

  // ... rest of the component remains the same
}
```

#### 3.3 Update API Hooks

Create new hooks in `frontend/lib/hooks.ts`:

```typescript
// Restaurant hooks with slug support
export function useRestaurantWithListingsBySlug(slug: string, includeVideoDetails: boolean = false) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/restaurants/by-slug/${slug}/`, {
        params: {
          include_listings: true,
          include_video_details: includeVideoDetails
        }
      });
      setRestaurant(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant');
    } finally {
      setLoading(false);
    }
  }, [slug, includeVideoDetails]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return { restaurant, loading, error, refetch: fetchRestaurant };
}

// Influencer hooks with slug support
export function useInfluencerBySlug(slug: string) {
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/influencers/by-slug/${slug}/`);
      setInfluencer(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchInfluencer();
  }, [fetchInfluencer]);

  return { influencer, loading, error, refetch: fetchInfluencer };
}
```

#### 3.4 Update Navigation Components

Update all components that generate URLs:

**Restaurant Detail Card** (`frontend/components/restaurant-detail-card.tsx`):

```typescript
import { getRestaurantUrl, getRestaurantShareUrl } from '@/lib/utils/slug-utils';

// Replace URL generation
<Link href={getRestaurantUrl(restaurant)}>
  {/* ... */}
</Link>

// Replace share URL generation
<SocialShareButtons
  url={getRestaurantShareUrl(restaurant)}
  title={`Check out ${restaurant.name}`}
/>
```

**Influencer Components** - Update similar URL generation in influencer-related components.

### 4. Fallback Mechanisms

#### 4.1 ID-Based Fallback

Create fallback mechanism for existing URLs:

**Next.js Middleware** (`frontend/middleware.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path matches old ID-based URLs
  const restaurantIdMatch = pathname.match(/^\/restaurants\/([a-f0-9-]{36})$/i);
  const influencerIdMatch = pathname.match(/^\/influencers\/([a-f0-9-]{36})$/i);
  
  if (restaurantIdMatch || influencerIdMatch) {
    // Redirect to home or show 404 for old ID-based URLs
    // You could also implement a lookup service to redirect to the correct slug
    return NextResponse.redirect(new URL('/404', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/restaurants/:path*', '/influencers/:path*'],
};
```

#### 4.2 Duplicate Name Handling

The `generate_unique_slug` function already handles duplicate names by appending counters.

### 5. Migration Strategy

#### 5.1 Database Migration Steps

1. **Add slug columns** with nullable constraint
2. **Generate slugs** for existing records using migration script
3. **Add unique constraints** after populating data
4. **Update application code** to use new slug-based routes
5. **Remove nullable constraint** and make slug required

#### 5.2 Deployment Steps

1. **Deploy backend changes** first (with backward compatibility)
2. **Run migration script** to generate slugs
3. **Deploy frontend changes** with new URL structure
4. **Update sitemap.xml** and submit to search engines
5. **Monitor for 404 errors** and fix any issues

### 6. Integration with Existing Navigation

#### 6.1 Update Breadcrumbs

Update breadcrumb components to use slug-based URLs:

```typescript
// In breadcrumb components
const breadcrumbItems = [
  { label: 'Restaurants', href: '/restaurants' },
  { label: restaurant.name, href: getRestaurantUrl(restaurant) },
];
```

#### 6.2 Update Sitemap Generation

Update sitemap generation to use slug-based URLs:

### 8. Monitoring and Analytics

#### 8.1 404 Monitoring

Set up monitoring for 404 errors to catch any broken links:

```typescript
// In error handling
if (error?.response?.status === 404) {
  // Log to analytics service
  analytics.track('404_error', {
    url: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  });
}
```

<br />

## Conclusion

This implementation provides a robust, SEO-friendly URL structure while maintaining backward compatibility and handling edge cases. The phased approach ensures minimal disruption to existing functionality while improving search engine visibility and user experience.
