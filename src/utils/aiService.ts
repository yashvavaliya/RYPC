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
Customer specifically wants to highlight these services: ${selectedServices.join(', ')}
- Mention these services naturally in the review context
- Don't list them generically, weave them into the experience narrative
- Focus on how these specific aspects contributed to the ${starRating}-star experience
- Use authentic language that reflects real customer experience with these services`;
    }

    // Language-specific instructions
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write the review entirely in English.";
        break;
      case "Gujarati":
        languageInstruction = `Write the review entirely in Gujarati using English transliteration. 
        IMPORTANT: Do NOT start the sentence with the business name "${businessName}". 
        The business name can appear in the middle or end of sentences, but never at the beginning.
        Example patterns: "Maru experience ${businessName} ma khub saaru rahyu" or "Khub saari seva mali ${businessName} thi"`;
        break;
      case "Hindi":
        languageInstruction = `Write the review entirely in Hindi using English transliteration.
        IMPORTANT: Do NOT start the sentence with the business name "${businessName}".
        The business name can appear in the middle or end of sentences, but never at the beginning.
        Example patterns: "Mera anubhav ${businessName} mein bahut accha raha" or "Bahut acchi seva mili ${businessName} se"`;
        break;
    }

    // Tone instructions
    const toneInstructions = {
      'Professional': 'Use formal, professional language appropriate for business contexts.',
      'Friendly': 'Use warm, approachable language that feels personal and genuine.',
      'Casual': 'Use relaxed, informal language that sounds conversational and natural.',
      'Grateful': 'Use appreciative, thankful language that expresses genuine gratitude.'
    };

    // Use case instructions
    const useCaseInstructions = {
      'Customer review': 'Write from the perspective of a satisfied customer who used the service.',
      'Student feedback': 'Write from the perspective of a student or learner who benefited from the education/training.',
      'Patient experience': 'Write from the perspective of a patient who received medical care or treatment.'
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the ${category} category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${selectedTone} - ${toneInstructions[selectedTone]}
Use Case: ${selectedUseCase} - ${useCaseInstructions[selectedUseCase]}
${highlights ? `Customer highlights: ${highlights}` : ''}
${serviceInstructions}

Requirements:
- Each sentence should have different structure and approach
- Vary the placement of business name within sentences
- Use different emotional expressions and descriptive words
${selectedServices && selectedServices.length > 0 ? `- Naturally incorporate these service experiences: ${selectedServices.join(', ')}` : ''}
- ${languageInstruction}
- Create genuine, personal experiences that feel real
- Use specific details that make the review believable
- Ensure each generation is completely different from previous ones

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
    return this.getFallbackReview(request);
  }

  private getFallbackReview(request: ReviewRequest): GeneratedReview {
    const { businessName, category, type, selectedServices, starRating, language, tone } = request;
    const timestamp = Date.now();
    
    // Generate service-specific text
    let serviceText = '';
    if (selectedServices && selectedServices.length > 0) {
      if (selectedServices.length === 1) {
        serviceText = ` The ${selectedServices[0]} was particularly good.`;
      } else if (selectedServices.length === 2) {
        serviceText = ` The ${selectedServices[0]} and ${selectedServices[1]} were particularly good.`;
      } else {
        serviceText = ` The ${selectedServices.slice(0, 2).join(', ')} and other services were particularly good.`;
      }
    }
      
    const fallbacks: Record<number, Record<string, string[]>> = {
      1: {
        "English": [
          `Had a disappointing experience with the service quality. ${businessName} didn't meet our expectations and several issues weren't addressed properly.${serviceText}`,
          `The service was below average during our recent visit. Multiple problems occurred at ${businessName} that left us unsatisfied.${serviceText}`,
          `Quality of service was poor and staff seemed unprofessional. Not impressed with the overall experience at ${businessName}.${serviceText}`
        ],
        "Gujarati": [
          `Maru anubhav ${businessName} ma nirashajanak rahyo. Seva apeksha karta ochhi hati ane ghani samasyao ukelai nathi.`,
          `Seva sari nathi hati ${businessName} ma. Amari apekshao poori thai nathi ane karmachariyo pan sahkaari nathi.`,
          `Khub nirash thayo ${businessName} ni seva thi. Gunvatta ane vyavastha banne ma sudharani jarur chhe.`
        ],
        "Hindi": [
          `Mera anubhav ${businessName} mein niraashajanak raha. Seva umeed se kam thi aur kai samasyaon ka samaadhan nahi hua.`,
          `Seva achhi nahi thi ${businessName} mein. Hamari apekshaen poori nahi hui aur staff bhi sahayak nahi tha.`,
          `Bahut nirash hua ${businessName} ki seva se. Gunvatta aur vyavastha dono mein sudhaar ki zarurat hai.`
        ]
      },
      2: {
        "English": [
          `The experience was okay but had some problems. Staff at ${businessName} tried to help but there's definitely room for improvement.`,
          `Mixed feelings about our visit to ${businessName}. Some aspects were good but several issues need attention.`,
          `Service has potential but ${businessName} needs to work on quality and customer satisfaction.`
        ],
        "Gujarati": [
          `Anubhav saaru hatu pan ${businessName} ma ketlik samasyao hati. Staff-e madad karvano prayas karyo pan sudharani jarur chhe.`,
          `Mishr anubhav rahyo ${businessName} ma. Ketlik vastuo sari hati pan sudharani jarur chhe.`
        ],
        "Hindi": [
          `Anubhav theek tha lekin ${businessName} mein kuch samasyaayein thin. Staff ne madad karne ki koshish ki lekin sudhaar ki zarurat hai.`,
          `Mila-jula anubhav raha ${businessName} mein. Kuch cheezein acchi thin lekin sudhaar ki gunjaayish hai.`
        ]
      },
      3: {
        "English": [
          `Average experience with decent service quality. Some things were good at ${businessName}, others could be better overall.`,
          `Standard service that gets the job done. Nothing exceptional but ${businessName} meets basic requirements.`,
          `Okay experience that met basic expectations. Nothing stood out particularly at ${businessName} but it was acceptable.`
        ],
        "Gujarati": [
          `Saamanya anubhav rahyo ${businessName} ma. Ketlik vastuon saari hati, ketlik sudhari shakay.`,
          `Madhyam seva mali ${businessName} ma. Kai khaas nathi pan kaam chali jay evu.`
        ],
        "Hindi": [
          `Ausat anubhav raha ${businessName} mein. Kuch cheezein acchi thin, kuch behtar ho sakti thin.`,
          `Saamaanya seva mili ${businessName} mein. Kuch khaas nahin lekin kaam chal jaata hai.`
        ]
      },
      4: {
        "English": [
          `Good experience with professional service and quality work. Just a minor wait time at ${businessName} but overall excellent.`,
          `Really satisfied with the great service quality and friendly staff. Highly recommend ${businessName} to others.`,
          `Professional approach and excellent customer service exceeded expectations. Very happy with ${businessName}.`
        ],
        "Gujarati": [
          `Saaro anubhav rahyo ${businessName} ma. Vyavsayik seva ane gunvattayukt kaam, matra thodi raah jovvi padi.`,
          `Khub sari seva mali ${businessName} ma. Karmachariyo madadgar hata ane kaam pan saru thayo.`
        ],
        "Hindi": [
          `Accha anubhav raha ${businessName} mein. Professional service aur quality work, bas thoda intezaar karna pada.`,
          `Bahut acchi seva mili ${businessName} mein. Staff sahyogi tha aur kaam bhi behtareen hua.`
        ]
      },
      5: {
        "English": [
          `Great experience with professional ${type} service! Excellent quality and friendly staff at ${businessName}.${serviceText} Highly recommend for ${category.toLowerCase()}.`,
          `Quality ${type} service exceeded all expectations! Friendly staff and great experience at ${businessName}.${serviceText} Will definitely return.`,
          `Outstanding service and top-notch ${category.toLowerCase()} experience! Really impressed with ${businessName}.${serviceText} Absolutely recommended!`
        ],
        "Gujarati": [
          `Shaandaar anubhav rahyo ${businessName} ma! Vyavsayik ${type} ane uttam seva.${serviceText} ${category} mate bhalaman karu chhu.`,
          `Apekshaao thi vadhu saaru ${businessName} ma! Gunvattayukt seva ane mitratapurn staff.${serviceText} Farithi aavish.`
        ],
        "Hindi": [
          `Behtareen anubhav raha ${businessName} mein! Professional ${type} aur utkrist seva.${serviceText} ${category} ke liye sifarish karta hoon.`,
          `Ummeedon se badhkar seva mili ${businessName} mein! Gunvattaapoorn seva aur dostana staff.${serviceText} Phir se aaunga.`
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