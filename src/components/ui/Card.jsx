import React from 'react';

const Card = ({ variant = 'default', hoverable = false, children, className = '', title }) => {
  const baseClasses = 'rounded-lg shadow-sm overflow-hidden';
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-blue-50 border border-blue-200',
    secondary: 'bg-green-50 border border-green-200',
    accent: 'bg-yellow-50 border border-yellow-200',
  };
  const hoverClasses = hoverable ? 'transition-all duration-200 hover:shadow-md' : '';
  
  return (
    <div className={${baseClasses}   }>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;
