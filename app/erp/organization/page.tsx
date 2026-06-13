"use client";

import React, { useState } from 'react';
import DepartmentList from '@/components/erp/DepartmentList';
import PositionList from '@/components/erp/PositionList';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'positions'>('departments');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">조직 관리</h1>
        <p className="text-gray-500">회사의 부서 및 직급 체계를 관리합니다.</p>
      </div>

      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          부서 관리
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'positions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          직급 관리
        </button>
      </div>

      <div>
        {activeTab === 'departments' && <DepartmentList />}
        {activeTab === 'positions' && <PositionList />}
      </div>
    </div>
  );
}
