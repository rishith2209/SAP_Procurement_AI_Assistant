import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sap-blue-medium disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-sap-blue text-white hover:bg-sap-blue-hover active:bg-sap-blue-dark border border-transparent shadow-sm',
    secondary: 'bg-white dark:bg-sap-gray-800 text-sap-gray-700 dark:text-sap-gray-200 border border-sap-border-light dark:border-sap-border-dark hover:bg-sap-gray-50 dark:hover:bg-sap-gray-700 active:bg-sap-gray-100 dark:active:bg-sap-gray-600 shadow-sm',
    accent: 'bg-sap-accent text-white hover:bg-sap-accent-dark border border-transparent shadow-sm',
    outline: 'bg-transparent border border-sap-blue text-sap-blue hover:bg-sap-blue/5 dark:text-sap-blue-medium dark:border-sap-blue-medium dark:hover:bg-sap-blue-medium/5',
    ghost: 'bg-transparent hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 text-sap-gray-600 dark:text-sap-gray-300 border border-transparent',
    danger: 'bg-sap-status-error-text text-white hover:bg-red-700 active:bg-red-800 border border-transparent shadow-sm',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
    </button>
  );
};
