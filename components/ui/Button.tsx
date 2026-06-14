import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'default' | 'outline' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ loading = false, variant = 'default', size = 'default', children, className = "", ...props }: ButtonProps) {
  let variantClass = "text-white bg-[#107C41] hover:bg-[#0c5c30] border-transparent focus:ring-[#107C41]";
  if (variant === 'outline') {
    variantClass = "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-[#107C41]";
  } else if (variant === 'danger') {
    variantClass = "text-white bg-red-600 hover:bg-red-700 border-transparent focus:ring-red-600";
  } else if (variant === 'ghost') {
    variantClass = "text-gray-700 bg-transparent hover:bg-gray-100 border-transparent focus:ring-gray-500";
  }

  let sizeClass = "py-2 px-4 text-sm";
  if (size === 'sm') {
    sizeClass = "py-1 px-3 text-xs";
  } else if (size === 'lg') {
    sizeClass = "py-3 px-6 text-base";
  }

  return (
    <button
      disabled={loading || props.disabled}
      className={`flex items-center justify-center border font-semibold rounded-[4px] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
