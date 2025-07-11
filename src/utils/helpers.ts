export const generateSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const validateGoogleMapsUrl = (url: string): boolean => {
  const googleMapsPatterns = [
    /^https:\/\/maps\.google\.com/,
    /^https:\/\/www\.google\.com\/maps/,
    /^https:\/\/search\.google\.com\/local\/writereview/,
    /^https:\/\/goo\.gl\/maps/
  ];
  
  return googleMapsPatterns.some(pattern => pattern.test(url));
};