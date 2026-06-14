"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Menu, Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ERPlayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menus, setMenus] = useState<any[]>([]);
  const [openMenuIds, setOpenMenuIds] = useState<number[]>([]);
  const [userInfo, setUserInfo] = useState<{name: string, email: string, role_name: string} | null>(null);
  const pathname = usePathname();

  const toggleMenu = (id: number) => {
    setOpenMenuIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  useEffect(() => {
    const token = localStorage.getItem('erp_token') || localStorage.getItem('erp_access_token') || localStorage.getItem('token');
    
    if (token) {
      fetch("http://localhost:8000/api/auth/me", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserInfo(data);
          
          fetch(`http://localhost:8000/api/menus/my?role_name=${data.role_code || 'employee'}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => res.json())
          .then(menuData => {
            if (Array.isArray(menuData)) {
              setMenus(menuData);
            }
          })
          .catch(err => console.error(err));
        }
      })
      .catch(err => console.error(err));
    }
  }, []);

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />;
  };

  return (
    <div className="flex h-screen bg-[#f8f9fc] text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center text-[#107C41] font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-md bg-[#107C41] text-white flex items-center justify-center mr-2 shadow-md shadow-green-500/20">
              M
            </div>
            MINSTUDIO ERP
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">Main Menu</div>
          
          {Array.isArray(menus) && menus.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 animate-pulse">Loading menus...</div>
          ) : Array.isArray(menus) ? (
            menus.filter((m: any) => m.parent_id === null).map((parentMenu: any) => {
              const childMenus = menus.filter((m: any) => m.parent_id === parentMenu.id);
              const hasChildren = childMenus.length > 0;
              const isChildActive = childMenus.some((child: any) => pathname === child.url || pathname?.startsWith(`${child.url}/`));
              const isParentActive = pathname === parentMenu.url || pathname?.startsWith(`${parentMenu.url}/`);
              const isActive = isParentActive || isChildActive;
              const isOpen = openMenuIds.includes(parentMenu.id) || isChildActive;

              return (
                <div key={parentMenu.id} className="mb-1">
                  {hasChildren ? (
                    <button 
                      onClick={() => toggleMenu(parentMenu.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive ? 'bg-[#f0fdf4] text-[#107C41]' : 'text-gray-600 hover:bg-[#f0fdf4] hover:text-[#107C41]'}`}
                    >
                      <div className="flex items-center">
                        {renderIcon(parentMenu.icon || 'Circle')}
                        {parentMenu.name}
                      </div>
                      <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link 
                      href={parentMenu.url || "#"} 
                      className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-all group ${isActive ? 'bg-[#f0fdf4] text-[#107C41]' : 'text-gray-600 hover:bg-[#f0fdf4] hover:text-[#107C41]'}`}
                    >
                      {renderIcon(parentMenu.icon || 'Circle')}
                      {parentMenu.name}
                    </Link>
                  )}
                  
                  {hasChildren && isOpen && (
                    <div className="mt-1 ml-9 pl-1 border-l-2 border-gray-100 space-y-1">
                      {childMenus.map((childMenu: any) => {
                        const isChildUrlActive = pathname === childMenu.url || pathname?.startsWith(`${childMenu.url}/`);
                        return (
                          <Link
                            key={childMenu.id}
                            href={childMenu.url || "#"}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${isChildUrlActive ? 'text-[#107C41] bg-white shadow-sm border border-gray-100' : 'text-gray-500 hover:text-[#107C41] hover:bg-white/60'}`}
                          >
                            {childMenu.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : null}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="검색어 입력..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#107C41]/20 w-64 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="relative">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#107C41] to-green-400 text-white flex items-center justify-center font-semibold shadow-sm hover:shadow-md transition-shadow">
                  {userInfo ? userInfo.name.charAt(0) : 'U'}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 leading-tight hover:text-[#107C41] transition-colors">{userInfo?.name || 'Loading...'}</p>
                  <p className="text-xs text-gray-500">{userInfo?.role_name || ''}</p>
                </div>
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{userInfo?.name || 'Loading...'}</p>
                      <p className="text-xs text-gray-500 truncate">{userInfo?.email || ''}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/login" className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
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
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9fc] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
