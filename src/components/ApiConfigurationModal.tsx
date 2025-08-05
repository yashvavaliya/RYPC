import React, { useState } from 'react';
import { X, Key, Database, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ApiConfiguration } from '../types';
import { generateId } from '../utils/helpers';

interface ApiConfigurationModalProps {
  config?: ApiConfiguration;
  onClose: () => void;
  onSave: (config: ApiConfiguration) => void;
}

export const ApiConfigurationModal: React.FC<ApiConfigurationModalProps> = ({ 
  config, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: config?.name || '',
    provider: config?.provider || 'gemini' as 'gemini' | 'openai',
    apiKey: config?.apiKey || '',
    model: config?.model || 'gemini-2.0-flash',
    isActive: config?.isActive ?? true,
    priority: config?.priority || 1
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Configuration name is required';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model name is required';
    }

    if (formData.priority < 1) {
      newErrors.priority = 'Priority must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const apiConfig: ApiConfiguration = {
        id: config?.id || generateId(),
        name: formData.name.trim(),
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        model: formData.model.trim(),
        isActive: formData.isActive,
        priority: formData.priority,
        createdAt: config?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave(apiConfig);
    } catch (error) {
      console.error('Error saving API configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModelOptions = () => {
    if (formData.provider === 'gemini') {
      return [
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ];
    } else {
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo'
      ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            {config ? 'Edit API Configuration' : 'Add API Configuration'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Configuration Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Primary Gemini API"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) => {
                const provider = e.target.value as 'gemini' | 'openai';
                handleInputChange('provider', provider);
                // Reset model when provider changes
                const defaultModel = provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o';
                handleInputChange('model', defaultModel);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <select
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.model 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              {getModelOptions().map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {errors.model && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.model}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder={`Enter ${formData.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.apiKey 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.apiKey}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.provider === 'gemini' 
                ? 'Get your API key from Google AI Studio' 
                : 'Get your API key from OpenAI Platform'
              }
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (1 = Highest)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.priority 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.priority}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers have higher priority. APIs are tried in priority order.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Enable this API configuration
            </label>
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
              {isLoading ? 'Saving...' : (config ? 'Update' : 'Add')} API
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};