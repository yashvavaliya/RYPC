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
        languageInstruction = `Write in natural Gujarati (Devanagari script). Place business name naturally in middle or end of sentences, never at start.`;
        break;
      case "Hindi":
        languageInstruction = `Write in natural Hindi (Devanagari script). Place business name naturally in middle or end of sentences, never at start.`;
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
          `${businessName} માં સેવા સારી નથી. કર્મચારીઓ પણ સહકારી નથી અને ગુણવત્તામાં સુધારાની જરૂર છે.`,
          `${businessName} થી નિરાશ થયો. અપેક્ષા કરતા ઓછી સેવા અને ઘણી સમસ્યાઓ ઉકેલાઈ નથી.`
        ],
        "Hindi": [
          `${businessName} में सेवा अच्छी नहीं थी। हमारी अपेक्षाएं पूरी नहीं हुईं और स्टाफ भी सहायक नहीं था।`,
          `${businessName} की सेवा से निराश हुआ। गुणवत्ता और व्यवस्था दोनों में सुधार की जरूरत है।`
        ]
      },
      2: {
        "English": [
          `Experience was okay at ${businessName} but had some problems. Staff tried to help but there's room for improvement.`,
          `Mixed feelings about ${businessName}. Some aspects were good but several issues need attention and better service quality.`
        ],
        "Gujarati": [
          `${businessName} માં અનુભવ સારો હતો પણ કેટલીક સમસ્યાઓ હતી। સ્ટાફે મદદ કરવાનો પ્રયાસ કર્યો પણ સુધારાની જરૂર છે.`,
          `${businessName} માં મિશ્ર અનુભવ રહ્યો। કેટલીક વસ્તુઓ સારી હતી પણ સુધારાની જરૂર છે.`
        ],
        "Hindi": [
          `${businessName} में अनुभव ठीक था लेकिन कुछ समस्याएं थीं। स्टाफ ने मदद की कोशिश की लेकिन सुधार की जरूरत है।`,
          `${businessName} में मिला-जुला अनुभव रहा। कुछ चीजें अच्छी थीं लेकिन सुधार की गुंजाइश है।`
        ]
      },
      3: {
        "English": [
          `Average experience at ${businessName} with decent service. Some things were good, others could be better for overall satisfaction.`,
          `Standard service at ${businessName} that gets the job done. Nothing exceptional but meets basic requirements and expectations.`
        ],
        "Gujarati": [
          `${businessName} માં સામાન્ય અનુભવ રહ્યો। કેટલીક વસ્તુઓ સારી હતી, કેટલીક સુધારી શકાય છે.`,
          `${businessName} માં મધ્યમ સેવા મળી। કાંઈ ખાસ નથી પણ કામ ચાલી જાય એવું છે.`
        ],
        "Hindi": [
          `${businessName} में औसत अनुभव रहा। कुछ चीजें अच्छी थीं, कुछ बेहतर हो सकती थीं।`,
          `${businessName} में सामान्य सेवा मिली। कुछ खास नहीं लेकिन काम चल जाता है।`
        ]
      },
      4: {
        "English": [
          `Good experience at ${businessName} with professional service. Quality work and friendly staff, just minor wait time but overall excellent.`,
          `Really satisfied with ${businessName}. Great service quality and helpful staff exceeded our expectations. Highly recommend to others.`
        ],
        "Gujarati": [
          `${businessName} માં સારો અનુભવ રહ્યો। વ્યવસાયિક સેવા અને ગુણવત્તાયુક્ત કામ, માત્ર થોડી રાહ જોવવી પડી.`,
          `${businessName} માં ખૂબ સારી સેવા મળી। કર્મચારીઓ મદદગાર હતા અને કામ પણ સારું થયું.`
        ],
        "Hindi": [
          `${businessName} में अच्छा अनुभव रहा। प्रोफेशनल सेवा और क्वालिटी वर्क, बस थोड़ा इंतजार करना पड़ा।`,
          `${businessName} में बहुत अच्छी सेवा मिली। स्टाफ सहयोगी था और काम भी बेहतरीन हुआ।`
        ]
      },
      5: {
        "English": [
          `Excellent experience at ${businessName}! Professional service, quality work and friendly staff. Highly recommend for ${category.toLowerCase()}.`,
          `Outstanding service at ${businessName}. Top-notch quality and helpful staff exceeded all expectations. Will definitely return for sure.`
        ],
        "Gujarati": [
          `${businessName} માં શાનદાર અનુભવ રહ્યો! વ્યવસાયિક સેવા અને ઉત્તમ ગુણવત્તા. ખૂબ જ સારું કામ અને મિત્રતાપૂર્ણ સ્ટાફ.`,
          `${businessName} માં અપેક્ષાઓ થી વધુ સારું! ગુણવત્તાયુક્ત સેવા અને મદદગાર સ્ટાફ. ફરીથી આવીશ.`
        ],
        "Hindi": [
          `${businessName} में बेहतरीन अनुभव रहा! प्रोफेशनल सेवा और उत्कृष्ट गुणवत्ता। बहुत अच्छा काम और दोस्ताना स्टाफ।`,
          `${businessName} में उम्मीदों से बढ़कर सेवा मिली! गुणवत्तापूर्ण सेवा और सहयोगी स्टाफ। फिर से आऊंगा।`
        ]
      }
    };

    // Select random fallback from available options
    const ratingFallbacks = fallbacks[starRating] || fallbacks[5];
    const languageFallbacks = ratingFallbacks[language] || ratingFallbacks["English"];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    let selectedFallback = languageFallbacks[randomIndex];
    
    // Ensure fallback is within character limit
    if (selectedFallback.length > 170) {
      selectedFallback = selectedFallback.substring(0, 167) + '...';
    } else if (selectedFallback.length < 155) {
      // Pad with appropriate ending
      const paddings = language === 'English' ? [' Great!', ' Good.', ' Nice.'] : 
                     language === 'Hindi' ? [' बढ़िया!', ' अच्छा।', ' बेहतरीन।'] :
                     [' સારું!', ' બેસ્ટ।', ' ખૂબ સારું।'];
      while (selectedFallback.length < 155) {
        const padding = paddings[Math.floor(Math.random() * paddings.length)];
        if (selectedFallback.length + padding.length <= 170) {
          selectedFallback += padding;
        } else {
          break;
        }
      }
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