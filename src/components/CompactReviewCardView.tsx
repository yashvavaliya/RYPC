import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, RotateCcw, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { ReviewCard } from '../types';
import { StarRating } from './StarRating';
import { SegmentedButtonGroup } from './SegmentedButtonGroup';
import { ServiceSelector } from './ServiceSelector';
import { aiService } from '../utils/aiService';
import { Link } from 'react-router-dom';

interface CompactReviewCardViewProps {
  card: ReviewCard;
}

export const CompactReviewCardView: React.FC<CompactReviewCardViewProps> = ({ card }) => {
  const [currentReview, setCurrentReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTone, setSelectedTone] = useState<'Professional' | 'Friendly' | 'Casual' | 'Grateful'>('Friendly');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const languageOptions = [
    'English',
    'Gujarati', 
    'Hindi',
    'English + Hindi',
    'English + Gujarati',
    'Hindi + Gujarati'
  ];

  const toneOptions = ['Friendly', 'Professional', 'Casual', 'Grateful'];

  useEffect(() => {
    // Generate initial review when component loads
    generateReviewForRating(5);
  }, []);

  const generateReviewForRating = async (
    rating: number, 
    language?: string, 
    tone?: 'Professional' | 'Friendly' | 'Casual' | 'Grateful',
    services?: string[]
  ) => {
    setIsGenerating(true);
    try {
      const review = await aiService.generateReview({
        businessName: card.businessName,
        category: card.category,
        type: card.type,
        highlights: card.description,
        selectedServices: services || selectedServices,
        starRating: rating,
        language: language || selectedLanguage,
        tone: tone || selectedTone
      });
      setCurrentReview(review.text);
    } catch (error) {
      console.error('Failed to generate review:', error);
      // Use contextual fallback review
      const fallbackReview = aiService.getFallbackReview({
        businessName: card.businessName,
        category: card.category,
        type: card.type,
        selectedServices: services || selectedServices,
        starRating: rating,
        language: language || selectedLanguage,
        tone: tone || selectedTone
      });
      setCurrentReview(fallbackReview);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    generateReviewForRating(rating, selectedLanguage, selectedTone, selectedServices);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    generateReviewForRating(selectedRating, language, selectedTone, selectedServices);
  };

  const handleToneChange = (tone: 'Professional' | 'Friendly' | 'Casual' | 'Grateful') => {
    setSelectedTone(tone);
    generateReviewForRating(selectedRating, selectedLanguage, tone, selectedServices);
  };

  const handleServicesChange = (services: string[]) => {
    setSelectedServices(services);
    generateReviewForRating(selectedRating, selectedLanguage, selectedTone, services);
  };

  const handleCopyAndRedirect = async () => {
    try {
      await navigator.clipboard.writeText(currentReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.location.href = card.googleMapsUrl;
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRegenerateReview = () => {
    generateReviewForRating(selectedRating, selectedLanguage, selectedTone, selectedServices);
  };

  const renderReviewText = () => {
    if (selectedLanguage.includes('+')) {
      // For mixed languages, try to split by sentences
      const sentences = currentReview.split(/[।.!?]+/).filter(s => s.trim());
      return (
        <div className="space-y-2">
          {sentences.map((sentence, index) => (
            <p key={index} className="text-gray-800 text-sm leading-relaxed">
              {sentence.trim()}{index < sentences.length - 1 ? '.' : ''}
            </p>
          ))}
        </div>
      );
    }
    
    return (
      <blockquote className="text-gray-800 text-sm leading-relaxed">
        "{currentReview}"
      </blockquote>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 relative perspective-1000">
              {/* 3D Rotating Ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-spin-continuous opacity-30 transform-gpu"></div>
              <div className="absolute inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-spin-reverse opacity-20 transform-gpu"></div>

              {/* Main Logo Container with 3D Effect */}
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-3d transform hover:scale-110 transition-all duration-500 animate-float-gentle">
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                  {/* Logo Display */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {card.logoUrl ? (
                      <img
                        src={card.logoUrl}
                        alt={`${card.businessName} Logo`}
                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 animate-pulse-gentle transform-gpu object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-base">
                          {card.businessName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-pulse delay-300"></div>
                <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-pulse delay-600"></div>
                <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60 animate-pulse delay-900"></div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {card.businessName}
          </h1>
          <p className="text-blue-200 text-sm">AI-Powered Review System</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
          {/* Star Rating Selector */}
          <div className="text-center mb-6">
            <p className="text-gray-700 font-medium mb-3">Select Rating</p>
            <div className="flex justify-center">
              <StarRating
                rating={selectedRating}
                onRatingChange={handleRatingChange}
                size="lg"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {selectedRating === 1 && "Very dissatisfied"}
              {selectedRating === 2 && "Below average"}
              {selectedRating === 3 && "Average experience"}
              {selectedRating === 4 && "Good experience"}
              {selectedRating === 5 && "Excellent experience"}
            </p>
          </div>

          {/* Language & Tone Selectors */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <SegmentedButtonGroup
                options={languageOptions}
                selected={selectedLanguage}
                onChange={(value) => handleLanguageChange(value as string)}
                size="sm"
              />
            </div>

            {showAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <SegmentedButtonGroup
                  options={toneOptions}
                  selected={selectedTone}
                  onChange={(value) => handleToneChange(value as 'Professional' | 'Friendly' | 'Casual' | 'Grateful')}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Service Selection */}
          {card.services && card.services.length > 0 && (
            <ServiceSelector
              services={card.services}
              selectedServices={selectedServices}
              onSelectionChange={handleServicesChange}
              className="mb-6"
            />
          )}

          {/* Advanced Options Toggle */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center mx-auto"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[100px] flex items-center">
              {isGenerating ? (
                <div className="flex items-center justify-center w-full">
                  <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-gray-600">Generating review...</span>
                </div>
              ) : (
                renderReviewText()
              )}
            </div>
            
            {/* Review Info */}
            {currentReview && !isGenerating && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {selectedLanguage} • {selectedTone} • {selectedRating} stars
                  {selectedServices.length > 0 && ` • ${selectedServices.length} services`}
                </span>
                <span>{currentReview.length} characters</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCopyAndRedirect}
              disabled={!currentReview || isGenerating}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Copied! Redirecting...
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy & Review
                </>
              )}
            </button>

            <button
              onClick={handleRegenerateReview}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate New Review
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 How It Works</h3>
            <div className="space-y-1 text-xs text-blue-800">
              <p>1. Select your rating (1-5 stars)</p>
              {card.services && card.services.length > 0 && (
                <p>2. Choose services to highlight</p>
              )}
              <p>{card.services && card.services.length > 0 ? '3' : '2'}. Choose language and tone preferences</p>
              <p>{card.services && card.services.length > 0 ? '4' : '3'}. Click "Copy & Review" to copy text</p>
              <p>{card.services && card.services.length > 0 ? '5' : '4'}. Paste in Google Maps and submit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};