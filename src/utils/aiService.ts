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

  // Generate a simple hash for review content
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Check if review is unique
  private isReviewUnique(content: string): boolean {
    const hash = this.generateHash(content);
    return !usedReviewHashes.has(hash);
  }

  // Mark review as used
  private markReviewAsUsed(content: string): void {
    const hash = this.generateHash(content);
    usedReviewHashes.add(hash);
  }

  async generateReview(request: ReviewRequest, maxRetries: number = 5): Promise<GeneratedReview> {
    const { businessName, category, type, highlights, selectedServices, starRating, language, tone, useCase } = request;

    const sentimentGuide = {
      1: "Very negative, expressing frustration and dissatisfaction with specific issues",
      2: "Below average experience, mentioning problems but being constructive",
      3: "Mixed or neutral review with both positive and negative aspects",
      4: "Positive experience with good aspects, maybe one small downside",
      5: "Enthusiastic and praise-worthy, fully satisfied customer"
    };

    // Language options and random selection logic
    const languageOptions = [
      "English",
      "Gujarati",
      "Hindi", 
    ];
    
    const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || 'Friendly';
    const selectedUseCase = useCase || 'Customer review';

    // Build service-specific instructions
    let serviceInstructions = '';
    if (selectedServices && selectedServices.length > 0) {
      serviceInstructions = `
Naturally mention these aspects: ${selectedServices.join(', ')}`;
    }

    // Language-specific instructions
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write in natural English like a local customer would.";
        break;
      case "Gujarati":
        languageInstruction = `Write the review entirely in Gujarati.use English transliteration. Place business name naturally in middle or end of sentences, never at start.`;
        break;
      case "Hindi":
        languageInstruction = `Write the review entirely in Hindi. use English transliteration. Place business name naturally in middle or end of sentences, never at start.`;
        break;
    }

    // Get business-specific context
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
${serviceInstructions}

Rules:
- Review must have a total character count between 155 and 170 only.
- ${languageInstruction}
- Randomly use 1, 2, or 3 sentences (never more).
- Sound natural, avoid fake-sounding phrases or forced keywords.
- Be realistic and regionally authentic (not robotic or generic).
- Mention specific elements like: ${businessContext} based on the business type.
- Avoid repetition or fixed structure.
- Maintain proper punctuation, no hashtags or emojis.
- Avoid overuse of superlatives like "amazing", "superb" unless it fits naturally.
- Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}

