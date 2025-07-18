import React from 'react';
import { ReviewCard } from '../types';

interface CompactReviewCardViewProps {
  card: ReviewCard;
}

export const CompactReviewCardView: React.FC<CompactReviewCardViewProps> = ({ card }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4 mb-4">
        {card.logoUrl && (
          <img
            src={card.logoUrl}
            alt={`${card.businessName} logo`}
            className="w-12 h-12 object-contain rounded"
          />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{card.businessName}</h3>
          <p className="text-sm text-gray-600">{card.type}</p>
        </div>
      </div>
      
      {card.description && (
        <p className="text-gray-700 mb-3">{card.description}</p>
      )}
      
      {card.location && (
        <p className="text-sm text-gray-500 mb-2">📍 {card.location}</p>
      )}
      
      {card.services && card.services.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {card.services.map((service, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {service}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {card.category}
        </span>
        <a
          href={card.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Leave Review
        </a>
      </div>
    </div>
  );
};