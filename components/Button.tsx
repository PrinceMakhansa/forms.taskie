import React from 'react';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const dangerStyles = 'bg-red-600 text-white border border-red-700 hover:bg-red-700 rounded-lg focus:ring-red-500';

const sizeStyles = {
  sm: 'px-5 py-1.5 text-sm',
  md: 'px-7 py-2 text-base',
  lg: 'px-9 py-3 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDanger = variant === 'danger';
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDanger ? dangerStyles : 'taskie-btn'}
        ${sizeStyles[size]}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
