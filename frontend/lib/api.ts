import axios, { AxiosError } from 'axios';

interface CustomAxiosError<T = unknown, D = unknown> extends AxiosError<T, D> {
  friendlyMessage?: string;
}
import { createClient } from '@/lib/utils/supabase/client';

export { restaurantActions as restaurantApi } from './actions/restaurant-actions';
export { influencerActions as influencerApi } from './actions/influencer-actions';
export { listingActions as listingApi } from './actions/listing-actions';
export { googleReviewsActions as googleReviewsApi } from './actions/google-reviews-actions';

// Base API instance - still used by action files
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Admin API instance for admin endpoints
export const adminApi = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
adminApi.interceptors.request.use(
  async (config) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to standardize error messages
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const axiosError = error as CustomAxiosError<{ detail?: string; message?: string } & Record<string, unknown>>;
    const detail = axiosError.response?.data?.detail;
    const fallback = axiosError.response?.data?.message;
    const friendlyMessage = detail || fallback || axiosError.message || 'Request failed';
    // Attach a friendly message for consumers
    axiosError.friendlyMessage = friendlyMessage;
    // Also override the default message to make catch(err.message) useful
    axiosError.message = friendlyMessage;
    return Promise.reject(axiosError);
  }
);

export default api;