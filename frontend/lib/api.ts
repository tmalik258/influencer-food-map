import axios from 'axios';

export { restaurantActions as restaurantApi } from './actions/restaurant-actions';
export { influencerActions as influencerApi } from './actions/influencer-actions';
export { listingActions as listingApi } from './actions/listing-actions';
export { googleReviewsActions as googleReviewsApi } from './actions/google-reviews-actions';

// Base API instance - still used by action files
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export default api;