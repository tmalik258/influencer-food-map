# Frontend Architecture Documentation

## Overview

This document describes the refactored frontend architecture that follows a clean separation of concerns pattern with actions and custom hooks.

## Architecture Pattern

### Actions Layer (`/lib/actions/`)

The actions layer contains pure API service functions organized by domain:

- **`restaurant-actions.ts`** - Restaurant-related API calls
- **`influencer-actions.ts`** - Influencer-related API calls  
- **`listing-actions.ts`** - Listing-related API calls
- **`index.ts`** - Barrel export for all actions

#### Benefits:
- **Single Responsibility**: Each file handles one domain
- **Reusability**: Actions can be used across different components
- **Testability**: Pure functions are easy to unit test
- **Maintainability**: Clear separation makes code easier to maintain

### Hooks Layer (`/lib/hooks/`)

Custom hooks provide state management and side effects for components:

- **`useRestaurants.ts`** - Restaurant data fetching and state management
- **`useInfluencers.ts`** - Influencer data fetching and state management
- **`useListings.ts`** - Listing data fetching and state management
- **`index.ts`** - Barrel export for all hooks

#### Features:
- **Loading States**: Automatic loading state management
- **Error Handling**: Centralized error handling
- **Caching**: Built-in state caching
- **Refetch**: Easy data refetching capabilities

## File Structure

```
frontend/
├── lib/
│   ├── actions/
│   │   ├── restaurant-actions.ts
│   │   ├── influencer-actions.ts
│   │   ├── listing-actions.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useRestaurants.ts
│   │   ├── useInfluencers.ts
│   │   ├── useListings.ts
│   │   └── index.ts
│   └── api.ts (deprecated, kept for backward compatibility)
├── app/
│   ├── restaurants/
│   │   ├── page.tsx (uses useRestaurants, useListings)
│   │   └── [id]/page.tsx (uses useRestaurant, useRestaurantListings)
│   ├── influencers/
│   │   ├── page.tsx (uses useInfluencers, useListings)
│   │   └── [id]/page.tsx (uses useInfluencer, useInfluencerListings)
│   └── page.tsx (homepage)
└── types/
    └── index.ts
```

## Usage Examples

### Using Actions Directly

```typescript
import { restaurantActions } from '@/lib/actions';

// Fetch restaurants by city
const restaurants = await restaurantActions.searchRestaurantsByCity('New York');
```

### Using Custom Hooks

```typescript
import { useRestaurants } from '@/lib/hooks';

function RestaurantsPage() {
  const { restaurants, loading, error, searchByCity } = useRestaurants();
  
  const handleSearch = (city: string) => {
    searchByCity(city);
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {restaurants.map(restaurant => (
        <div key={restaurant.id}>{restaurant.name}</div>
      ))}
    </div>
  );
}
```

## Available Hooks

### Restaurant Hooks
- `useRestaurants(params?)` - Fetch multiple restaurants
- `useRestaurant(id)` - Fetch single restaurant by ID

### Influencer Hooks
- `useInfluencers(params?)` - Fetch multiple influencers
- `useInfluencer(id)` - Fetch single influencer by ID

### Listing Hooks
- `useListings(params?)` - Fetch multiple listings
- `useListing(id)` - Fetch single listing by ID
- `useRestaurantListings(restaurantId)` - Fetch listings for a restaurant
- `useInfluencerListings(influencerId)` - Fetch listings for an influencer

## Hook Return Values

All hooks return a consistent interface:

```typescript
{
  data: T | T[], // The fetched data
  loading: boolean, // Loading state
  error: string | null, // Error message if any
  refetch: () => void, // Function to refetch data
  // Additional methods specific to each hook
}
```

## Migration Guide

### From Old API Pattern

**Before:**
```typescript
import { restaurantApi } from '@/lib/api';

const [restaurants, setRestaurants] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await restaurantApi.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**After:**
```typescript
import { useRestaurants } from '@/lib/hooks';

const { restaurants, loading, error } = useRestaurants();
```

## Benefits of New Architecture

1. **Reduced Boilerplate**: Custom hooks eliminate repetitive state management code
2. **Better Error Handling**: Centralized error handling in hooks
3. **Improved Performance**: Built-in loading states and caching
4. **Enhanced Developer Experience**: Cleaner, more readable component code
5. **Better Testing**: Separated concerns make unit testing easier
6. **Scalability**: Easy to add new domains and extend functionality

## Best Practices

1. **Use Hooks in Components**: Always prefer hooks over direct action calls in components
2. **Actions for Utilities**: Use actions directly in utility functions or middleware
3. **Error Boundaries**: Implement error boundaries to catch hook errors
4. **Loading States**: Always handle loading states in UI
5. **Consistent Naming**: Follow the established naming conventions

## Future Enhancements

- **Query Caching**: Implement React Query or SWR for advanced caching
- **Optimistic Updates**: Add optimistic update patterns
- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: Add offline-first capabilities