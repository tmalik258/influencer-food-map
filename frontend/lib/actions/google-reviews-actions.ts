import { GoogleReviewsResponse } from "@/lib/types/google-reviews";
import api from "../api";

export const googleReviewsActions = {
  /**
   * Get Google Reviews for a restaurant by place ID
   */
  async getGoogleReviews(placeId: string): Promise<GoogleReviewsResponse> {
    try {
      const response = await api.get('/google-reviews/', {
        params: {
          place_id: placeId,
        },
      });
      console.log('Google Reviews Response:', response.data.result);
      return response.data.result;
    } catch (error) {
      console.error(`Error fetching Google reviews for place ${placeId}:`, error);
      throw error;
    }
  },
};