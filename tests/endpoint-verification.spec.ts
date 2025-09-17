import { test, expect } from '@playwright/test';

test.describe('API Endpoint Verification', () => {
  const BASE_URL = 'http://localhost:8030';

  test('should verify /cuisines endpoint returns empty array', async ({ request }) => {
    // Test cuisines endpoint without city filter
    const response = await request.get(`${BASE_URL}/cuisines/?limit=100`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
    
    console.log('Cuisines endpoint (no filter):', data);
  });

  test('should verify /cuisines endpoint with city filter returns empty array', async ({ request }) => {
    // Test cuisines endpoint with city filter
    const response = await request.get(`${BASE_URL}/cuisines/?limit=100&city=Ho Chi Minh City`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
    
    console.log('Cuisines endpoint (with city filter):', data);
  });

  test('should verify /restaurants endpoint returns data with cuisine associations', async ({ request }) => {
    // Test restaurants endpoint
    const response = await request.get(`${BASE_URL}/restaurants/?limit=3`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify restaurant data structure
    const restaurant = data[0];
    expect(restaurant).toHaveProperty('id');
    expect(restaurant).toHaveProperty('name');
    expect(restaurant).toHaveProperty('address');
    expect(restaurant).toHaveProperty('city');
    expect(restaurant).toHaveProperty('cuisines');
    expect(restaurant).toHaveProperty('tags');
    
    // Check if cuisines field exists (currently null in all entries)
    expect(restaurant.cuisines).toBeNull();
    
    // Verify tags array contains cuisine-like information
    expect(Array.isArray(restaurant.tags)).toBe(true);
    if (restaurant.tags.length > 0) {
      const tag = restaurant.tags[0];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('name');
      expect(typeof tag.name).toBe('string');
    }
    
    console.log('Restaurant data structure:', {
      id: restaurant.id,
      name: restaurant.name,
      cuisines: restaurant.cuisines,
      tags: restaurant.tags?.map(tag => tag.name) || []
    });
  });

  test('should verify data relationships between restaurants and cuisines', async ({ request }) => {
    // Get restaurants data
    const restaurantsResponse = await request.get(`${BASE_URL}/restaurants/?limit=10`);
    const restaurants = await restaurantsResponse.json();
    
    // Get cuisines data
    const cuisinesResponse = await request.get(`${BASE_URL}/cuisines/?limit=100`);
    const cuisines = await cuisinesResponse.json();
    
    console.log('Analysis Results:');
    console.log(`- Total restaurants: ${restaurants.length}`);
    console.log(`- Total cuisines: ${cuisines.length}`);
    
    // Check if any restaurant has populated cuisines field
    const restaurantsWithCuisines = restaurants.filter(r => r.cuisines !== null && r.cuisines.length > 0);
    console.log(`- Restaurants with cuisines: ${restaurantsWithCuisines.length}`);
    
    // Analyze tags as alternative cuisine information
    const allTags = restaurants.flatMap(r => r.tags || []);
    const uniqueTagNames = [...new Set(allTags.map(tag => tag.name))];
    console.log(`- Unique tag names (cuisine-like): ${uniqueTagNames.slice(0, 10).join(', ')}${uniqueTagNames.length > 10 ? '...' : ''}`);
    
    // Verify the current state: cuisines endpoint is empty, restaurants use tags for cuisine info
    expect(cuisines.length).toBe(0);
    expect(restaurantsWithCuisines.length).toBe(0);
    expect(uniqueTagNames.length).toBeGreaterThan(0);
  });
});