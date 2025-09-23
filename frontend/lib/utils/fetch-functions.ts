import { restaurantActions } from '@/lib/actions/restaurant-actions';
import { videoActions } from '@/lib/actions/video-actions';
import { influencerActions } from '@/lib/actions/influencer-actions';
import { Influencer } from '../types';

export interface SelectOption {
  value: string;
  label: string;
  id: string;
}

export enum EntityType {
  RESTAURANT = 'restaurant',
  VIDEO = 'video',
  INFLUENCER = 'influencer'
}

export const fetchFunctions = {
  [EntityType.RESTAURANT]: async (searchQuery: string): Promise<SelectOption[]> => {
    try {
      const response = await restaurantActions.getRestaurants({
        name: searchQuery,
        limit: 20,
        include_listings: false
      });
      
      return response.restaurants.map(restaurant => ({
        id: restaurant.id,
        value: restaurant.id,
        label: restaurant.name
      }));
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw new Error('Failed to fetch restaurants');
    }
  },

  [EntityType.VIDEO]: async (searchQuery: string): Promise<SelectOption[]> => {
    try {
      const response = await videoActions.getVideos({
        title: searchQuery,
        limit: 20
      });
      
      return response.map(video => ({
        id: video.id,
        value: video.id,
        label: video.title
      }));
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw new Error('Failed to fetch videos');
    }
  },

  [EntityType.INFLUENCER]: async (searchQuery: string): Promise<SelectOption[]> => {
    try {
      const response = await influencerActions.getInfluencers({
        name: searchQuery,
        limit: 20,
        include_listings: false,
        include_video_details: false
      });
      
      return response.influencers.map((influencer: Influencer) => ({
        id: influencer.id,
        value: influencer.id,
        label: influencer.name
      }));
    } catch (error) {
      console.error('Error fetching influencers:', error);
      throw new Error('Failed to fetch influencers');
    }
  }
};