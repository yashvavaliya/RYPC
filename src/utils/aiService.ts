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
const usedReviewHashes = new Set<string>();

export class AIReviewService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    const { businessName, category, type, highlights, selectedServices, starRating, language, tone, useCase } = request;

    // Enhanced sentiment guide with more nuanced descriptions
    const sentimentGuide = {
      1: "Disappointed and frustrated, mentioning specific problems that affected the experience negatively",
      2: "Below expectations with some issues, but acknowledging effort while pointing out areas needing improvement",
      3: "Balanced perspective with both positive and negative aspects, realistic and fair assessment",
      4: "Satisfied and pleased with good service, minor suggestions for improvement, would recommend",
      5: "Extremely happy and impressed, exceptional experience that exceeded expectations, enthusiastic recommendation"
    };

    // Enhanced language options
    const languageOptions = [
      "English",
      "Gujarati",
      "Hindi", 
    ];
    
    const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || 'Friendly';
    const selectedUseCase = useCase || 'Customer review';

    // Enhanced service-specific instructions
    let serviceInstructions = '';
    if (selectedServices && selectedServices.length > 0) {
      const shuffledServices = [...selectedServices].sort(() => Math.random() - 0.5);
      const selectedCount = Math.min(3, shuffledServices.length);
      const servicesToMention = shuffledServices.slice(0, selectedCount);
      serviceInstructions = `
Focus on these specific aspects naturally: ${servicesToMention.join(', ')}. 
Mention them in different ways - some as direct experience, others as observations.`;
    }

    // Enhanced language-specific instructions
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write in natural, conversational English like a genuine local customer. Use varied sentence structures and authentic expressions.";
        break;
      case "Gujarati":
        languageInstruction = `Write entirely in Gujarati using English transliteration. Use natural Gujarati expressions and sentence patterns. Vary sentence structure - some short, some longer. Place business name naturally within sentences, never at the beginning.`;
        break;
      case "Hindi":
        languageInstruction = `Write entirely in Hindi using English transliteration. Use authentic Hindi expressions and varied sentence structures. Mix formal and informal tone naturally. Place business name organically within sentences, avoid starting with it.`;
        break;
    }

    // Enhanced business-specific context with more detailed aspects
    const getBusinessContext = (category: string, type: string, businessName: string) => {
      const contexts = {
        'Food & Beverage': 'food quality, taste, presentation, ambiance, service speed, staff friendliness, cleanliness, value for money, seating comfort',
        'Health & Medical': 'doctor expertise, consultation quality, staff care, facility cleanliness, waiting time, treatment effectiveness, equipment quality, follow-up care, billing transparency',
        'Education': 'teaching methodology, faculty knowledge, infrastructure, learning environment, student support, practical training, placement assistance',
        'Services': 'service quality, staff professionalism, timeliness, problem resolution, value for money, customer support, follow-up service',
        'Retail & Shopping': 'product variety, quality, pricing, staff assistance, store layout, billing process, return policy, customer service',
        'Hotels & Travel': 'room comfort, cleanliness, service quality, location convenience, amenities, staff behavior, value for money',
        'Entertainment & Recreation': 'experience quality, facilities, crowd management, safety, value for money, staff support, cleanliness',
        'Professional Businesses': 'expertise level, professionalism, service delivery, communication, timeliness, problem-solving, client handling'
      };
      
      // Special handling for Smit Hospital
      if (businessName.toLowerCase().includes('smit') && businessName.toLowerCase().includes('hospital')) {
        return 'gynecological care, maternity services, doctor expertise, staff compassion, facility cleanliness, consultation quality, delivery experience, prenatal care, medical equipment, patient comfort, treatment effectiveness';
      }
      
      return contexts[category] || 'service quality, staff behavior, overall experience, value for money';
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const businessContext = getBusinessContext(category, type, businessName);
      
      // Generate random structural elements for variety
      const reviewStructures = [
        "experience_first", "recommendation_first", "specific_detail_first", 
        "comparison_based", "story_telling", "direct_feedback"
      ];
      const selectedStructure = reviewStructures[Math.floor(Math.random() * reviewStructures.length)];
      
      // Generate random writing styles
      const writingStyles = [
        "conversational", "descriptive", "concise", "enthusiastic", 
        "analytical", "personal", "professional"
      ];
      const selectedStyle = writingStyles[Math.floor(Math.random() * writingStyles.length)];
      
      const prompt = `You are generating authentic, natural-sounding Google Maps reviews that feel completely human-written. Each review must be unique in structure, vocabulary, and approach.

BUSINESS DETAILS:
Name: "${businessName}" 
Type: ${type} in ${category}
Context: ${businessContext}
Rating: ${starRating}/5 stars
Language: ${selectedLanguage}
Writing Style: ${selectedStyle}
Review Structure: ${selectedStructure}
${serviceInstructions}

CRITICAL REQUIREMENTS:
- EXACT character count: 150-200 characters (including spaces and punctuation)
- ${languageInstruction}
- Write like a real person sharing their genuine experience
- Use varied sentence structures (mix short and long sentences)
- Include specific, believable details that show personal experience
- Avoid generic phrases, templates, or AI-like patterns
- Use natural, conversational language with regional authenticity
- Vary vocabulary - don't repeat words or phrases from previous reviews
- Include realistic imperfections in language (like real people write)
- Mention specific aspects: ${businessContext}
- NO hashtags, NO emojis, NO excessive punctuation
- Make each review structurally different from others
- Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}

UNIQUENESS REQUIREMENTS:
- Never use the same opening or closing phrases
- Vary sentence patterns and word choices completely
- Create different narrative approaches each time
- Use different ways to express similar sentiments
- Avoid repetitive structures or templates

Generate ONLY the review text (no quotes, formatting, or explanations):`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const reviewText = response.text().trim();

        // Enhanced validation
        const charCount = reviewText.length;
        console.log(`Attempt ${attempt + 1}: Generated review (${charCount} chars): "${reviewText}"`);
        
        // Validate character count and uniqueness
        if (charCount >= 150 && charCount <= 200 && this.isReviewUnique(reviewText)) {
          this.markReviewAsUsed(reviewText);
          console.log(`✅ Review accepted: ${charCount} characters, unique content`);
          return {
            text: reviewText,
            hash: this.generateHash(reviewText),
            language: selectedLanguage,
            rating: starRating
          };
        }

        console.log(`❌ Review rejected: ${charCount < 150 || charCount > 200 ? 'Invalid length' : 'Not unique'}, retrying...`);
      } catch (error) {
        console.error(`AI Review Generation Error (attempt ${attempt + 1}):`, error);
      }
    }

    // Fallback to unique hardcoded review if all attempts fail
    return this.getFallbackReview(request);
  }

  private getFallbackReview(request: ReviewRequest): GeneratedReview {
    const { businessName, category, type, selectedServices, starRating, language, tone } = request;
    const timestamp = Date.now();
    
    // Enhanced fallback reviews with more variety and natural language
    const fallbacks: Record<number, Record<string, string[]>> = {
      1: {
        "English": [
          `Had issues with service at ${businessName}. Staff wasn't very helpful and waited too long. Expected better quality for what we paid.`,
          `Not satisfied with my visit to ${businessName}. Several problems came up and they didn't handle them well. Needs improvement.`,
          `Disappointing experience here. ${businessName} didn't meet expectations and service was below average. Won't be returning soon.`,
          `Faced multiple issues during my visit. Staff at ${businessName} seemed overwhelmed and couldn't resolve basic problems effectively.`
        ],
        "Gujarati": [
          `${businessName} ma seva thodi kharab lagi. Staff pan jyada madad nathi karyu ane wait karvanu padyu. Sudharani jarur chhe.`,
          `Yahan experience saaru nathi rahyu. ${businessName} ma ketlik samasyao hati ane solve nathi thai. Better expect karyu hatu.`,
          `Niraash thayo visit ma. Service quality achhi nathi ane staff pan responsive nathi. Improvement ni jarur chhe.`
        ],
        "Hindi": [
          `${businessName} mein service theek nahi thi. Staff se madad nahi mili aur kaafi wait karna pada. Better expected tha.`,
          `Yahan ka experience disappointing raha. Kuch problems hui jo properly handle nahi hui. Improvement ki zarurat hai.`,
          `Visit se satisfied nahi hua. ${businessName} ki service average se niche lagi. Staff bhi jyada helpful nahi tha.`
        ]
      },
      2: {
        "English": [
          `Average experience at ${businessName}. Some things were good but faced a few issues. Staff tried helping but could be better organized.`,
          `Mixed feelings about my visit. ${businessName} has potential but needs to work on service quality. Some aspects were decent though.`,
          `Okay service overall but room for improvement. Had some problems but staff was trying their best. Expected slightly better.`,
          `Decent place but not exceptional. ${businessName} handled most things well but few areas need attention. Would give another chance.`
        ],
        "Gujarati": [
          `${businessName} ma experience average rahyo. Kuch cheejo saari hati pan kuch problems pan hati. Staff try karyu pan better ho sake.`,
          `Mixed feelings chhe visit baad. Kuch aspects achha laga pan service ma improvement jarur chhe. Overall okay rahyu.`,
          `Decent service mili pan exceptional nathi. ${businessName} ma kuch areas ma sudharani jarur chhe. Phir se chance aapi sakiye.`
        ],
        "Hindi": [
          `${businessName} mein experience average raha. Kuch cheezein theek thi lekin kuch issues bhi the. Staff helpful tha but improve kar sakte.`,
          `Mixed experience raha yahan. Service decent thi but kuch areas mein better ho sakta hai. Overall okay tha visit.`,
          `Theek-thaak service mili. ${businessName} mein potential hai but thoda aur attention chahiye. Staff cooperative tha though.`
        ]
      },
      3: {
        "English": [
          `Good experience at ${businessName} overall. Service was decent and staff was helpful. Some minor areas could improve but satisfied with visit.`,
          `Pleasant visit here. ${businessName} provided good service and handled things well. Nothing extraordinary but met expectations nicely.`,
          `Decent service and friendly staff. ${businessName} managed everything properly. Average experience but would consider visiting again.`,
          `Fair experience with good aspects. Service quality was reasonable and staff was cooperative. ${businessName} did a decent job overall.`
        ],
        "Gujarati": [
          `${businessName} ma saaru experience rahyu. Service decent hati ane staff helpful hata. Kuch minor improvements ho sake pan overall satisfied.`,
          `Pleasant visit rahyu yahan. Good service mili ane properly handle karyu. Expectations meet thai gayi. Decent place chhe.`,
          `Fair experience hatu. ${businessName} ma service quality reasonable hati ane staff cooperative hata. Overall theek rahyu.`
        ],
        "Hindi": [
          `${businessName} mein achha experience raha. Service decent thi aur staff helpful tha. Kuch areas improve ho sakte but overall satisfied.`,
          `Pleasant visit tha yahan. Good service mili aur properly handle kiya. Expectations meet hui. Decent place hai.`,
          `Fair experience tha overall. Service quality reasonable thi aur staff cooperative tha. ${businessName} ne decent job kiya.`
        ]
      },
      4: {
        "English": [
          `Really good experience at ${businessName}! Professional service and quality work. Staff was friendly and helpful. Minor wait but totally worth it.`,
          `Excellent service here. ${businessName} exceeded expectations with great staff and quality. Definitely recommend to others. Very satisfied!`,
          `Impressed with the service quality. ${businessName} handled everything professionally. Friendly staff and good experience overall. Will return!`,
          `Great visit! Professional team at ${businessName} provided excellent service. Quality work and helpful staff. Highly recommend this place.`
        ],
        "Gujarati": [
          `${businessName} ma khub saaru experience rahyu! Professional service ane quality work. Staff friendly ane helpful hata. Recommend karis.`,
          `Excellent service mili yahan. ${businessName} expectations exceed karyu great staff sathe. Definitely recommend karis others ne.`,
          `Impressed thayo service quality thi. Professional team ane excellent service. Friendly staff ane good experience. Will return!`
        ],
        "Hindi": [
          `${businessName} mein bahut achha experience raha! Professional service aur quality work. Staff friendly aur helpful tha. Recommend karunga.`,
          `Excellent service mili yahan. ${businessName} ne expectations exceed kiye great staff ke saath. Definitely recommend others ko.`,
          `Impressed hua service quality se. Professional team aur excellent service. Friendly staff aur good experience. Will return!`
        ]
      },
      5: {
        "English": [
          `Outstanding experience at ${businessName}! Exceptional service quality and amazing staff. Everything was perfect. Highly recommend to everyone!`,
          `Absolutely fantastic! ${businessName} provided excellent service with professional staff. Quality work and great experience. Will definitely return!`,
          `Superb service and wonderful staff! ${businessName} exceeded all expectations. Professional, friendly, and top-quality. Highly recommended place!`,
          `Amazing experience here! ${businessName} delivered exceptional service with caring staff. Everything was handled perfectly. 5 stars deserved!`
        ],
        "Gujarati": [
          `${businessName} ma outstanding experience rahyu! Exceptional service quality ane amazing staff. Sab perfect hatu. Highly recommend!`,
          `Absolutely fantastic! ${businessName} excellent service provide karyu professional staff sathe. Quality work ane great experience!`,
          `Superb service ane wonderful staff! ${businessName} expectations exceed karyu. Professional, friendly ane top-quality. Highly recommended!`
        ],
        "Hindi": [
          `${businessName} mein outstanding experience raha! Exceptional service quality aur amazing staff. Sab perfect tha. Highly recommend!`,
          `Absolutely fantastic! ${businessName} ne excellent service provide kiya professional staff ke saath. Quality work aur great experience!`,
          `Superb service aur wonderful staff! ${businessName} ne expectations exceed kiye. Professional, friendly aur top-quality. Highly recommended!`
        ]
      }
    };

    // Enhanced fallback selection with more randomization
    const ratingFallbacks = fallbacks[starRating] || fallbacks[5];
    const languageFallbacks = ratingFallbacks[language] || ratingFallbacks["English"];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    let selectedFallback = languageFallbacks[randomIndex];
    
    // Add timestamp-based variation to ensure uniqueness
    const variations = [
      '', ' Really good!', ' Worth it!', ' Satisfied!', ' Great place!', ' Recommended!'
    ];
    const variation = variations[timestamp % variations.length];
    
    // Ensure character limit
    if ((selectedFallback + variation).length <= 200) {
      selectedFallback += variation;
    }
    
    return {
      text: selectedFallback,
      hash: this.generateHash(selectedFallback + timestamp),
      language: language || 'English',
      rating: starRating
    };
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