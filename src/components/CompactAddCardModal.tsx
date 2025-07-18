import React, { useState } from 'react';
import { X, Upload, Building2, Link, AlertCircle, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { ReviewCard } from '../types';
import { generateId, generateSlug, validateGoogleMapsUrl } from '../utils/helpers';
import { aiService } from '../utils/aiService';
import { StarRating } from './StarRating';
import { SegmentedButtonGroup } from './SegmentedButtonGroup';
import { TagInput } from './TagInput';

interface CompactAddCardModalProps {
  onClose: () => void;
  onSave: (card: ReviewCard) => void;
}

export const CompactAddCardModal: React.FC<CompactAddCardModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    type: '',
    description: '',
    location: '',
    services: [] as string[],
    services: [] as string[],
    logoUrl: '',
    googleMapsUrl: ''
  });
  
  // AI Review Generation State
  const [aiReviewData, setAiReviewData] = useState({
    starRating: 5,
    language: 'English',
    tone: 'Friendly' as 'Professional' | 'Friendly' | 'Casual' | 'Grateful',
    useCase: 'Customer review' as 'Customer review' | 'Student feedback' | 'Patient experience',
    highlights: '',
    generatedReview: '',
    generatedTagline: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServicesChange = (services: string[]) => {
    setFormData(prev => ({ ...prev, services }));
  };

  const handleAiDataChange = (field: string, value: string | number) => {
    setAiReviewData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logoUrl: 'File size must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAiReview = async () => {
    if (!formData.businessName || !formData.category || !formData.type) {
      setErrors(prev => ({ ...prev, aiReview: 'Please fill business name, category, and type first' }));
      return;
    }

    setIsGeneratingReview(true);
    setErrors(prev => ({ ...prev, aiReview: '' }));

    try {
      const review = await aiService.generateReview({
        businessName: formData.businessName,
        category: formData.category,
        type: formData.type,
        highlights: aiReviewData.highlights,
        selectedServices: formData.services,
        selectedServices: formData.services,
        starRating: aiReviewData.starRating,
        language: aiReviewData.language,
        tone: aiReviewData.tone,
        useCase: aiReviewData.useCase
      });

      setAiReviewData(prev => ({ ...prev, generatedReview: review.text }));
    } catch (error) {
      console.error('Error generating review:', error);
      setErrors(prev => ({ ...prev, aiReview: 'Failed to generate review. Please try again.' }));
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const generateTagline = async () => {
    if (!formData.businessName || !formData.category || !formData.type) {
      setErrors(prev => ({ ...prev, tagline: 'Please fill business name, category, and type first' }));
      return;
    }

    setIsGeneratingTagline(true);
    setErrors(prev => ({ ...prev, tagline: '' }));

    try {
      const tagline = await aiService.generateTagline(formData.businessName, formData.category, formData.type);
      setAiReviewData(prev => ({ ...prev, generatedTagline: tagline }));
    } catch (error) {
      console.error('Error generating tagline:', error);
      setErrors(prev => ({ ...prev, tagline: 'Failed to generate tagline. Please try again.' }));
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Business category is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Business type is required';
    }

    if (!formData.googleMapsUrl.trim()) {
      newErrors.googleMapsUrl = 'Google Maps URL is required';
    } else if (!validateGoogleMapsUrl(formData.googleMapsUrl)) {
      newErrors.googleMapsUrl = 'Please enter a valid Google Maps review URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const newCard: ReviewCard = {
        id: generateId(),
        businessName: formData.businessName.trim(),
        category: formData.category.trim(),
        type: formData.type.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        services: formData.services,
        services: formData.services,
        slug: generateSlug(formData.businessName),
        logoUrl: formData.logoUrl,
        googleMapsUrl: formData.googleMapsUrl.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave(newCard);
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const languageOptions = [
    'English',
    'Gujarati', 
    'Hindi',
    'English + Hindi',
    'English + Gujarati',
    'Hindi + Gujarati'
  ];

  const toneOptions = ['Friendly', 'Professional', 'Casual', 'Grateful'];

  const categoryOptions = [
    'Retail & Shopping',
    'Food & Beverage',
    'Services',
    'Professional Businesses',
    'Health & Medical',
    'Education',
    'Hotels & Travel',
    'Entertainment & Recreation'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Add New Review Card</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Main Form */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Enter business name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.businessName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.businessName}
                  </p>
                )}
                {formData.businessName && (
                  <p className="mt-1 text-sm text-gray-500">
                    URL: /{generateSlug(formData.businessName)}
                  </p>
                )}
              </div>

              {/* Business Category and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      handleInputChange('type', '');
                    }}
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.category 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="e.g., Software Company, Restaurant, Clinic"
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.type 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your business, services, or specialties..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">This helps generate more relevant reviews</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State or Area"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Helps with location-specific reviews</p>
              </div>

              {/* Business Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Services / Highlights
                </label>
                <TagInput
                  tags={formData.services}
                  onChange={handleServicesChange}
                  placeholder="Add services like 'food quality', 'staff', 'ambiance'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add services that customers can highlight in their reviews
                </p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Review URL *
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.googleMapsUrl}
                    onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.googleMapsUrl 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.googleMapsUrl && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.googleMapsUrl}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Get this URL from your Google My Business review link
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Tools
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Panel */}
          {showAiPanel && (
            <div className="w-96 bg-gray-50 border-l border-gray-200 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    AI Tools
                  </h3>
                </div>

                {/* Tagline Generator */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Generate Tagline</h4>
                  <button
                    onClick={generateTagline}
                    disabled={isGeneratingTagline || !formData.businessName || !formData.category || !formData.type}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTagline ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isGeneratingTagline ? 'Generating...' : 'Generate Tagline'}
                  </button>
                  
                  {aiReviewData.generatedTagline && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800 font-medium">"{aiReviewData.generatedTagline}"</p>
                    </div>
                  )}
                  
                  {errors.tagline && (
                    <p className="mt-2 text-sm text-red-600">{errors.tagline}</p>
                  )}
                </div>

                {/* Review Generator */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Generate AI Review</h4>
                  
                  {/* Star Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
                    <StarRating
                      rating={aiReviewData.starRating}
                      onRatingChange={(rating) => handleAiDataChange('starRating', rating)}
                      size="md"
                    />
                  </div>

                  {/* Language */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <SegmentedButtonGroup
                      options={languageOptions}
                      selected={aiReviewData.language}
                      onChange={(value) => handleAiDataChange('language', value as string)}
                      size="sm"
                    />
                  </div>

                  {/* Tone */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                    <SegmentedButtonGroup
                      options={toneOptions}
                      selected={aiReviewData.tone}
                      onChange={(value) => handleAiDataChange('tone', value as string)}
                      size="sm"
                    />
                  </div>

                  {/* Use Case */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Use Case</label>
                    <select
                      value={aiReviewData.useCase}
                      onChange={(e) => handleAiDataChange('useCase', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Customer review">Customer review</option>
                      <option value="Student feedback">Student feedback</option>
                      <option value="Patient experience">Patient experience</option>
                    </select>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (Optional)</label>
                    <textarea
                      value={aiReviewData.highlights}
                      onChange={(e) => handleAiDataChange('highlights', e.target.value)}
                      placeholder="e.g., fast service, friendly staff, clean environment"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateAiReview}
                    disabled={isGeneratingReview || !formData.businessName || !formData.category || !formData.type}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReview ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isGeneratingReview ? 'Generating...' : 'Generate Review'}
                  </button>

                  {/* Generated Review Display */}
                  {aiReviewData.generatedReview && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">"{aiReviewData.generatedReview}"</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-blue-600">
                          {aiReviewData.language} • {aiReviewData.starRating} stars
                        </span>
                        <button
                          onClick={generateAiReview}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  )}

                  {errors.aiReview && (
                    <p className="mt-2 text-sm text-red-600">{errors.aiReview}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};