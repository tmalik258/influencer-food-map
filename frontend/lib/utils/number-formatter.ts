export function formatNumberAbbreviated(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return 'N/A';
  }

  if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1);
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M';
    } else if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'K' : formatted + 'K';
  } else {
    return num.toLocaleString();
  }
}