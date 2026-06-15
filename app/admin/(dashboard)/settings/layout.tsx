"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "회사 기본 정보", path: "/admin/settings/company" },
    { name: "시스템 및 급여 정책", path: "/admin/settings/rules" },
    { name: "근태 기준 설정", path: "/admin/settings/attendance" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const isActive = pathname === tab.path || pathname?.startsWith(`${tab.path}/`);
            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
