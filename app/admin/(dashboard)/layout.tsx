"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LayoutDashboard, Menu as MenuIcon, ShieldCheck, FileText, Settings, LogOut, Bell, Search, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WebSocketContext = createContext<{
  activeSessions: number;
  systemMetrics: any;
}>({ activeSessions: 0, systemMetrics: null });

export const useWebSocket = () => useContext(WebSocketContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeSessions, setActiveSessions] = useState(0);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/api/ws');
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'active_sessions') {
            setActiveSessions(data.count);
          } else if (data.type === 'system_metrics') {
            setSystemMetrics(data.data);
          }
        } catch (e) {
          console.error("WS message error", e);
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <div className="flex h-screen bg-[#f8f9fc] text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shadow-xl hidden md:flex">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center text-white font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center mr-2 shadow-md shadow-blue-600/20">
              S
            </div>
            System Admin
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2 mt-4">System Core</div>
          
          <Link href="/admin" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${pathname === '/admin' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" />
            시스템 대시보드
          </Link>

          <Link href="/admin/admins" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/admins') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Shield className="w-5 h-5 mr-3" />
            시스템 계정 관리
          </Link>
          
          <Link href="/admin/employees" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/employees') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-5 h-5 mr-3" />
            사용자 및 권한 할당
          </Link>

          <Link href="/admin/menus" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/menus') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <MenuIcon className="w-5 h-5 mr-3" />
            사용자 메뉴 관리
          </Link>

          <Link href="/admin/roles" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/roles') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <ShieldCheck className="w-5 h-5 mr-3" />
            권한 관리
          </Link>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-2 mt-8">Audit & Config</div>

          <Link href="/admin/common-codes" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/common-codes') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Settings className="w-5 h-5 mr-3" />
            공통 코드 관리
          </Link>

          <Link href="/admin/audit" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/audit') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <FileText className="w-5 h-5 mr-3" />
            감사 로그
          </Link>

          <Link href="/admin/settings" className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive('/admin/settings') ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Settings className="w-5 h-5 mr-3" />
            환경 설정
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="relative">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold shadow-sm">
                  S
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 leading-tight hover:text-blue-600 transition-colors">SysAdmin</p>
                  <p className="text-xs text-gray-500">마스터 관리자</p>
                </div>
              </div>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                      <Link href="/admin/login" className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <WebSocketContext.Provider value={{ activeSessions, systemMetrics }}>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fc] p-6">
            {children}
          </main>
        </WebSocketContext.Provider>
      </main>
    </div>
  );
}
