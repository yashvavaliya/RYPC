import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCH-yvMejD3Ugv40gmM-DcVKyxVJ4xJBm0';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ReviewRequest {
  businessName: string;
  category: string;
  type: string;
  highlights?: string;
  starRating: number;
  language?: string; // Optional: specify language or combination
}

export class AIReviewService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  async generateReview(request: ReviewRequest): Promise<string> {
    const { businessName, category, type, highlights, starRating, language } = request;

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
    // If no language specified, pick one randomly
    const selectedLanguage = language || languageOptions[Math.floor(Math.random() * languageOptions.length)];

    // Prompt instructions for language(s)
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction = "Write the review in English.";
        break;
      case "Gujarati":
        languageInstruction = "Write the review in Gujarati.";
        break;
      case "Hindi":
        languageInstruction = "Write the review in Hindi.";
        break;
      default:
        languageInstruction = "Write the review in English.";
    }

    const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the ${category} category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
${highlights ? `Customer highlights: ${highlights}` : ''}

Requirements:
- Write 2-5 sentences maximum
- Sound natural and human-like
- Match the ${starRating}-star sentiment exactly
- Be specific to the business type (${type})
- Use realistic customer language
- No fake exaggeration, keep it credible
- Don't mention the star rating in the text
${highlights ? `- Try to incorporate these highlights naturally: ${highlights}` : ''}
- ${languageInstruction}

Return only the review text, no quotes or extra formatting.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('AI Review Generation Error:', error);
      return this.getFallbackReview(businessName, starRating, selectedLanguage);
    }
  }

  private getFallbackReview(businessName: string, starRating: number, language: string): string {
    // Simple hardcoded fallbacks for each language/combination
    const fallbacks: Record<number, Record<string, string>> = {
      1: {
        "English": `Had a disappointing experience at ${businessName}. The service was below expectations and several issues weren't addressed properly.`,
        "Gujarati": `મારું ${businessName} માં અનુભવ નિરાશાજનક રહ્યો. સેવા અપેક્ષા કરતા ઓછી હતી અને ઘણી સમસ્યાઓ ઉકેલાઈ નહોતી.`,
        "Hindi": `${businessName} में मेरा अनुभव निराशाजनक रहा। सेवा उम्मीद से कम थी और कई समस्याओं का समाधान नहीं हुआ।`,

      },
      2: {
        "English": `${businessName} was okay but had some problems. The staff tried to help but there's definitely room for improvement.`,
        "Gujarati": `${businessName} સારું હતું પણ કેટલીક સમસ્યાઓ હતી. સ્ટાફે મદદ કરવાનો પ્રયાસ કર્યો પણ સુધારાની જરૂર છે.`,
        "Hindi": `${businessName} ठीक था लेकिन कुछ समस्याएँ थीं। स्टाफ ने मदद करने की कोशिश की लेकिन सुधार की जरूरत है।`,
        
      },
      3: {
        "English": `Mixed experience at ${businessName}. Some things were good, others could be better. Average overall.`,
        "Gujarati": `${businessName} માં મિશ્ર અનુભવ રહ્યો. કેટલીક વસ્તુઓ સારી હતી, કેટલીક સુધારી શકાય.`,
        "Hindi": `${businessName} में मिला-जुला अनुभव रहा। कुछ चीजें अच्छी थीं, कुछ बेहतर हो सकती थीं।`,
      },
      4: {
        "English": `Good experience at ${businessName}. Professional service and quality work, just a minor wait time.`,
        "Gujarati": `${businessName} માં સારો અનુભવ રહ્યો. વ્યાવસાયિક સેવા અને ગુણવત્તાયુક્ત કામ, માત્ર થોડી રાહ જોવી પડી.`,
        "Hindi": `${businessName} में अच्छा अनुभव रहा। प्रोफेशनल सर्विस और क्वालिटी वर्क, बस थोड़ा इंतजार करना पड़ा।`,
      },
      5: {
        "English": `Excellent experience at ${businessName}! Outstanding service, professional team, and exceeded expectations. Highly recommended!`,
        "Gujarati": `${businessName} માં ઉત્તમ અનુભવ! શાનદાર સેવા, વ્યાવસાયિક ટીમ અને અપેક્ષાઓથી વધુ. ખૂબ જ ભલામણ!`,
        "Hindi": `${businessName} में शानदार अनुभव! बेहतरीन सेवा, प्रोफेशनल टीम और उम्मीदों से बढ़कर। ज़रूर सलाह दूंगा!`,
      }
    };
    // Fallback to English if not found
    return (fallbacks[starRating] && fallbacks[starRating][language]) || fallbacks[starRating]["English"];
  }
}

export const aiService = new AIReviewService();