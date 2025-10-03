import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border ${className}`}>
      {(title || subtitle) && (
        <div className="p-6 border-b border-gray-200 dark:border-dark-border">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
