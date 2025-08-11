import { Listing, SearchParams } from '@/types';
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
  }
};