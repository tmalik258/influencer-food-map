/**
 * Frontend slug utility functions for SEO-friendly URLs
 */

/**
 * Generate a URL-friendly slug from a name
 * Converts "Joe's Pizza Place" to "joes-pizza-place"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a counter if needed
 * This is a client-side version for immediate URL generation
 */
export function generateUniqueSlug(name: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSlug(name);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Build a restaurant detail page URL using slug
 */
export function buildRestaurantUrl(slug: string): string {
  return `/restaurants/${slug}`;
}

/**
 * Build an influencer detail page URL using slug
 */
export function buildInfluencerUrl(slug: string): string {
  return `/influencers/${slug}`;
}

/**
 * Extract slug from a restaurant detail page URL
 */
export function extractSlugFromRestaurantUrl(url: string): string | null {
  const match = url.match(/^\/restaurants\/([^/]+)$/);
  return match ? match[1] : null;
}

/**
 * Extract slug from an influencer detail page URL
 */
export function extractSlugFromInfluencerUrl(url: string): string | null {
  const match = url.match(/^\/influencers\/([^/]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Sanitize a slug to ensure it's URL-safe
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove any non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate slug from restaurant data
 */
export function generateRestaurantSlug(restaurant: {
  name: string;
  city?: string;
  id?: string;
}): string {
  const baseSlug = generateSlug(restaurant.name);
  
  // If we have city, include it for better uniqueness
  if (restaurant.city) {
    const citySlug = generateSlug(restaurant.city);
    return `${baseSlug}-${citySlug}`;
  }
  
  return baseSlug;
}

/**
 * Generate slug from influencer data
 */
export function generateInfluencerSlug(influencer: {
  name: string;
  youtube_channel_id?: string;
  id?: string;
}): string {
  const baseSlug = generateSlug(influencer.name);
  
  // If we have YouTube channel ID, include a portion for uniqueness
  if (influencer.youtube_channel_id) {
    const channelPortion = influencer.youtube_channel_id.slice(-6);
    return `${baseSlug}-${channelPortion}`;
  }
  
  return baseSlug;
}