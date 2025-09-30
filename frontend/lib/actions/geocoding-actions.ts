import api from '../api';

export interface GeocodeRequest {
  address: string;
  city: string;
  country: string;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export const geocodingActions = {
  geocodeAddress: async (request: GeocodeRequest): Promise<GeocodeResponse> => {
    const response = await api.post('/geocoding/', request);
    return response.data;
  },
  
  geocodeAddressGet: async (address: string, city: string, country: string): Promise<GeocodeResponse> => {
    const response = await api.get('/geocoding/', {
      params: {
        address,
        city,
        country
      }
    });
    return response.data;
  }
};