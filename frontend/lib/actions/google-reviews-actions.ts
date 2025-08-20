import api from "../api";

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  rating: number;
  user_ratings_total: number;
  place_id: string;
}

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
      return response.data;
    } catch (error) {
      console.error(`Error fetching Google reviews for place ${placeId}:`, error);
      throw error;
    }
  },
};