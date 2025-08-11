import { Influencer, SearchParams } from '@/types';
import api from '../api';

export const influencerActions = {
  getInfluencers: async (params?: SearchParams): Promise<Influencer[]> => {
    const response = await api.get('/influencers', { params });
    return response.data;
  },
  
  getInfluencer: async (id: string): Promise<Influencer> => {
    const response = await api.get(`/influencers/${id}`);
    return response.data;
  }
};