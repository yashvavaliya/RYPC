import React, { useState } from 'react';
import { X, Upload, Building2, Link, AlertCircle, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { ReviewCard } from '../types';
import { generateId, generateSlug, validateGoogleMapsUrl } from '../utils/helpers';
import { aiService } from '../utils/aiService';
import { StarRating } from './StarRating';
import { SegmentedButtonGroup } from './SegmentedButtonGroup';
import { TagInput } from './TagInput';
import { smitHospitalServices, smitHospitalInfo } from '../utils/smitHospitalServices';

interface CompactAddCardModalProps {
  onClose: () => void;
  onSave: (card: ReviewCard) => void;
}

export const CompactAddCardModal: React.FC<CompactAddCardModalProps> = ({ onClose, onSave }) => {
  // Pre-populate with Smit Hospital information
  const [formData, setFormData] = useState({
    businessName: smitHospitalInfo.name,
    category: smitHospitalInfo.category,
    type: smitHospitalInfo.type,
    description: `${smitHospitalInfo.experience} of excellence in women's healthcare. ${smitHospitalInfo.consultations} and ${smitHospitalInfo.deliveries}. Specializing in gynecological care, maternity services, and holistic wellness programs.`,
    location: smitHospitalInfo.location,
    services: [] as string[],
    logoUrl: '',
    googleMapsUrl: ''
  });
  
  // AI Review Generation State
  const [aiReviewData, setAiReviewData] = useState({
    starRating: 5,
    language: 'English',
    tone: 'Friendly' as 'Professional' | 'Friendly' | 'Casual' | 'Grateful',
    useCase: 'Patient experience' as 'Customer review' | 'Student feedback' | 'Patient experience',
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
    setIsGeneratingReview(true);
    setErrors(prev => ({ ...prev, aiReview: '' }));

    try {
      const review = await aiService.generateReview({
        businessName: formData.businessName,
        category: formData.category,
        type: formData.type,
        highlights: aiReviewData.highlights,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add Smit Hospital Review Card</h2>
                <p className="text-sm text-gray-500">Create a new review generation card for Smit Hospital</p>
              </div>
            </div>
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
              {/* Pre-configured Hospital Information */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Smit Hospital Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Name:</span>
                    <span className="ml-2 text-blue-700">{smitHospitalInfo.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Category:</span>
                    <span className="ml-2 text-blue-700">{smitHospitalInfo.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Type:</span>
                    <span className="ml-2 text-blue-700">{smitHospitalInfo.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Location:</span>
                    <span className="ml-2 text-blue-700">{smitHospitalInfo.location}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-blue-800">Experience:</span>
                    <span className="ml-2 text-blue-700">{smitHospitalInfo.experience} • {smitHospitalInfo.consultations} • {smitHospitalInfo.deliveries}</span>
                  </div>
                </div>
              </div>

              {/* Business Name (Read-only for Smit Hospital) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.businessName}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  URL: /{generateSlug(formData.businessName)}
                </p>
              </div>

              {/* Hospital Services Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smit Hospital Services & Highlights
                </label>
                <TagInput
                  tags={formData.services}
                  onChange={handleServicesChange}
                  placeholder="Add services like 'Doctor Expertise', 'Maternity Services', 'Facility Quality'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select services that patients can highlight in their reviews
                </p>
                
                {/* Quick Add Popular Smit Hospital Services */}
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Quick add popular Smit Hospital services:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {smitHospitalServices.slice(0, 16).map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => {
                          if (!formData.services.includes(service)) {
                            handleServicesChange([...formData.services, service]);
                          }
                        }}
                        disabled={formData.services.includes(service)}
                        className={`px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                          formData.services.includes(service)
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {formData.services.includes(service) ? '✓ ' : '+ '}
                        {service}
                      </button>
                    ))}
                  </div>
                  
                  {smitHospitalServices.length > 16 && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Show all {smitHospitalServices.length} available services
                        </summary>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {smitHospitalServices.slice(16).map(service => (
                            <button
                              key={service}
                              type="button"
                              onClick={() => {
                                if (!formData.services.includes(service)) {
                                  handleServicesChange([...formData.services, service]);
                                }
                              }}
                              disabled={formData.services.includes(service)}
                              className={`px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                                formData.services.includes(service)
                                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {formData.services.includes(service) ? '✓ ' : '+ '}
                              {service}
                            </button>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>

              {/* Hospital Description (Pre-filled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">This helps generate more relevant and specific reviews</p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Logo
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
                {errors.logoUrl && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.logoUrl}
                  </p>
                )}
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
                  Get this URL from Smit Hospital's Google My Business review link
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
                  AI Preview
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Review Card'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Preview Panel */}
          {showAiPanel && (
            <div className="w-96 bg-gradient-to-br from-purple-50 to-blue-50 border-l border-gray-200 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    AI Review Preview
                  </h3>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-800 mb-3">
                    Preview how AI will generate reviews for this Smit Hospital card
                  </p>

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

                  {/* Highlights */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Highlights</label>
                    <textarea
                      value={aiReviewData.highlights}
                      onChange={(e) => handleAiDataChange('highlights', e.target.value)}
                      placeholder="e.g., excellent doctor care, modern facilities, compassionate staff"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    />
                  </div>

                  {/* Generate Preview Button */}
                  <button
                    type="button"
                    onClick={generateAiReview}
                    disabled={isGeneratingReview}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReview ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isGeneratingReview ? 'Generating...' : 'Generate Preview'}
                  </button>

                  {/* Generated Review Display */}
                  {aiReviewData.generatedReview && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800 font-medium mb-2">Preview Review:</p>
                      <p className="text-sm text-purple-700 italic">"{aiReviewData.generatedReview}"</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-purple-600">
                          {aiReviewData.language} • {aiReviewData.starRating} stars • {aiReviewData.generatedReview.length} chars
                        </span>
                        <button
                          type="button"
                          onClick={generateAiReview}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
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

                {/* Tagline Generator */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-800 mb-3">Generate Hospital Tagline</h4>
                  <button
                    type="button"
                    onClick={generateTagline}
                    disabled={isGeneratingTagline}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTagline ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isGeneratingTagline ? 'Generating...' : 'Generate Tagline'}
                  </button>
                  
                  {aiReviewData.generatedTagline && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">"{aiReviewData.generatedTagline}"</p>
                    </div>
                  )}
                  
                  {errors.tagline && (
                    <p className="mt-2 text-sm text-red-600">{errors.tagline}</p>
                  )}
                </div>

                {/* Information Panel */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Review Generation Info</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>• All reviews generated exclusively from Smit Hospital information</p>
                    <p>• Based on {smitHospitalServices.length} available services</p>
                    <p>• Supports multiple languages and tones</p>
                    <p>• Each review is unique and contextually relevant</p>
                    <p>• Selected services: {formData.services.length} items</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};