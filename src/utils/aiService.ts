import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfiguration } from '../types';
import { storage } from './storage';
import { smitHospitalInfo, smitHospitalServices } from './smitHospitalServices';

// OpenAI API interface
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

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
const usedReviewHashes = new Set<string>();

export class AIReviewService {
  private geminiClients: Map<string, GoogleGenerativeAI> = new Map();

  // Initialize AI client based on configuration
  private async initializeClient(config: ApiConfiguration): Promise<any> {
    if (config.provider === 'gemini') {
      if (!this.geminiClients.has(config.apiKey)) {
        this.geminiClients.set(config.apiKey, new GoogleGenerativeAI(config.apiKey));
      }
      return this.geminiClients.get(config.apiKey)!.getGenerativeModel({ model: config.model });
    }
    return null; // OpenAI will be handled differently
  }

  // Get active API configurations from database
  private async getActiveApiConfigs(): Promise<ApiConfiguration[]> {
    try {
      const configs = await storage.getApiConfigurations();
      return configs
        .filter(config => config.isActive && config.apiKey.trim())
        .sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Failed to get API configurations:', error);
      // Fallback to environment variable if database fails
      const fallbackKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (fallbackKey) {
        return [{
          id: 'fallback',
          name: 'Fallback Gemini',
          provider: 'gemini',
          apiKey: fallbackKey,
          model: 'gemini-2.0-flash',
          isActive: true,
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
      return [];
    }
  }

  // Generate content using Gemini API
  private async generateWithGemini(model: any, prompt: string): Promise<string> {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  // Generate content using OpenAI API
  private async generateWithOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing authentic, natural-sounding Google Maps reviews for healthcare facilities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  // Enhanced hash generation for better uniqueness detection
  private generateHash(content: string): string {
    // Normalize content by removing punctuation and converting to lowercase
    const normalized = content.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Enhanced uniqueness check with similarity detection
  private isReviewUnique(content: string): boolean {
    const hash = this.generateHash(content);
    if (usedReviewHashes.has(hash)) {
      return false;
    }
    
    // Check for similar content patterns
    const words = content.toLowerCase().split(/\s+/);
    const keyPhrases = this.extractKeyPhrases(content);
    
    // Store used phrases to avoid repetition
    for (const phrase of keyPhrases) {
      const phraseHash = this.generateHash(phrase);
      if (usedReviewHashes.has(`phrase_${phraseHash}`)) {
        return false;
      }
    }
    
    return true;
  }

  // Extract key phrases from review content
  private extractKeyPhrases(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const phrases: string[] = [];
    
    // Extract 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
      if (i < words.length - 2) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }
    
    return phrases;
  }

  // Enhanced marking system
  private markReviewAsUsed(content: string): void {
    const hash = this.generateHash(content);
    usedReviewHashes.add(hash);
    
    // Also mark key phrases as used
    const keyPhrases = this.extractKeyPhrases(content);
    for (const phrase of keyPhrases) {
      const phraseHash = this.generateHash(phrase);
      usedReviewHashes.add(`phrase_${phraseHash}`);
    }
  }

  async generateReview(request: ReviewRequest, maxRetries: number = 5): Promise<GeneratedReview> {
    // Force all reviews to be for Smit Hospital only
    const businessName = "Smit Hospital";
    const category = "Health & Medical";
    const type = "Gynecological Hospital";
    const { highlights, selectedServices, starRating, language, tone, useCase } = request;

    // Get active API configurations
    const apiConfigs = await this.getActiveApiConfigs();
    if (apiConfigs.length === 0) {
      throw new Error('No active API configurations found. Please configure APIs in admin panel.');
    }

    // Smit Hospital specific context from smit-hospital.txt
    const smitContext = `
Smit Hospital is a well-established Gynecological Hospital in Varachha, Surat with 15+ years of experience.
Led by Dr. Vitthal F. Patel (M.B., D.G.O.), Dr. Vishal Savani, and Mrs. Reena V. Patel.
Over 1 lakh patient consultations and 6000+ successful deliveries.
Specializes in normal, painless, and cesarean deliveries, high-risk pregnancies.
Offers comprehensive gynecological services, IVF treatments, and unique wellness programs.
Known for advanced sonography systems, modern equipment, and compassionate care.
Features Garbh Sanskar Program, menopause guidance, adolescent counseling, and physiotherapy.
Provides ethical, transparent, patient-first approach in a homely environment.
`;

    // Generate unique review structures
    const reviewStructures = [
      "personal_experience_narrative",
      "service_quality_focus", 
      "doctor_staff_appreciation",
      "facility_equipment_highlight",
      "delivery_experience_story",
      "comprehensive_care_review",
      "wellness_program_mention",
      "family_support_emphasis"
    ];
    
    const selectedStructure = reviewStructures[Math.floor(Math.random() * reviewStructures.length)];

    const selectedLanguage = language || 'English';
    const selectedTone = tone || 'Friendly';

    // Service-specific instructions based on Smit Hospital offerings
    let serviceInstructions = '';
    if (selectedServices && selectedServices.length > 0) {
      const shuffledServices = [...selectedServices].sort(() => Math.random() - 0.5);
      const selectedCount = Math.min(3, shuffledServices.length);
      const servicesToMention = shuffledServices.slice(0, selectedCount);
      serviceInstructions = `
Naturally incorporate these specific Smit Hospital services: ${servicesToMention.join(', ')}. 
Mention them as authentic patient experiences based on Smit Hospital's actual offerings.`;
    }

    // Language-specific instructions for Smit Hospital reviews
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write in natural, conversational English like a genuine Smit Hospital patient. Use varied sentence structures and authentic gynecological care expressions.";
        break;
      case "Gujarati":
        languageInstruction = `Write entirely in Gujarati script with English transliteration. Use natural Gujarati expressions for gynecological care experiences at Smit Hospital. Vary sentence structure naturally.`;
        break;
      case "Hindi":
        languageInstruction = `Write entirely in Hindi script with English transliteration. Use authentic Hindi expressions for women's healthcare experiences at Smit Hospital. Mix formal and informal tone naturally.`;
        break;
    }


    // Try each API configuration until one works
    for (const apiConfig of apiConfigs) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const prompt = `You are generating authentic, natural-sounding Google Maps reviews specifically for Smit Hospital. Each review must be completely unique with different structure and feel human-written by a real patient.

SMIT HOSPITAL CONTEXT:
${smitContext}

REVIEW DETAILS:
Rating: ${starRating}/5 stars
Language: ${selectedLanguage}
Unique Structure: ${selectedStructure}
${serviceInstructions}

CRITICAL REQUIREMENTS:
- EXACT character count: 155-170 characters only
- No excessive punctuation or emojis
- ${languageInstruction}
- Write like a real Smit Hospital patient sharing genuine gynecological care experience
- Include specific, believable details about Smit Hospital services
- Avoid generic phrases or AI-like patterns
- Use natural, conversational language
- Base content ONLY on Smit Hospital information provided
- NO hashtags, NO generic medical terms
- Each review must have completely different structure and approach

UNIQUENESS REQUIREMENTS:
- Never repeat sentence patterns or phrases
- Create completely different narrative approaches each time
- Use varied ways to express Smit Hospital experiences
- Make each review structurally and contextually unique

Generate ONLY the review text based exclusively on Smit Hospital information (no quotes, formatting, or explanations):`;

        try {
          let reviewText = '';
          
          if (apiConfig.provider === 'gemini') {
            const model = await this.initializeClient(apiConfig);
            reviewText = await this.generateWithGemini(model, prompt);
          } else if (apiConfig.provider === 'openai') {
            reviewText = await this.generateWithOpenAI(apiConfig.apiKey, apiConfig.model, prompt);
          }

          // Enhanced validation
          const charCount = reviewText.length;
          console.log(`${apiConfig.name} - Attempt ${attempt + 1}: Generated review (${charCount} chars): "${reviewText}"`);
          
          // Validate character count and uniqueness
          if (charCount >= 155 && charCount <= 170 && this.isReviewUnique(reviewText)) {
            this.markReviewAsUsed(reviewText);
            console.log(`✅ Review accepted from ${apiConfig.name}: ${charCount} characters, unique content`);
            return {
              text: reviewText,
              hash: this.generateHash(reviewText),
              language: selectedLanguage,
              rating: starRating
            };
          }

          console.log(`❌ Review rejected from ${apiConfig.name}: ${charCount < 155 || charCount > 170 ? 'Invalid length' : 'Not unique'}, retrying...`);
        } catch (error) {
          console.error(`${apiConfig.name} Error (attempt ${attempt + 1}):`, error);
          // Continue to next attempt or next API
        }
      }
    }

    // If all APIs fail, throw error instead of using fallback
    throw new Error('Unable to generate unique review. Please try again.');
  }



  // Generate tagline for medical business
  async generateTagline(businessName: string, category: string, type: string): Promise<string> {
    const apiConfigs = await this.getActiveApiConfigs();
    
    const prompt = `Generate a professional, caring tagline for "Smit Hospital" which is a Gynecological Hospital in Varachha, Surat.

Based on Smit Hospital's 15+ years of experience, 6000+ successful deliveries, and comprehensive women's healthcare services:

Requirements:
- Keep it under 8 words
- Focus on gynecological care, maternity, and women's health
- Make it warm and professional
- Reflect Smit Hospital's values of compassionate care
- Avoid clichés

Return only the tagline, no quotes or extra text.`;

    // Try each API configuration
    for (const apiConfig of apiConfigs) {
      try {
        if (apiConfig.provider === 'gemini') {
          const model = await this.initializeClient(apiConfig);
          return await this.generateWithGemini(model, prompt);
        } else if (apiConfig.provider === 'openai') {
          return await this.generateWithOpenAI(apiConfig.apiKey, apiConfig.model, prompt);
        }
      } catch (error) {
        console.error(`Tagline generation error with ${apiConfig.name}:`, error);
        continue;
      }
    }

    // Fallback medical taglines
    const smitHospitalTaglines = [
      'Caring for Women, Always',
      'Your Trusted Maternity Partner',
      'Excellence in Women\'s Healthcare',
      'Compassionate Gynecological Care',
      'Where Motherhood Begins Safely'
    ];
      
    return smitHospitalTaglines[Math.floor(Math.random() * smitHospitalTaglines.length)];
  }



  // Generate tagline for business
  async generateTagline(businessName: string, category: string, type: string): Promise<string> {
    const prompt = `Generate a catchy, professional tagline for "${businessName}" which is a ${type} in the ${category} category.

Requirements:
- Keep it under 8 words
- Make it memorable and professional
- Reflect the business type and category
- Use action words or emotional appeal
- Avoid clichés like "Your trusted partner"
- Make it unique and specific to the business

Return only the tagline, no quotes or extra text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Tagline generation error:', error);
      // Fallback taglines based on category
      const fallbackTaglines: Record<string, string[]> = {
        'Services': ['Excellence in Every Service', 'Your Service Solution', 'Quality You Can Trust'],
        'Food & Beverage': ['Taste the Difference', 'Fresh & Delicious Always', 'Where Flavor Meets Quality'],
        'Health & Medical': ['Your Health, Our Priority', 'Caring for Your Wellness', 'Expert Care Always'],
        'Education': ['Learning Made Easy', 'Knowledge for Success', 'Education Excellence'],
        'Professional Businesses': ['Professional Solutions', 'Expert Services', 'Business Excellence']
      };
      
      const categoryTaglines = fallbackTaglines[category] || fallbackTaglines['Services'];
      return categoryTaglines[Math.floor(Math.random() * categoryTaglines.length)];
    }
  }

  // Clear used hashes (for testing or reset)
  clearUsedHashes(): void {
    usedReviewHashes.clear();
  }

  // Get usage statistics
  getUsageStats(): { totalGenerated: number } {
    return {
      totalGenerated: usedReviewHashes.size
    };
  }
}

export const aiService = new AIReviewService();