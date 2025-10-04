# Listing Search and Filtering Refactoring - Technical Documentation

## 1. Current State Analysis

### Frontend Implementation Issues

* **Client-side filtering only**: The current `listing-management.tsx` performs all filtering on the frontend

* **No pagination support**: The `useListings` hook doesn't support pagination parameters

* **Manual data transformation**: Listings are manually transformed from API response format to dashboard format

* **Performance issues**: All listings are fetched and filtered client-side, causing performance degradation with large datasets

### Current Code Structure

```typescript
// Current frontend filtering in listing-management.tsx
const filteredListings = transformedListings.filter(listing => {
  const matchesSearch = !searchTerm || 
    (listing.restaurant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.influencer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.video?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesStatus = statusFilter === 'all' || 
    (statusFilter === 'approved' && listing.status === 'approved') ||
    (statusFilter === 'rejected' && listing.status === 'rejected') ||
    (statusFilter === 'pending' && listing.status === 'pending');
  
  return matchesSearch && matchesStatus;
});
```

## 2. Target State (Following Videos Pattern)

### Backend Responsibilities

* **Server-side filtering**: All search and status filtering handled by backend

* **Pagination support**: Proper skip/limit pagination with total count

* **Search optimization**: Database-level search with proper indexing

* **Response standardization**: Consistent response format with pagination metadata

### Frontend Responsibilities

* **Pagination UI**: Use `CustomPagination` component for consistent UX

* **Filter state management**: Manage filter states and trigger backend requests

* **Loading states**: Proper skeleton loading during data fetching

* **Error handling**: Consistent error display and retry mechanisms

## 3. Implementation Plan

### Phase 1: Backend API Enhancement

#### 3.1.1 Update Listings Route (`backend/app/routes/listings.py`)

Add pagination and filtering support following the videos pattern:

```python
from typing import Optional
from pydantic import BaseModel

class PaginatedListingsResponse(BaseModel):
    listings: List[ListingResponse]
    total: int

@router.get("/", response_model=PaginatedListingsResponse)
async def get_listings(
    db: AsyncSession = Depends(get_async_db),
    # Search filters
    search: Optional[str] = None,
    restaurant_name: Optional[str] = None,
    influencer_name: Optional[str] = None,
    video_title: Optional[str] = None,
    # Status filters
    approved: Optional[bool] = None,
    status: Optional[str] = None,  # 'approved', 'rejected', 'pending', 'all'
    # Pagination
    page: int = 1,
    limit: int = 10,
    # Sorting
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    # Existing filters
    id: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    video_id: Optional[str] = None,
    influencer_id: Optional[str] = None,
):
    """Get listings with search, filtering, and pagination support."""
```

#### 3.1.2 Update Admin Listings Route (`backend/app/routes/admin/listings.py`)

Add admin-specific pagination endpoint:

```python
@admin_listings_router.get("/paginated/", response_model=PaginatedListingsResponse)
async def get_paginated_listings(
    # ... same parameters as above
    db: AsyncSession = Depends(get_async_db),
    current_admin=Depends(get_current_admin)
):
    """Get paginated listings for admin dashboard."""
```

### Phase 2: Frontend Hook Enhancement

#### 3.2.1 Create New useListings Hook (`frontend/lib/hooks/useListings.ts`)

Replace current implementation with pagination support:

```typescript
interface PaginatedListingsParams {
  search?: string;
  restaurant_name?: string;
  influencer_name?: string;
  video_title?: string;
  approved?: boolean;
  status?: 'approved' | 'rejected' | 'pending' | 'all';
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useListings = (initialParams?: PaginatedListingsParams) => {
  const [data, setData] = useState<PaginatedListingsResponse>({
    listings: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedListingsParams>({
    page: 1,
    limit: 10,
    status: 'all',
    ...initialParams
  });

  // Same pattern as useVideos
  const fetchListings = useCallback(async (searchParams?: PaginatedListingsParams) => {
    // Implementation following useVideos pattern
  }, [params]);

  // Pagination methods
  const setPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setLimit = useCallback((limit: number) => {
    updateParams({ limit, page: 1 });
  }, [updateParams]);

  // Filter methods
  const setSearchTerm = useCallback((search: string) => {
    updateParams({ search, page: 1 });
  }, [updateParams]);

  const setStatusFilter = useCallback((status: string) => {
    updateParams({ status, page: 1 });
  }, [updateParams]);

  return {
    listings: data.listings,
    totalCount: data.total,
    totalPages: data.totalPages,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    refetch: () => fetchListings(params)
  };
};
```

