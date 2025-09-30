import api from "../api";

export async function getPexelsImageAction(query: string): Promise<{ image_url: string } | null> {
  try {
        const response = await api.get(`/pexels-images/`, {
          params: {
            query: encodeURIComponent(query)
          }
        });
    if (response.status === 200) {
      const data = response.data;
      return data;
    } else {
      console.error("Failed to fetch image from Pexels API:", response.statusText);
      return null;
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}