import React from "react";

interface AlertProps {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  if (!message) return null;

  const styles = {
    error: "bg-[#FDE7E9] text-[#A80000] border-[#FDE7E9]",
    success: "bg-[#DFF6DD] text-[#107C41] border-[#DFF6DD]",
    info: "bg-[#DEECF9] text-[#005A9E] border-[#DEECF9]",
  };

  const icons = {
    error: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start p-3 mb-4 text-sm rounded-[4px] border ${styles[type]}`}>
      {icons[type]}
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button onClick={onClose} className="ml-2 hover:opacity-70 focus:outline-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
