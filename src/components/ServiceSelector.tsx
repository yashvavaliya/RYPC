import React from "react";
import { Check } from "lucide-react";

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
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Services
      </label>
      <div>
      {services.map((service) => (
        <button
          key={service}
          type="button"
          onClick={() => handleServiceToggle(service)}
          className={`             px-4 py-2 text-sm rounded-full font-medium transition-all duration-200
            border-2 whitespace-nowrap
            ${
              isSelected(service)
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg transform scale-105"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            active:transform active:scale-95
          `}
          aria-pressed={isSelected(service)}
          role="checkbox"
        >
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <span className="capitalize">{service}</span>
            {isSelected(service) && (
              <Check className="w-4 h-4 text-white" />
            )}{" "}
          </div>{" "}
        </button>
      ))}
      {selectedServices.length > 0 && (
        <div className="w-full mt-2 text-xs text-blue-600">
          {selectedServices.length} service
          {selectedServices.length !== 1 ? "s" : ""} selected{" "}
        </div>
      )}{" "}

        </div>
    </div>
  );
};
