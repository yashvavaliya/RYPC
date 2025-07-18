import { ReviewTemplates, ReviewVariations } from '../types';

// Base review templates for dynamic generation
export const reviewTemplates: ReviewTemplates = {
  openings: [ 
    "{businessName} delivered our app with perfection!",
    "Extremely satisfied with {businessName}'s work.",
    "Excellent team of developers at {businessName}!",
    "Outstanding service from {businessName}!",
    "The team at {businessName} is incredibly talented.",
    "{businessName}'s expertise is exceptional.",
    "Working with {businessName} was a game-changer.",
    "Fantastic experience with {businessName}!",
    "{businessName} exceeded all our expectations.",
    "Highly recommend {businessName} for development.",
    "Amazing work by the {businessName} team!",
    "{businessName} provided outstanding solutions.",
    "Impressed with {businessName}'s professionalism.",
    "{businessName} delivered beyond our expectations.",
    "Exceptional service from {businessName}!",
  ],
  qualities: [
    "Highly professional team and seamless experience.",
    "Their innovative ideas and execution are top-notch!",
    "Quick response, great communication, and outstanding delivery.",
    "They truly understand your business needs.",
    "Affordable, reliable, and professional service!",
    "They delivered a robust, scalable solution.",
    "Innovative solutions with excellent communication.",
    "Delivered on time, within budget, and superior quality.",
    "Technical skills and professional approach.",
    "Knowledgeable, responsive, and high-quality solutions.",
    "Attention to detail and commitment to quality.",
    "Creative problem-solving and technical expertise.",
    "Dedicated team with excellent project management.",
    "Modern technologies and cutting-edge solutions.",
    "Reliable support and maintenance services.",
  ],
  achievements: [
    "Their attention to detail and commitment to quality is unmatched.",
    "They transformed our business with cutting-edge solutions.",
    "{businessName} exceeded all our expectations completely.",
    "They convert your vision into reality with smart solutions.",
    "Their expertise in modern technologies is impressive.",
    "Perfectly meets our business needs and requirements.",
    "Maintained excellent communication throughout the project.",
    "Amazing experience with superior quality delivery!",
    "Made the entire process smooth and efficient.",
    "Will definitely work with them again in future.",
    "Delivered innovative and scalable applications.",
    "Provided comprehensive solutions for our business.",
    "Enhanced our digital presence significantly.",
    "Streamlined our operations with smart technology.",
    "Created user-friendly and feature-rich applications.",
  ],
  endings: [
    "Highly recommended for all your development needs!",
    "Best choice for professional development services.",
    "Five stars for their exceptional work and dedication.",
    "Thank you {businessName} for the amazing service!",
    "Looking forward to future collaborations with them.",
    "Definitely our go-to company for tech solutions.",
    "Worth every penny spent on their services.",
    "Professional team that delivers real results.",
    "Exceeded expectations in every aspect possible.",
    "Highly satisfied with the overall experience.",
    "Outstanding value for money and quality.",
    "Reliable partner for all our tech needs.",
    "Impressive work that speaks for itself.",
    "Committed to excellence and customer satisfaction.",
    "Truly a world-class development team.",
  ]
};

// Additional variation elements
export const variations: ReviewVariations = {
  connectors: [
    " Additionally, ",
    " Furthermore, ",
    " Moreover, ",
    " What's more, ",
    " Also, ",
    " Plus, ",
    " In addition, ",
    " Beyond that, ",
    " Not only that, ",
    " On top of this, ",
  ],
  intensifiers: [
    "absolutely ",
    "truly ",
    "genuinely ",
    "remarkably ",
    "exceptionally ",
    "incredibly ",
    "extremely ",
    "thoroughly ",
    "completely ",
    "perfectly ",
  ],
  timeframes: [
    "from day one",
    "throughout the project",
    "from start to finish",
    "during our collaboration",
    "in every interaction",
    "at every stage",
    "consistently",
    "without exception",
    "every step of the way",
    "from beginning to end",
  ]
};

export class ReviewGenerator {
  private usedCombinations: Set<string> = new Set();

  generateUniqueReview(businessName: string): string {
    let attempts = 0;
    let newReview = "";
    let reviewHash = "";
    
    // Try to generate a unique review (max 100 attempts to avoid infinite loop)
    do {
      attempts++;
      
      // Randomly select elements from each category
      const opening = reviewTemplates.openings[Math.floor(Math.random() * reviewTemplates.openings.length)];
      const quality = reviewTemplates.qualities[Math.floor(Math.random() * reviewTemplates.qualities.length)];
      const achievement = reviewTemplates.achievements[Math.floor(Math.random() * reviewTemplates.achievements.length)];
      const ending = reviewTemplates.endings[Math.floor(Math.random() * reviewTemplates.endings.length)];
      
      // Randomly add variations
      const useConnector = Math.random() > 0.3;
      const useIntensifier = Math.random() > 0.4;
      const useTimeframe = Math.random() > 0.5;
      
      const connector = useConnector ? variations.connectors[Math.floor(Math.random() * variations.connectors.length)] : " ";
      const intensifier = useIntensifier ? variations.intensifiers[Math.floor(Math.random() * variations.intensifiers.length)] : "";
      const timeframe = useTimeframe ? ` ${variations.timeframes[Math.floor(Math.random() * variations.timeframes.length)]}` : "";
      
      // Construct the review with random structure
      const structures = [
        `${opening} ${intensifier}${quality}${connector}${achievement}${timeframe}. ${ending}`,
        `${opening}${connector}${intensifier}${achievement} ${quality}${timeframe}. ${ending}`,
        `${opening} ${quality}${timeframe}.${connector}${intensifier}${achievement} ${ending}`,
        `${opening}${timeframe} ${intensifier}${quality}${connector}${achievement} ${ending}`,
        `${opening} ${intensifier}${achievement}${connector}${quality}${timeframe}. ${ending}`,
      ];
      
      newReview = structures[Math.floor(Math.random() * structures.length)];
      
      // Replace business name placeholders
      newReview = newReview.replace(/{businessName}/g, businessName);
      
      // Clean up extra spaces and punctuation
      newReview = newReview
        .replace(/\s+/g, ' ')
        .replace(/\s+\./g, '.')
        .replace(/\.\s*\./g, '.')
        .replace(/\s+,/g, ',')
        .trim();
      
      // Create a hash of the review to check uniqueness
      reviewHash = btoa(newReview).slice(0, 20); // Simple hash using base64
      
    } while (this.usedCombinations.has(reviewHash) && attempts < 100);
    
    // If we couldn't generate a unique review after 100 attempts, 
    // add some randomness to make it unique
    if (this.usedCombinations.has(reviewHash)) {
      const suffixes = [
        " Outstanding work!",
        " Exceptional service!",
        " Highly recommended!",
        " Amazing experience!",
        " Perfect execution!",
        " Great collaboration!",
        " Superb quality!",
        " Excellent results!",
        " Top-notch service!",
        " Brilliant work!",
      ];
      newReview += ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
      reviewHash = btoa(newReview).slice(0, 20);
    }

    // Store the hash to prevent future duplicates
    this.usedCombinations.add(reviewHash);
    return newReview;
  }

  resetUsedCombinations(): void {
    this.usedCombinations.clear();
  }
}