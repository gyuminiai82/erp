import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  const inputEl = (
    <input
      className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-[4px] text-sm text-gray-900 transition-all focus:outline-none focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] shadow-sm ${className}`}
      {...props}
    />
  );

  if (!label) return inputEl;

  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-semibold text-gray-800 mb-1.5">
        {label}
      </label>
      {inputEl}
    </div>
  );
}
