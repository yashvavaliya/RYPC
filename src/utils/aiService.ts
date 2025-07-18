import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCH-yvMejD3Ugv40gmM-DcVKyxVJ4xJBm0';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ReviewRequest {
  businessName: string;
  category: string;
  type: string;
  highlights?: string;
  selectedServices?: string[];
  starRating: number;
  language?: string;
  tone?: 'Professional' | 'Friendly';
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
      "English + Gujarati",
      "English + Hindi",
      "Hindi + Gujarati"
    ];
    
    const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || 'Friendly';
    const selectedUseCase = useCase || 'Customer review';

    // Language-specific instructions
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write the review entirely in English.";
        break;
      case "Gujarati":
        languageInstruction = "Write the review entirely in Gujarati. use English transliteration.";
        break;
      case "Hindi":
        languageInstruction = "Write the review entirely in Hindi script. use English transliteration.";
        break;
      case "English + Gujarati":
        languageInstruction = "Write the review with one sentence in English followed by one sentence in Gujarati script (ગુજરાતી). Do NOT use transliteration.";
        break;
      case "English + Hindi":
        languageInstruction = "Write the review with one sentence in English followed by one sentence in Hindi script (हिंदी). Do NOT use transliteration.";
        break;
      case "Hindi + Gujarati":
        languageInstruction = "Write the review with one sentence in Hindi script (हिंदी) followed by one sentence in Gujarati script (ગુજરાતી). Do NOT use transliteration.";
        break;
    }

    // Tone instructions
    const toneInstructions = {
      'Professional': 'Use formal, professional language appropriate for business contexts.',
      'Friendly': 'Use warm, approachable language that feels personal and genuine.',
    };

    // Use case instructions
    const useCaseInstructions = {
      'Customer review': 'Write from the perspective of a satisfied customer who used the service.',
      'Student feedback': 'Write from the perspective of a student or learner who benefited from the education/training.',
      'Patient experience': 'Write from the perspective of a patient who received medical care or treatment.'
    };

    // Build service-specific instructions
    let serviceInstructions = '';
    if (selectedServices && selectedServices.length > 0) {
      serviceInstructions = `
Customer specifically wants to highlight these services: ${selectedServices.join(', ')}
- Mention these services naturally in the review context
- Don't list them generically, weave them into the experience narrative
- Focus on how these specific aspects contributed to the ${starRating}-star experience
- Use authentic language that reflects real customer experience with these services`;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the ${category} category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${selectedTone} - ${toneInstructions[selectedTone]}
Use Case: ${selectedUseCase} - ${useCaseInstructions[selectedUseCase]}
${highlights ? `Customer highlights: ${highlights}` : ''}
${serviceInstructions}

Requirements:
- Write 2-5 sentences maximum
- Sound natural and human-like with regional authenticity
- Match the ${starRating}-star sentiment exactly
- Be specific to the business type (${type}) and category (${category})
- Use realistic customer language for ${selectedUseCase}
- No fake exaggeration, keep it credible and locally relevant
- Don't mention the star rating in the text
- Make it unique - avoid common phrases or structures
- Use varied sentence structures and vocabulary
${highlights ? `- Try to incorporate these highlights naturally: ${highlights}` : ''}
${selectedServices && selectedServices.length > 0 ? `- Naturally incorporate these service experiences: ${selectedServices.join(', ')}` : ''}
- ${languageInstruction}
- For mixed languages, ensure both languages flow naturally together
- Use authentic regional expressions and terminology
- Avoid generic templates or repetitive structures

Return only the review text, no quotes or extra formatting.`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const reviewText = response.text().trim();

        // Check if review is unique
        if (this.isReviewUnique(reviewText)) {
          this.markReviewAsUsed(reviewText);
          return {
            text: reviewText,
            hash: this.generateHash(reviewText),
            language: selectedLanguage,
            rating: starRating
          };
        }

        console.log(`Attempt ${attempt + 1}: Generated duplicate review, retrying...`);
      } catch (error) {
        console.error(`AI Review Generation Error (attempt ${attempt + 1}):`, error);
      }
    }

    // Fallback to unique hardcoded review if all attempts fail
    return this.getFallbackReview(businessName, starRating, selectedLanguage, selectedTone, selectedServices);
  }

    selectedServices?: string[];
  private getFallbackReview(businessName: string, starRating: number, language: string, tone: string, selectedServices?: string[]): GeneratedReview {
    const timestamp = Date.now();
    const serviceText = selectedServices && selectedServices.length > 0 
      ? ` The ${selectedServices.slice(0, 2).join(' and ')} ${selectedServices.length === 1 ? 'was' : 'were'} particularly good.`
    const { businessName, category, type, selectedServices, starRating, language, tone } = request;
    const serviceText = selectedServices && selectedServices.length > 0 
      ? ` The ${selectedServices.slice(0, 2).join(' and ')} ${selectedServices.length === 1 ? 'was' : 'were'} particularly good.`
      : '';
      
    const fallbacks: Record<number, Record<string, string[]>> = {
      1: {
        "English": [
          `Had a disappointing experience at ${businessName}. The service was below expectations and several issues weren't addressed properly.${serviceText}`,
          `Unfortunately, ${businessName} didn't meet our standards. Multiple problems occurred during our visit that left us unsatisfied.${serviceText}`,
          `Not impressed with ${businessName}. The quality of service was poor and staff seemed unprofessional.${serviceText}`
        ],
        "Gujarati": [
          `${businessName} માં મારું અનુભવ નિરાશાજનક રહ્યો. સેવા અપેક્ષા કરતા ઓછી હતી અને ઘણી સમસ્યાઓ ઉકેલાઈ નહોતી.`,
          `${businessName} માં સેવા સારી નહોતી. અમારી અપેક્ષાઓ પૂરી થઈ નહીં અને કર્મચારીઓ પણ સહકારી નહોતા.`
        ],
        "Hindi": [
          `${businessName} में मेरा अनुभव निराशाजनक रहा। सेवा उम्मीद से कम थी और कई समस्याओं का समाधान नहीं हुआ।`,
          `${businessName} में सेवा अच्छी नहीं थी। हमारी अपेक्षाएं पूरी नहीं हुईं और स्टाफ भी सहयोगी नहीं था।`
        ]
      },
      2: {
        "English": [
          `${businessName} was okay but had some problems. The staff tried to help but there's definitely room for improvement.`,
          `Mixed experience at ${businessName}. Some aspects were good but several issues need attention.`,
          `${businessName} has potential but needs to work on service quality and customer satisfaction.`
        ],
        "Gujarati": [
          `${businessName} સારું હતું પણ કેટલીક સમસ્યાઓ હતી. સ્ટાફે મદદ કરવાનો પ્રયાસ કર્યો પણ સુધારાની જરૂર છે.`,
          `${businessName} માં મિશ્ર અનુભવ રહ્યો. કેટલીક વસ્તુઓ સારી હતી પણ સુધારાની જરૂર છે.`
        ],
        "Hindi": [
          `${businessName} ठीक था लेकिन कुछ समस्याएँ थीं। स्टाफ ने मदद करने की कोशिश की लेकिन सुधार की जरूरत है।`,
          `${businessName} में मिला-जुला अनुभव रहा। कुछ चीजें अच्छी थीं लेकिन सुधार की गुंजाइश है।`
        ]
      },
      3: {
        "English": [
          `Average experience at ${businessName}. Some things were good, others could be better. Decent overall.`,
          `${businessName} provides standard service. Nothing exceptional but gets the job done.`,
          `Okay experience at ${businessName}. Met basic expectations but nothing stood out particularly.`
        ],
        "Gujarati": [
          `${businessName} માં સામાન્ય અનુભવ રહ્યો. કેટલીક વસ્તુઓ સારી હતી, કેટલીક સુધારી શકાય.`,
          `${businessName} માં મધ્યમ સેવા મળી. કંઈ ખાસ નહીં પણ કામ ચાલી જાય એવું.`
        ],
        "Hindi": [
          `${businessName} में औसत अनुभव रहा। कुछ चीजें अच्छी थीं, कुछ बेहतर हो सकती थीं।`,
          `${businessName} में सामान्य सेवा मिली। कुछ खास नहीं लेकिन काम चल जाता है।`
        ]
      },
      4: {
        "English": [
          `Good experience at ${businessName}. Professional service and quality work, just a minor wait time.`,
          `Really satisfied with ${businessName}. Great service quality and friendly staff. Highly recommend.`,
          `${businessName} exceeded expectations. Professional approach and excellent customer service.`
        ],
        "Gujarati": [
          `${businessName} માં સારો અનુભવ રહ્યો. વ્યાવસાયિક સેવા અને ગુણવત્તાયુક્ત કામ, માત્ર થોડી રાહ જોવી પડી.`,
          `${businessName} માં ખૂબ સારી સેવા મળી. કર્મચારીઓ મદદગાર હતા અને કામ પણ સારું થયું.`
        ],
        "Hindi": [
          `${businessName} में अच्छा अनुभव रहा। प्रोफेशनल सर्विस और क्वालिटी वर्क, बस थोड़ा इंतजार करना पड़ा।`,
          `${businessName} में बहुत अच्छी सेवा मिली। स्टाफ सहयोगी था और काम भी बेहतरीन हुआ।`
        ]
      },
      5: {
        "English": [
          `Great experience at ${businessName}! Professional ${type} with excellent service.${serviceText} Highly recommend for ${category.toLowerCase()}.`,
          `${businessName} exceeded expectations! Quality ${type} service with friendly staff.${serviceText} Will definitely return.`,
          `Outstanding ${type}! ${businessName} provides top-notch ${category.toLowerCase()} service.${serviceText} Five stars!`
        ],
        "Gujarati": [
          `${businessName} માં શાનદાર અનુભવ! વ્યાવસાયિક ${type} અને ઉત્તમ સેવા.${serviceText} ${category} માટે ભલામણ કરું છું.`,
          `${businessName} અપેક્ષાઓથી વધુ સારું! ગુણવત્તાયુક્ત સેવા અને મિત્રતાપૂર્ણ સ્ટાફ.${serviceText} ફરીથી આવીશ.`
        ],
        "Hindi": [
          `${businessName} में बेहतरीन अनुभव! प्रोफेशनल ${type} और उत्कृष्ट सेवा.${serviceText} ${category} के लिए सिफारिश करता हूं.`,
          `${businessName} ने उम्मीदों से बढ़कर सेवा दी! गुणवत्तापूर्ण सेवा और दोस्ताना स्टाफ.${serviceText} फिर से आऊंगा.`
        ]
      }
    };

    // Select random fallback from available options
    const ratingFallbacks = fallbacks[starRating] || fallbacks[5];
    const languageFallbacks = ratingFallbacks[language] || ratingFallbacks["English"];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    const selectedFallback = languageFallbacks[randomIndex];
    
    // Make it unique by adding timestamp-based variation
    const uniqueFallback = `${selectedFallback} (${timestamp})`.replace(` (${timestamp})`, '');
    
    return {
      text: uniqueFallback,
      hash: this.generateHash(uniqueFallback + timestamp),
      language: language,
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