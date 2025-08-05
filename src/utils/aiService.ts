import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfiguration } from '../types';
import { storage } from './storage';

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
    const { businessName, category, type, highlights, selectedServices, starRating, language, tone, useCase } = request;

    // Get active API configurations
    const apiConfigs = await this.getActiveApiConfigs();
    if (apiConfigs.length === 0) {
      throw new Error('No active API configurations found. Please configure APIs in admin panel.');
    }

    // Enhanced sentiment guide with more nuanced descriptions
    const sentimentGuide = {
      1: "Disappointed with medical care, mentioning specific issues with treatment, staff, or facilities",
      2: "Below expectations with some medical/service issues, but acknowledging staff effort",
      3: "Balanced medical experience with both positive and areas for improvement",
      4: "Satisfied with medical care, good doctors and staff, would recommend",
      5: "Exceptional medical care, outstanding doctors and staff, highly recommend to others"
    };

    // Language options for medical reviews
    const languageOptions = [
      "English",
      "Gujarati",
      "Hindi", 
    ];
    
    const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || 'Friendly';
    const selectedUseCase = useCase || 'Customer review';

    // Medical service-specific instructions
    let serviceInstructions = '';
    if (selectedServices && selectedServices.length > 0) {
      const shuffledServices = [...selectedServices].sort(() => Math.random() - 0.5);
      const selectedCount = Math.min(3, shuffledServices.length);
      const servicesToMention = shuffledServices.slice(0, selectedCount);
      serviceInstructions = `
Focus on these medical aspects naturally: ${servicesToMention.join(', ')}. 
Mention them as patient experience - treatment quality, staff care, facility cleanliness, etc.`;
    }

    // Language-specific instructions for medical reviews
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write in natural, conversational English like a genuine patient. Use varied sentence structures and authentic medical experience expressions.";
        break;
      case "Gujarati":
        languageInstruction = `Write entirely in Gujarati script (ગુજરાતી). Use natural Gujarati expressions for medical experiences. Vary sentence structure. Place hospital name naturally within sentences, never at the beginning.`;
        break;
      case "Hindi":
        languageInstruction = `Write entirely in Hindi script (हिंदी). Use authentic Hindi expressions for medical experiences. Mix formal and informal tone naturally. Place hospital name organically within sentences, avoid starting with it.`;
        break;
    }

    // Medical context for SMIT Hospital
    const getMedicalContext = (businessName: string) => {
      if (businessName.toLowerCase().includes('smit')) {
        return 'gynecological care, maternity services, delivery experience, prenatal care, doctor expertise, nursing staff, facility cleanliness, consultation quality, medical equipment, patient comfort, treatment effectiveness, billing transparency, emergency handling';
      }
      return 'doctor expertise, consultation quality, staff care, facility cleanliness, waiting time, treatment effectiveness, medical equipment, patient comfort, billing transparency';
    };

    // Try each API configuration until one works
    for (const apiConfig of apiConfigs) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const medicalContext = getMedicalContext(businessName);
        
        // Generate random structural elements for variety
        const reviewStructures = [
          "patient_experience_first", "doctor_recommendation", "treatment_outcome", 
          "facility_quality", "staff_appreciation", "medical_care_quality"
        ];
        const selectedStructure = reviewStructures[Math.floor(Math.random() * reviewStructures.length)];
        
        const prompt = `You are generating authentic, natural-sounding Google Maps reviews for healthcare facilities. Each review must be unique and feel completely human-written by a real patient.

HOSPITAL DETAILS:
Name: "${businessName}" 
Type: ${type} (Healthcare Facility)
Medical Context: ${medicalContext}
Rating: ${starRating}/5 stars
Language: ${selectedLanguage}
Review Structure: ${selectedStructure}
${serviceInstructions}

CRITICAL REQUIREMENTS:
- EXACT character count: 155-170 characters (including spaces and punctuation)
- ${languageInstruction}
- Write like a real patient sharing genuine medical experience
- Use 1-3 sentences maximum
- Include specific, believable medical details
- Avoid generic phrases or AI-like patterns
- Use natural, conversational language with regional authenticity
- Mention medical aspects: ${medicalContext}
- NO hashtags, NO emojis, NO excessive punctuation
- Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}

UNIQUENESS REQUIREMENTS:
- Never use the same opening or closing phrases
- Vary sentence patterns completely
- Create different narrative approaches each time
- Use different ways to express medical experiences

Generate ONLY the review text (no quotes, formatting, or explanations):`;

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

    // Fallback to medical-specific review if all APIs fail
    return this.getMedicalFallbackReview(request);
  }

  private getMedicalFallbackReview(request: ReviewRequest): GeneratedReview {
    const { businessName, starRating, language } = request;
    const timestamp = Date.now();
    
    // Medical-specific fallback reviews
    const medicalFallbacks: Record<number, Record<string, string[]>> = {
      1: {
        "English": [
          `Had issues with medical care at ${businessName}. Long waiting time and staff wasn't very helpful. Expected better treatment quality.`,
          `Not satisfied with consultation. ${businessName} needs improvement in patient care and service quality. Disappointing experience.`
        ],
        "Hindi": [
          `${businessName} में इलाज से संतुष्ट नहीं हूं। डॉक्टर से मिलने में बहुत देर लगी और स्टाफ भी सहायक नहीं था।`,
          `चिकित्सा सेवा में सुधार की जरूरत है। ${businessName} में अनुभव निराशाजनक रहा। बेहतर उम्मीद थी।`
        ],
        "Gujarati": [
          `${businessName} માં તબીબી સેવામાં સમસ્યા હતી। ડૉક્ટરને મળવામાં ઘણો સમય લાગ્યો અને સ્ટાફ પણ મદદરૂપ નહોતો.`,
          `સારવારની ગુણવત્તામાં સુધારાની જરૂર છે. ${businessName} માં અનુભવ નિરાશાજનક રહ્યો હતો.`
        ]
      },
      2: {
        "English": [
          `Average medical experience at ${businessName}. Some good aspects but room for improvement in patient care and facility management.`,
          `Mixed experience with treatment. ${businessName} has potential but needs better organization and patient handling.`
        ],
        "Hindi": [
          `${businessName} में औसत चिकित्सा अनुभव रहा। कुछ अच्छे पहलू थे लेकिन मरीज़ों की देखभाल में सुधार की जरूरत है।`,
          `इलाज का मिश्रित अनुभव रहा। ${businessName} में संभावना है लेकिन बेहतर व्यवस्था की जरूरत है।`
        ],
        "Gujarati": [
          `${businessName} માં સરેરાશ તબીબી અનુભવ રહ્યો. કેટલાક સારા પાસાં હતા પણ દર્દીઓની સંભાળમાં સુધારાની જરૂર છે.`,
          `સારવારનો મિશ્ર અનુભવ રહ્યો. ${businessName} માં સંભાવના છે પણ વધુ સારી વ્યવસ્થાની જરૂર છે.`
        ]
      },
      3: {
        "English": [
          `Good medical care at ${businessName}. Doctors were knowledgeable and staff was helpful. Overall satisfied with treatment quality.`,
          `Decent healthcare experience. ${businessName} provided good consultation and proper treatment. Would recommend for medical needs.`
        ],
        "Hindi": [
          `${businessName} में अच्छी चिकित्सा सेवा मिली। डॉक्टर जानकार थे और स्टाफ सहायक था। इलाज की गुणवत्ता से संतुष्ट हूं।`,
          `अच्छा स्वास्थ्य सेवा अनुभव रहा। ${businessName} में उचित परामर्श और इलाज मिला। सिफारिश करूंगा।`
        ],
        "Gujarati": [
          `${businessName} માં સારી તબીબી સેવા મળી. ડૉક્ટરો જાણકાર હતા અને સ્ટાફ મદદરૂપ હતો. સારવારની ગુણવત્તાથી સંતુષ્ટ છું.`,
          `સારો આરોગ્ય સેવા અનુભવ રહ્યો. ${businessName} માં યોગ્ય સલાહ અને સારવાર મળી. ભલામણ કરીશ.`
        ]
      },
      4: {
        "English": [
          `Excellent medical care at ${businessName}! Professional doctors and caring staff. Very satisfied with treatment and would highly recommend.`,
          `Great healthcare experience. ${businessName} provided top-quality medical service with expert doctors. Highly recommend to others.`
        ],
        "Hindi": [
          `${businessName} में उत्कृष्ट चिकित्सा सेवा! पेशेवर डॉक्टर और देखभाल करने वाला स्टाफ। इलाज से बहुत संतुष्ट हूं।`,
          `शानदार स्वास्थ्य सेवा अनुभव रहा। ${businessName} में विशेषज्ञ डॉक्टरों के साथ उच्च गुणवत्ता की सेवा मिली।`
        ],
        "Gujarati": [
          `${businessName} માં ઉત્કૃષ્ટ તબીબી સેવા! વ્યાવસાયિક ડૉક્ટરો અને સંભાળ રાખનારો સ્ટાફ. સારવારથી ખૂબ સંતુષ્ટ છું.`,
          `શાનદાર આરોગ્ય સેવા અનુભવ રહ્યો. ${businessName} માં નિષ્ણાત ડૉક્ટરો સાથે ઉચ્ચ ગુણવત્તાની સેવા મળી.`
        ]
      },
      5: {
        "English": [
          `Outstanding medical care at ${businessName}! Exceptional doctors, excellent staff, and top-quality treatment. Highly recommend to everyone!`,
          `Absolutely excellent healthcare! ${businessName} provided world-class medical service with caring doctors. Perfect experience, 5 stars!`
        ],
        "Hindi": [
          `${businessName} में अद्भुत चिकित्सा सेवा! असाधारण डॉक्टर, उत्कृष्ट स्टाफ और उच्च गुणवत्ता का इलाज। सभी को सिफारिश!`,
          `बिल्कुल उत्कृष्ट स्वास्थ्य सेवा! ${businessName} में देखभाल करने वाले डॉक्टरों के साथ विश्व स्तरीय सेवा मिली।`
        ],
        "Gujarati": [
          `${businessName} માં અદ્ભુત તબીબી સેવા! અસાધારણ ડૉક્ટરો, ઉત્કૃષ્ટ સ્ટાફ અને ઉચ્ચ ગુણવત્તાની સારવાર. બધાને ભલામણ!`,
          `બિલકુલ ઉત્કૃષ્ટ આરોગ્ય સેવા! ${businessName} માં સંભાળ રાખનારા ડૉક્ટરો સાથે વિશ્વ સ્તરીય સેવા મળી.`
        ]
      }
    };

    // Select appropriate fallback
    const ratingFallbacks = medicalFallbacks[starRating] || medicalFallbacks[5];
    const languageFallbacks = ratingFallbacks[language] || ratingFallbacks["English"];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    let selectedFallback = languageFallbacks[randomIndex];
    
    // Ensure character limit (155-170)
    if (selectedFallback.length < 155) {
      selectedFallback += " Great care!";
    }
    if (selectedFallback.length > 170) {
      selectedFallback = selectedFallback.substring(0, 167) + "...";
    }
    
    return {
      text: selectedFallback,
      hash: this.generateHash(selectedFallback + timestamp),
      language: language || 'English',
      rating: starRating
    };
  }

  // Generate tagline for medical business
  async generateTagline(businessName: string, category: string, type: string): Promise<string> {
    const apiConfigs = await this.getActiveApiConfigs();
    
    const prompt = `Generate a professional, caring tagline for "${businessName}" which is a ${type} in healthcare.

Requirements:
- Keep it under 8 words
- Focus on medical care, trust, and expertise
- Make it warm and professional
- Reflect healthcare values
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
    const medicalTaglines = [
      'Your Health, Our Priority',
      'Caring for Your Wellness',
      'Expert Medical Care Always',
      'Compassionate Healthcare Excellence',
      'Trusted Medical Expertise'
    ];
      
    return medicalTaglines[Math.floor(Math.random() * medicalTaglines.length)];
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