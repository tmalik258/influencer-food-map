import { Listing, SearchParams } from '@/lib/types';
import api from '../api';

export const listingActions = {
  getListings: async (params?: SearchParams): Promise<Listing[]> => {
    const response = await api.get('/listings', { params });
    return response.data;
  },
  
  getListing: async (id: string): Promise<Listing> => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },
  
  getListingsByRestaurant: async (restaurantId: string): Promise<Listing[]> => {
    const response = await api.get('/listings', { 
      params: { restaurant_id: restaurantId, approved_status: 'Approved' } 
    });
    return response.data;
  },
  
  getListingsByInfluencer: async (influencerId: string): Promise<Listing[]> => {
    const response = await api.get('/listings', { 
      params: { influencer_id: influencerId, approved_status: 'Approved' } 
    });
    return response.data;
  },
  
  getMostRecentListingByInfluencer: async (influencerId: string): Promise<Listing | null> => {
    const response = await api.get('/listings', { 
      params: { 
        influencer_id: influencerId, 
        approved: true,
        sort_by_published_date: true,
        limit: 1
      } 
    });
    return response.data.length > 0 ? response.data[0] : null;
  }
};