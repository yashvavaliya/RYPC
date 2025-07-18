import React from 'react';

interface SegmentedButtonGroupProps {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedButtonGroup: React.FC<SegmentedButtonGroupProps> = ({
  options,
  selected,
  onChange,
  multiple = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const handleClick = (option: string) => {
    if (multiple) {
      const selectedArray = Array.isArray(selected) ? selected : [];
      if (selectedArray.includes(option)) {
        onChange(selectedArray.filter(item => item !== option));
      } else {
        onChange([...selectedArray, option]);
      }
    } else {
      onChange(selected === option ? '' : option);
    }
  };

  const isSelected = (option: string) => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(option);
    }
    return selected === option;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleClick(option)}
          className={`
            ${sizeClasses[size]}
            rounded-full font-medium transition-all duration-200
            border-2 whitespace-nowrap
            ${isSelected(option)
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            active:transform active:scale-95
          `}
          aria-pressed={isSelected(option)}
          role={multiple ? 'checkbox' : 'radio'}
        >
          {option}
        </button>
      ))}
    </div>
  );
};