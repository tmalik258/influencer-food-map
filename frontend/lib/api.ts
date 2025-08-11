// @deprecated - Use individual action files from @/lib/actions instead
// This file is kept for backward compatibility

import axios from 'axios';

// Re-export actions for backward compatibility
export { restaurantActions as restaurantApi } from './actions/restaurant-actions';
export { influencerActions as influencerApi } from './actions/influencer-actions';
export { listingActions as listingApi } from './actions/listing-actions';

// Base API instance - still used by action files
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export default api;