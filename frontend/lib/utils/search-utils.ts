export function getSearchPlaceholder(searchType: string): string {
  switch (searchType) {
    case 'restaurant':
      return 'Search by restaurant name...';
    case 'city':
      return 'Search by city...';
    case 'tags':
      return 'Search by tags...';
    case 'name':
      return 'Search by influencer name...';
    case 'video':
      return 'Search by video name or description...';
    case 'all':
    default:
      return 'Search all fields...';
  }
}