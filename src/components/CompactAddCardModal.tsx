import React, { useState } from 'react';
import { X, Upload, Building2, Link, AlertCircle } from 'lucide-react';
import { ReviewCard } from '../types';
import { generateId, generateSlug, validateGoogleMapsUrl } from '../utils/helpers';
import { storage } from '../utils/storage';

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
    logoUrl: '',
    googleMapsUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

    const slug = generateSlug(formData.businessName);

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  handleInputChange('type', ''); // Reset type when category changes
                }}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.category 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Select Category</option>
                <option value="Retail & Shopping">Retail & Shopping</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Services">Services</option>
                <option value="Professional Businesses">Professional Businesses</option>
                <option value="Health & Medical">Health & Medical</option>
                <option value="Education">Education</option>
                <option value="Hotels & Travel">Hotels & Travel</option>
                <option value="Entertainment & Recreation">Entertainment & Recreation</option>
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
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};