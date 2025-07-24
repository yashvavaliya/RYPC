import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ReviewRequest {
businessName: string;
category: string;
type: string;
highlights?: string;
selectedServices?: string[];
starRating: number;
language?: string;
tone?: 'Professional' | 'Friendly' | 'Casual' | 'Grateful';
useCase?: 'Customer review' | 'Student feedback' | 'Patient experience';
}

export interface GeneratedReview {
text: string;
hash: string;
language: string;
rating: number;
}

// Store used review hashes to prevent duplicates
const usedReviewHashes = new Set();

export class AIReviewService {
private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

private generateHash(content: string): string {
let hash = 0;
for (let i = 0; i < content.length; i++) {
const char = content.charCodeAt(i);
hash = ((hash << 5) - hash) + char;
hash = hash & hash;
}
return Math.abs(hash).toString(36);
}

private isReviewUnique(content: string): boolean {
const hash = this.generateHash(content);
return !usedReviewHashes.has(hash);
}

private markReviewAsUsed(content: string): void {
const hash = this.generateHash(content);
usedReviewHashes.add(hash);
}

async generateReview(request: ReviewRequest, maxRetries: number = 5): Promise {
const { businessName, category, type, highlights, selectedServices, starRating, language, tone, useCase } = request;
  const sentimentGuide = {
  1: "Very negative, expressing frustration and dissatisfaction with specific issues",
  2: "Below average experience, mentioning problems but being constructive",
  3: "Mixed or neutral review with both positive and negative aspects",
  4: "Positive experience with good aspects, maybe one small downside",
  5: "Enthusiastic and praise-worthy, fully satisfied customer"
};

const languageOptions = ["English", "Gujarati", "Hindi"];
const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];
const selectedTone = tone || 'Friendly';
const selectedUseCase = useCase || 'Customer review';
const variabilitySeed = Math.floor(Math.random() * 10000);

let serviceInstructions = '';
if (selectedServices && selectedServices.length > 0) {
  serviceInstructions = `\nNaturally mention these aspects: ${selectedServices.join(', ')}`;
}

let languageInstruction = "";
switch (selectedLanguage) {
  case "English":
    languageInstruction = "Write in natural English like a local customer would.";
    break;
  case "Gujarati":
    languageInstruction = `Write the review entirely in Gujarati. Use English transliteration. Place business name naturally in middle or end of sentences, never at start.`;
    break;
  case "Hindi":
    languageInstruction = `Write the review entirely in Hindi. Use English transliteration. Place business name naturally in middle or end of sentences, never at start.`;
    break;
}

const getBusinessContext = (category: string, type: string) => {
  const contexts = {
    'Food & Beverage': 'food quality, taste, ambiance, service, seating, staff behavior',
    'Health & Medical': 'doctor consultation, staff care, cleanliness, waiting time, treatment',
    'Education': 'teaching quality, facilities, staff, environment, learning experience',
    'Services': 'service quality, staff behavior, timeliness, value for money',
    'Retail & Shopping': 'product variety, pricing, staff help, store ambiance',
    'Hotels & Travel': 'room comfort, service, location, amenities, staff',
    'Entertainment & Recreation': 'experience, facilities, crowd management, value',
    'Professional Businesses': 'expertise, professionalism, service delivery, communication'
  };
  return contexts[category] || 'service quality, staff, experience, value';
};

for (let attempt = 0; attempt < maxRetries; attempt++) {
  const businessContext = getBusinessContext(category, type);
  const prompt = `You are generating natural-sounding Google Map reviews in short form (total 155 to 170 characters only). The review must feel like it's written by a local customer.
  Business: "${businessName}" (${type} in ${category})
Rating: ${starRating}/5 stars
Language: ${selectedLanguage}
Random seed: ${variabilitySeed}${serviceInstructions}

Rules:

Review must have a total character count between 155 and 170 only.

${languageInstruction}

Randomly use 1, 2, or 3 sentences (never more).

Sound natural, avoid fake-sounding phrases or forced keywords.

Be realistic and regionally authentic (not robotic or generic).

Mention specific elements like: ${businessContext} based on the business type.

Avoid repetition or fixed structure.

Use varied sentence structures and vocabulary.

Maintain proper punctuation, no hashtags or emojis.

Avoid overuse of superlatives unless natural.

Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}

Generate ONLY the review text (no quotes or formatting):`;

   try {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const reviewText = response.text().trim();
    const charCount = reviewText.length;

    if (charCount >= 155 && charCount <= 170 && this.isReviewUnique(reviewText)) {
      this.markReviewAsUsed(reviewText);
      return {
        text: reviewText,
        hash: this.generateHash(reviewText),
        language: selectedLanguage,
        rating: starRating
      };
    }
  } catch (error) {
    console.error(`AI Review Generation Error (attempt ${attempt + 1}):`, error);
  }
}

return this.getFallbackReview(request);
  }

private getFallbackReview(request: ReviewRequest): GeneratedReview {
const { businessName, category, type, starRating, language } = request;
const timestamp = Date.now();
  const fallback: GeneratedReview = {
  text: `${businessName} maṁ shāndār anubhav rahyo! Vyavsayik sevā ane uttam guṇvattā. Khuba j saru kam ane mitratapurn staff.`,
  hash: this.generateHash(`${businessName}-${timestamp}`),
  language: language || 'Gujarati',
  rating: starRating
};

return fallback;

  }

async generateTagline(businessName: string, category: string, type: string): Promise {
const prompt = `Generate a catchy, professional tagline for "${businessName}" which is a ${type} in the ${category} category.

Requirements:

Keep it under 8 words

Make it memorable and professional

Reflect the business type and category

Use action words or emotional appeal

Avoid clichés like "Your trusted partner"

Make it unique and specific to the business

Return only the tagline, no quotes or extra text.`;

  try {
  const result = await this.model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
} catch (error) {
  console.error('Tagline generation error:', error);
  return 'Quality You Can Trust';
}

  }

clearUsedHashes(): void {
usedReviewHashes.clear();
}

getUsageStats(): { totalGenerated: number } {
return {
totalGenerated: usedReviewHashes.size
};
}
}

export const aiService = new AIReviewService();

