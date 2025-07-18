import React from 'react';
import { Check } from 'lucide-react';

interface ServiceSelectorProps {
  services: string[];
  selectedServices: string[];
  onSelectionChange: (services: string[]) => void;
  className?: string;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServices,
  onSelectionChange,
  className = ''
}) => {
  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      onSelectionChange(selectedServices.filter(s => s !== service));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
  };

  if (services.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Services to Highlight
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {services.map((service) => {
          const isSelected = selectedServices.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => handleServiceToggle(service)}
              className={`
                relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                border-2 text-left
                ${isSelected
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize">{service}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      {selectedServices.length > 0 && (
        <div className="mt-2 text-xs text-blue-600">
          {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};