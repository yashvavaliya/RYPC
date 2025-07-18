import React from "react";
import { Check, Sparkles } from "lucide-react";

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
  className = "",
}) => {
  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      onSelectionChange(selectedServices.filter((s) => s !== service));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
  };

  const isSelected = (service: string) => selectedServices.includes(service);

  if (services.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
          Select Services to Highlight
        </label>
        {selectedServices.length > 0 && (
          <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3 mr-1" />
            {selectedServices.length} selected
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {services.map((service, index) => (
          <button
            key={service}
            type="button"
            onClick={() => handleServiceToggle(service)}
            className={`
              group relative px-4 py-2.5 text-sm font-medium rounded-full
              transition-all duration-300 ease-out transform
              border-2 whitespace-nowrap min-w-0 flex items-center gap-2
              hover:scale-105 active:scale-95
              ${
                isSelected(service)
                  ? `
                    bg-gradient-to-r from-blue-500 to-purple-600 
                    text-white border-transparent shadow-lg
                    hover:from-blue-600 hover:to-purple-700
                    animate-pulse-gentle
                  `
                  : `
                    bg-white text-gray-700 border-gray-200
                    hover:border-purple-300 hover:bg-purple-50
                    hover:text-purple-700 hover:shadow-md
                  `
              }
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              animationDelay: `${index * 100}ms`
            }}
            aria-pressed={isSelected(service)}
            role="checkbox"
          >
            {/* Background gradient animation for selected items */}
            {isSelected(service) && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
            )}
            
            {/* Service name */}
            <span className="relative z-10 capitalize font-medium">
              {service}
            </span>
            
            {/* Check icon for selected items */}
            {isSelected(service) && (
              <Check className="relative z-10 w-4 h-4 text-white animate-bounce-gentle" />
            )}
            
            {/* Hover effect overlay */}
            <div className={`
              absolute inset-0 rounded-full transition-opacity duration-300
              ${isSelected(service) 
                ? 'bg-white/10 opacity-0 group-hover:opacity-100' 
                : 'bg-purple-100/50 opacity-0 group-hover:opacity-100'
              }
            `}></div>
          </button>
        ))}
      </div>

      {/* Selection summary */}
      {selectedServices.length > 0 && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 text-purple-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};