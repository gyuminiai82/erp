import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'default' | 'outline' | 'danger' | 'ghost';
}

export function Button({ loading = false, variant = 'default', children, className = "", ...props }: ButtonProps) {
  let variantClass = "text-white bg-[#107C41] hover:bg-[#0c5c30] border-transparent focus:ring-[#107C41]";
  if (variant === 'outline') {
    variantClass = "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-[#107C41]";
  } else if (variant === 'danger') {
    variantClass = "text-white bg-red-600 hover:bg-red-700 border-transparent focus:ring-red-600";
  } else if (variant === 'ghost') {
    variantClass = "text-gray-700 bg-transparent hover:bg-gray-100 border-transparent focus:ring-gray-500";
  }

  return (
    <button
      disabled={loading || props.disabled}
      className={`flex justify-center py-2 px-4 border text-sm font-semibold rounded-[4px] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm ${variantClass} ${className}`}
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