### Phase 3: Frontend Component Updates

#### 3.3.1 Update ListingManagement Component

Replace current implementation with pagination support:

```typescript
export function ListingManagement() {
  const {
    listings,
    totalCount,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    refetch,
  } = useListings({
    page: 1,
    limit: 10,
    status: 'all',
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setLimit(newItemsPerPage);
  };

  // Handle filter changes
  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  // Remove client-side filtering - backend handles it now
  return (
    <div className="space-y-6">
      {/* Filters component */}
      <ListingFilters
        searchTerm={params.search || ''}
        statusFilter={params.status || 'all'}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      {/* Table component */}
      <ListingTable
        listings={listings}
        loading={loading}
        // Pass pagination props
        currentPage={params.page || 1}
        totalItems={totalCount}
        itemsPerPage={params.limit || 10}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
```

#### 3.3.2 Update ListingTable Component

Add pagination support to the table:

```typescript
interface ListingTableProps {
  listings: ListingDashboard[];
  loading?: boolean;
  // Pagination props
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  // Action props
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ListingTable({
  listings,
  loading = false,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: ListingTableProps) {
  // Add pagination component at the bottom
  return (
    <>
      {/* Table content */}
      <CustomPagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
        loading={loading}
      />
    </>
  );
}
```

## 4. Technical Implementation Details

### 4.1 API Parameters

#### Request Parameters

| Parameter        | Type    | Description                                                   | Default       |
| ---------------- | ------- | ------------------------------------------------------------- | ------------- |
| search           | string  | Global search across restaurant, influencer, video names      | -             |
| restaurant\_name | string  | Filter by restaurant name                                     | -             |
| influencer\_name | string  | Filter by influencer name                                     | -             |
| video\_title     | string  | Filter by video title                                         | -             |
| approved         | boolean | Filter by approval status                                     | -             |
| status           | string  | Status filter: 'approved', 'rejected', 'pending', 'all'       | 'all'         |
| page             | number  | Page number for pagination                                    | 1             |
| limit            | number  | Items per page                                                | 10            |
| sort\_by         | string  | Sort field: 'created\_at', 'visit\_date', 'confidence\_score' | 'created\_at' |
| sort\_order      | string  | Sort direction: 'asc', 'desc'                                 | 'desc'        |

#### Response Format

```json
{
  "listings": [
    {
      "id": "uuid",
      "restaurant": { "id": "uuid", "name": "string", ... },
      "video": { "id": "uuid", "title": "string", ... },
      "influencer": { "id": "uuid", "name": "string", ... },
      "visit_date": "2024-01-01",
      "quotes": ["string"],
      "confidence_score": 0.95,
      "approved": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### 4.2 Database Query Optimization

#### Indexing Strategy

```sql
-- Create indexes for search performance
CREATE INDEX idx_listings_approved ON listings(approved);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_influencers_name ON influencers(name);
CREATE INDEX idx_videos_title ON videos(title);

-- Composite index for common queries
CREATE INDEX idx_listings_search ON listings(approved, created_at);
```

#### Query Implementation

```python
# Optimized query with joins and filters
query = select(Listing).options(
    joinedload(Listing.restaurant),
    joinedload(Listing.video),
    joinedload(Listing.influencer)
)

# Apply search filters
if search:
    query = query.join(Restaurant).join(Video).join(Influencer)
    query = query.filter(
        or_(
            Restaurant.name.ilike(f"%{search}%"),
            Influencer.name.ilike(f"%{search}%"),
            Video.title.ilike(f"%{search}%")
        )
    )