Generate ONLY the review text (no quotes or formatting):`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const reviewText = response.text().trim();

        // Check character count and uniqueness
        const charCount = reviewText.length;
        console.log(`Generated review: ${charCount} characters - "${reviewText}"`);
        
        if (charCount >= 155 && charCount <= 170 && this.isReviewUnique(reviewText)) {
          this.markReviewAsUsed(reviewText);
          return {
            text: reviewText,
            hash: this.generateHash(reviewText),
            language: selectedLanguage,
            rating: starRating
          };
        }

        console.log(`Attempt ${attempt + 1}: Review ${charCount} chars or duplicate, retrying...`);
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
    
    const fallbacks: Record<number, Record<string, string[]>> = {
      1: {
        "English": [
          `Service quality was poor at ${businessName}. Staff seemed unprofessional and several issues weren't addressed properly during our visit.`,
          `Disappointing experience at ${businessName}. Below average service and multiple problems that left us unsatisfied with the overall quality.`
        ],
        "Gujarati": [
  `${businessName} ma seva saari nathi. Karmachariyo pan sahkaari nathi ane gunvatta ma sudharani jarur chhe.`,
  `${businessName} thi niraash thayo. Apeksha karta ochhi seva ane ghani samasyao ukelai nathi.`
],

       "Hindi": [
  `${businessName} mein seva acchi nahi thi. Hamari apekshaayein poori nahi hui aur staff bhi sahayak nahi tha.`,
  `${businessName} ki seva se niraash hua. Gunwatta aur vyavastha dono mein sudhaar ki zarurat hai.`
]

      },
      2: {
        "English": [
          `Experience was okay at ${businessName} but had some problems. Staff tried to help but there's room for improvement.`,
          `Mixed feelings about ${businessName}. Some aspects were good but several issues need attention and better service quality.`
        ],
"Gujarati": [
  `${businessName} ma anubhav saaro hato pan ketlik samasyao hati. Staafe madad karvano prayatna karyo pan sudharaani jarur chhe.`,
  `${businessName} ma mishra anubhav rahyo. Ketlik vastuon saari hati pan sudharaani jarur chhe.`
]
,
        "Hindi": [
  `${businessName} mein anubhav theek tha lekin kuch samasyaayein thi. Staff ne madad ki koshish ki lekin sudhaar ki zarurat hai.`,
  `${businessName} mein mila-jula anubhav raha. Kuch cheezein achhi thi lekin sudhaar ki gunjaayish hai.`
]
      },
      3: {
        "English": [
          `Average experience at ${businessName} with decent service. Some things were good, others could be better for overall satisfaction.`,
          `Standard service at ${businessName} that gets the job done. Nothing exceptional but meets basic requirements and expectations.`
        ],
        Gujarati: [
    `${businessName} ma saamanya anubhav rahyo. Ketlik vastuō sārvī hatī, ketlik sudhārī śakāy chhe.`,
    `${businessName} ma madhyam seva maḷī. Kāin khās nathī paṇ kām chālī jāy evuṁ chhe.`
  ],
  Hindi: [
    `${businessName} mein aausat anubhav raha. Kuch cheezen achhi thiṁ, kuch behtar ho sakti thiṁ.`,
    `${businessName} mein saamaanya seva mili. Kuch khaas nahi lekin kaam chal jaata hai.`
  ]
      },
      4: {
        "English": [
          `Good experience at ${businessName} with professional service. Quality work and friendly staff, just minor wait time but overall excellent.`,
          `Really satisfied with ${businessName}. Great service quality and helpful staff exceeded our expectations. Highly recommend to others.`
        ],
        "Gujarati": [
    `${businessName} maan saaro anubhav rahyo. Vyavsayik seva ane gunvatta yukta kaam, maatra thodi raah jovavi padi.`,
    `${businessName} maan khub saari seva mali. Karmachariyo madadgar hata ane kaam pan saaru thayu.`
  ],
  "Hindi": [
    `${businessName} mein accha anubhav raha. Professional seva aur quality work, bas thoda intezaar karna pada.`,
    `${businessName} mein bahut achhi seva mili. Staff sahayogi tha aur kaam bhi behtareen hua.`
  ]
      },
      5: {
        "English": [
          `Excellent experience at ${businessName}! Professional service, quality work and friendly staff. Highly recommend for ${category.toLowerCase()}.`,
          `Outstanding service at ${businessName}. Top-notch quality and helpful staff exceeded all expectations. Will definitely return for sure.`
        ],
        "Gujarati": [
  `${businessName} maṁ shāndār anubhav rahyo! Vyavsayik sevā ane uttam guṇvattā. Khūbaj sāruṁ kām ane mitratāpūrṇ staff.`,
  `${businessName} māṁ apekṣāo thī vadhu sāruṁ! Guṇvattāyukt sevā ane madadgār staff. Farīthī āvīś.`
],

       "Hindi": [
  `${businessName} mein behtareen anubhav raha! Professional seva aur utkṛṣṭ gunvatta. Bahut acchā kām aur dostāna staff.`,
  `${businessName} mein ummīdon se baṛhkar seva milī! Gunvatta pūrṇ seva aur sahyogī staff. Phir se āūngā.`
]
      }
    };

    // Select random fallback from available options
    const ratingFallbacks = fallbacks[starRating] || fallbacks[5];
    const languageFallbacks = ratingFallbacks[language] || ratingFallbacks["English"];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    let selectedFallback = languageFallbacks[randomIndex];
    

    
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