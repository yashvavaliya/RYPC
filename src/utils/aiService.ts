import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCH-yvMejD3Ugv40gmM-DcVKyxVJ4xJBm0';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ReviewRequest {
  businessName: string;
  category: string;
  type: string;
  highlights?: string;
  starRating: number;
}

export class AIReviewService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  async generateReview(request: ReviewRequest): Promise<string> {
    const { businessName, category, type, highlights, starRating } = request;
    
    const sentimentGuide = {
      1: "Very negative, expressing frustration and dissatisfaction with specific issues",
      2: "Below average experience, mentioning problems but being constructive",
      3: "Mixed or neutral review with both positive and negative aspects",
      4: "Positive experience with good aspects, maybe one small downside",
      5: "Enthusiastic and praise-worthy, fully satisfied customer"
    };

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

Return only the review text, no quotes or extra formatting.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('AI Review Generation Error:', error);
      return this.getFallbackReview(businessName, starRating);
    }
  }

  private getFallbackReview(businessName: string, starRating: number): string {
    const fallbacks = {
      1: `Had a disappointing experience at ${businessName}. The service was below expectations and several issues weren't addressed properly.`,
      2: `${businessName} was okay but had some problems. The staff tried to help but there's definitely room for improvement.`,
      3: `Mixed experience at ${businessName}. Some things were good, others could be better. Average overall.`,
      4: `Good experience at ${businessName}. Professional service and quality work, just a minor wait time.`,
      5: `Excellent experience at ${businessName}! Outstanding service, professional team, and exceeded expectations. Highly recommended!`
    };
    
    return fallbacks[starRating as keyof typeof fallbacks];
  }
}

export const aiService = new AIReviewService();