# Apply status filters
if status and status != 'all':
    if status == 'approved':
        query = query.filter(Listing.approved == True)
    elif status == 'rejected':
        query = query.filter(Listing.approved == False)
    elif status == 'pending':
        query = query.filter(Listing.approved == None)

# Apply sorting
if sort_by == 'created_at':
    order_col = Listing.created_at
elif sort_by == 'visit_date':
    order_col = Listing.visit_date
else:
    order_col = Listing.created_at

if sort_order == 'asc':
    query = query.order_by(order_col.asc())
else:
    query = query.order_by(order_col.desc())

# Get total count
total_query = query.with_only_columns([func.count(Listing.id)])
total = await db.execute(total_query)
total_count = total.scalar()

# Apply pagination
query = query.offset((page - 1) * limit).limit(limit)
```

## 5. Files to Modify

### Backend Files

1. **`backend/app/api_schema/listings.py`**

   * Add `PaginatedListingsResponse` schema

   * Update response models

2. **`backend/app/routes/listings.py`**

   * Update `get_listings` endpoint with pagination

   * Add search and filtering logic

   * Implement proper query optimization

3. **`backend/app/routes/admin/listings.py`**

   * Add `get_paginated_listings` endpoint

   * Implement admin-specific filtering

### Frontend Files

1. **`frontend/lib/hooks/useListings.ts`**

   * Replace current implementation with pagination support

   * Follow `useVideos` pattern exactly

2. **`frontend/app/dashboard/listings/_components/listing-management.tsx`**

   * Remove client-side filtering

   * Add pagination state management

   * Integrate with new hook

3. **`frontend/app/dashboard/listings/_components/listing-table.tsx`**

   * Add pagination component integration

   * Update props interface

4. **`frontend/lib/actions/listing-actions.ts`**

   * Update API calls to support pagination parameters

   * Handle new response format

5. **`frontend/lib/types/dashboard.ts`**

   * Update `ListingTableProps` interface

   * Add pagination-related types

## 6. Consistency Check for Other Entities

### Tags, Cuisines, and Restaurants

Apply the same pagination pattern to:

* **Tags dashboard**: `app/dashboard/tags/`

* **Cuisines dashboard**: `app/dashboard/cuisines/`

* **Restaurants dashboard**: `app/dashboard/restaurants/`

Each should follow the exact same pattern:

1. Backend pagination endpoint
2. Frontend hook with pagination support
3. Integration with `CustomPagination` component
4. Consistent API parameter naming

## 7. Testing Strategy

### Unit Tests

* Backend API endpoint testing

* Frontend hook testing

* Component integration testing

### Integration Tests

* End-to-end pagination flow

* Filter and search functionality

* Performance testing with large datasets

### Performance Metrics

* Query execution time < 100ms

* API response time < 500ms

* Frontend render time < 200ms

## 8. Migration Strategy

### Phase 1: Backend Implementation

1. Create new pagination endpoints
2. Test with manual API calls
3. Ensure backward compatibility

### Phase 2: Frontend Implementation

1. Create new hook alongside existing one
2. Test with new backend endpoints
3. Gradual component migration

### Phase 3: Full Migration

1. Replace old implementation
2. Remove deprecated code
3. Update all references

## 9. Error Handling

### Backend Errors

```python
try:
    # Query execution
    result = await db.execute(query)
    listings = result.scalars().unique().all()
    
    if not listings and page > 1:
        raise HTTPException(status_code=404, detail="Page not found")
        
except HTTPException:
    raise
except Exception as e:
    logger.error(f"Error fetching listings: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Frontend Errors

```typescript
const fetchListings = useCallback(async (searchParams?: PaginatedListingsParams) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await listingActions.getPaginatedListings(searchParams || params);
    setData(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch listings';
    setError(errorMessage);
    toast.error('Error', { description: errorMessage });
  } finally {
    setLoading(false);
  }
}, [params]);
```

This comprehensive refactoring will significantly improve performance, user experience, and maintainability by moving the heavy lifting to the backend while maintaining a consistent pattern across all dashboard entities.
