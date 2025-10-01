// Test script to verify slug functionality
const axios = require('axios');

const API_BASE = 'http://localhost:8030/api';

async function testSlugFunctionality() {
  console.log('Testing slug functionality...');
  
  try {
    // Test 1: Get restaurant by slug
    console.log('\n1. Testing restaurant by slug...');
    const restaurantBySlug = await axios.get(`${API_BASE}/restaurants/slug/test-restaurant`);
    console.log('Restaurant by slug:', restaurantBySlug.data);
    
    // Test 2: Get influencer by slug
    console.log('\n2. Testing influencer by slug...');
    const influencerBySlug = await axios.get(`${API_BASE}/influencers/slug/test-influencer`);
    console.log('Influencer by slug:', influencerBySlug.data);
    
    // Test 3: Get all restaurants (to see slugs)
    console.log('\n3. Testing all restaurants...');
    const allRestaurants = await axios.get(`${API_BASE}/restaurants`);
    console.log('All restaurants:', allRestaurants.data.map(r => ({ name: r.name, slug: r.slug })));
    
    // Test 4: Get all influencers (to see slugs)
    console.log('\n4. Testing all influencers...');
    const allInfluencers = await axios.get(`${API_BASE}/influencers`);
    console.log('All influencers:', allInfluencers.data.map(i => ({ name: i.name, slug: i.slug })));
    
  } catch (error) {
    console.error('Error testing slugs:', error.response?.data || error.message);
  }
}

testSlugFunctionality();