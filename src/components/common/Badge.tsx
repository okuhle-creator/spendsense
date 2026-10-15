import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
    success: 'bg-forest-50 text-forest-700 border-forest-100',
    warning: 'bg-amber-50 text-amber-800 border-amber-100',
    danger: 'bg-burgundy-50 text-burgundy-700 border-burgundy-100',
    info: 'bg-paper-200 text-charcoal-800 border-charcoal-300',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
