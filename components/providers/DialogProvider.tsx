"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

type DialogType = "alert" | "confirm";

interface DialogOptions {
  title?: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
}

interface DialogContextValue {
  showAlert: (message: string, options?: Omit<DialogOptions, "message">) => Promise<void>;
  showConfirm: (message: string, options?: Omit<DialogOptions, "message">) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>("alert");
  const [dialogOptions, setDialogOptions] = useState<DialogOptions>({ message: "" });
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

  const showAlert = (message: string, options?: Omit<DialogOptions, "message">) => {
    return new Promise<void>((resolve) => {
      setDialogType("alert");
      setDialogOptions({ message, ...options });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const showConfirm = (message: string, options?: Omit<DialogOptions, "message">) => {
    return new Promise<boolean>((resolve) => {
      setDialogType("confirm");
      setDialogOptions({ message, ...options });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleClose = (value: any) => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(value);
      setResolvePromise(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden transform scale-100 transition-all border border-gray-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5">
              <div className="flex items-start">
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                  dialogOptions.type === "error" ? "bg-red-50" :
                  dialogOptions.type === "success" ? "bg-green-50" :
                  dialogOptions.type === "warning" ? "bg-yellow-50" :
                  "bg-blue-50"
                }`}>
                  {dialogOptions.type === "error" ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : dialogOptions.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : dialogOptions.type === "warning" ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 mt-1">
                  {dialogOptions.title && (
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {dialogOptions.title}
                    </h3>
                  )}
                  <p className="text-[15px] text-gray-600 break-all whitespace-pre-wrap leading-relaxed">
                    {dialogOptions.message}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50/80 px-5 py-4 flex justify-end space-x-2 border-t border-gray-100">
              {dialogType === "confirm" && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClose(dialogType === "confirm" ? true : undefined)}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  dialogOptions.type === "error" 
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
                    : "bg-[#0f62fe] hover:bg-[#0353e9] focus:ring-[#0f62fe]"
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
