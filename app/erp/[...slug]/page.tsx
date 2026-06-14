"use client";

import React from 'react';
import { Construction } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function UnderConstructionPage() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 m-6">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지 준비 중입니다</h1>
      <p className="text-gray-500 text-center max-w-md">
        요청하신 페이지(<code>{pathname}</code>)는 현재 개발이 진행 중이거나 아직 준비되지 않았습니다. 
        <br />더 나은 서비스를 위해 최선을 다하고 있습니다. 조금만 기다려주세요!
      </p>
      
      <div className="mt-8 pt-8 border-t border-gray-100 w-full max-w-md text-center">
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
