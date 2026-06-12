import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading = false, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-[4px] text-white bg-[#107C41] hover:bg-[#0c5c30] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#107C41] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm ${className}`}
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
