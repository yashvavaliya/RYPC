export interface ReviewCard {
  id: string;
  businessName: string;
  category: string;
  type: string;
  description?: string;
  location?: string;
  services?: string[];
  slug: string;
  logoUrl: string;
  googleMapsUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConfiguration {
  id: string;
  name: string;
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewTemplates {
  openings: string[];
  qualities: string[];
  achievements: string[];
  endings: string[];
}

export interface ReviewVariations {
  connectors: string[];
  intensifiers: string[];
  timeframes: string[];
}