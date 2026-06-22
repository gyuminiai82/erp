"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Menu, Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDialog } from "@/components/providers/DialogProvider";

export default function ERPlayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menus, setMenus] = useState<any[]>([]);
  const [openMenuIds, setOpenMenuIds] = useState<number[]>([]);
  const [userInfo, setUserInfo] = useState<{name: string, email: string, role_name: string, role_code: string} | null>(null);
  const [attendance, setAttendance] = useState<{check_in?: string, check_out?: string} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const pathname = usePathname();
  const { showAlert } = useDialog();

  const toggleMenu = (id: number) => {
    setOpenMenuIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWorkDuration = () => {
    if (!attendance?.check_in) return "00:00:00";
    const start = new Date(attendance.check_in).getTime();
    const end = attendance.check_out ? new Date(attendance.check_out).getTime() : currentTime.getTime();
    const diff = end - start;
    if (diff < 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    
    if (token) {
      fetch("/api/auth/me", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserInfo(data);
          
          fetch(`/api/menus/my?role_name=${data.role_code || 'employee'}`, {
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

          fetch(`/api/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(notis => setNotifications(notis))
          .catch(e => console.error(e));

          if (data.role_code !== 'admin') {
            fetch(`/api/attendances/today`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.ok ? res.json() : null)
            .then(attData => {
              if (attData) setAttendance(attData);
            })
            .catch(err => console.error(err));
          }
        }
      })
      .catch(err => console.error(err));
    }

    // Connect to WebSocket to track active sessions
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      ws = new WebSocket(`${protocol}//${window.location.host}/api/ws${token ? `?token=${token}` : ''}`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_notification") {
            setNotifications(prev => [data.data, ...prev]);
            showAlert(`[${data.data.title}] ${data.data.message}`, { type: "info" });
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectWs, 5000);
        }
      };
    };
    connectWs();

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />;
  };

  const handleClockIn = async () => {
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    try {
      const res = await fetch(`/api/attendances/clock-in`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(prev => ({...prev, check_in: data.check_in}));
        await showAlert(data.message, { type: "success" });
      } else {
        const err = await res.json();
        await showAlert(err.detail, { type: "error" });
      }
    } catch(e) { console.error(e); }
  };

  const handleClockOut = async () => {
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    try {
      const res = await fetch(`/api/attendances/clock-out`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(prev => ({...prev, check_out: data.check_out}));
        await showAlert(data.message, { type: "success" });
      } else {
        const err = await res.json();
        await showAlert(err.detail, { type: "error" });
      }
    } catch(e) { console.error(e); }
  };

  let activeTitle = "";
  let globalActiveUrl = "";
  if (Array.isArray(menus)) {
    menus.forEach(m => {
      if (m.url && (pathname === m.url || pathname?.startsWith(`${m.url}/`))) {
        if (m.url.length > globalActiveUrl.length) {
          globalActiveUrl = m.url;
          activeTitle = m.name;
        }
      }
    });
  }

  return (
    <div className="flex h-screen bg-[#f8f9fc] text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/erp" className="flex items-center text-[#107C41] font-bold text-xl tracking-tight hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-[#107C41] text-white flex items-center justify-center mr-2 shadow-md shadow-green-500/20">
              M
            </div>
            MINSTUDIO ERP
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">

          
          {Array.isArray(menus) && menus.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 animate-pulse">Loading menus...</div>
          ) : Array.isArray(menus) ? (
            (() => {
              let activeUrl = "";
              menus.forEach(m => {
                if (m.url && (pathname === m.url || pathname?.startsWith(`${m.url}/`))) {
                  if (m.url.length > activeUrl.length) {
                    activeUrl = m.url;
                  }
                }
              });

              return menus.filter((m: any) => m.parent_id === null).map((parentMenu: any) => {
                const childMenus = menus.filter((m: any) => m.parent_id === parentMenu.id);
                const hasChildren = childMenus.length > 0;
                const isChildActive = childMenus.some((child: any) => child.url === activeUrl);
                const isParentActive = parentMenu.url === activeUrl;
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
                          const isChildUrlActive = childMenu.url === activeUrl;
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
              });
            })()
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
            {activeTitle && (
              <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
                {activeTitle}
              </h2>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {userInfo && userInfo.role_code !== 'admin' && (
              <div className="hidden sm:flex items-center mr-2">
                {!attendance?.check_in ? (
                  <button onClick={handleClockIn} className="flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm">
                    <Icons.Play className="w-4 h-4 mr-1.5" />
                    출근하기
                  </button>
                ) : (
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full py-1 pl-4 pr-1 shadow-inner">
                    <div className="flex items-center space-x-3 text-sm mr-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase leading-none mb-1">
                          출근 {new Date(attendance.check_in).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <div className="flex items-center font-mono font-bold text-gray-700 leading-none">
                          <Icons.Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                          {getWorkDuration()}
                        </div>
                      </div>
                    </div>
                    {!attendance.check_out ? (
                      <button onClick={handleClockOut} className="flex items-center px-3 py-1 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm group">
                        <Icons.Square className="w-3 h-3 mr-1 text-gray-400 group-hover:text-red-500 transition-colors" />
                        퇴근
                      </button>
                    ) : (
                      <div className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full font-bold text-xs">
                        퇴근완료
                      </div>
                    )}
                  </div>
                )}
                <div className="h-6 w-px bg-gray-200 ml-4 mr-1"></div>
              </div>
            )}
            
            <div className="relative">
              <button onClick={() => setIsNotiOpen(!isNotiOpen)} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {isNotiOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotiOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 z-50 transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between p-3 border-b border-gray-50 bg-gray-50/50 sticky top-0 z-10">
                      <p className="text-sm font-semibold text-gray-900">알림</p>
                      {unreadCount > 0 && (
                        <button onClick={async () => {
                          const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
                          await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${t}` }});
                          setNotifications(prev => prev.map(n => ({...n, is_read: true})));
                        }} className="text-xs text-[#107C41] hover:underline">모두 읽음</button>
                      )}
                    </div>
                    <div className="flex flex-col relative z-0">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">새로운 알림이 없습니다.</div>
                      ) : (
                        notifications.map((noti) => (
                          <div 
                            key={noti.id} 
                            onClick={async () => {
                              if (!noti.is_read) {
                                const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
                                await fetch(`/api/notifications/${noti.id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${t}` }});
                                setNotifications(prev => prev.map(n => n.id === noti.id ? {...n, is_read: true} : n));
                              }
                              setIsNotiOpen(false);
                              if (noti.link) window.location.href = noti.link;
                            }}
                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!noti.is_read ? 'bg-blue-50/30' : ''}`}
                          >
                            <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center">
                              {!noti.is_read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>}
                              {noti.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">{noti.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(noti.created_at).toLocaleString('ko-KR')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
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
                      <Link href="/login" onClick={() => {
                        localStorage.removeItem("erp_user_token");
                        localStorage.removeItem("erp_user_access_token");
                      }} className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
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
