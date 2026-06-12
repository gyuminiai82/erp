"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [roleMenus, setRoleMenus] = useState<any[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/roles")
      .then(res => res.json())
      .then(data => setRoles(data));
      
    fetch("http://localhost:8000/api/menus")
      .then(res => res.json())
      .then(data => setMenus(data));
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setIsLoadingMenus(true);
      fetch(`http://localhost:8000/api/roles/${selectedRole}/menus`)
        .then(res => res.json())
        .then(data => {
          setRoleMenus(data);
          setIsLoadingMenus(false);
        })
        .catch(() => setIsLoadingMenus(false));
    } else {
      setRoleMenus([]);
    }
  }, [selectedRole]);

  const handleTogglePermission = (menuId: number, permField: string) => {
    let newRoleMenus = [...roleMenus];
    let menuPerm = newRoleMenus.find(rm => rm.menu_id === menuId);
    
    if (!menuPerm) {
      menuPerm = { menu_id: menuId, can_read: false, can_write: false, can_delete: false, can_print: false };
      menuPerm[permField] = true;
      newRoleMenus.push(menuPerm);
    } else {
      menuPerm[permField] = !menuPerm[permField];
      if (!menuPerm.can_read && !menuPerm.can_write && !menuPerm.can_delete && !menuPerm.can_print) {
        newRoleMenus = newRoleMenus.filter(rm => rm.menu_id !== menuId);
      }
    }
    setRoleMenus(newRoleMenus);
    
    if (selectedRole) {
      fetch(`http://localhost:8000/api/roles/${selectedRole}/menus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: newRoleMenus })
      });
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className="w-4 h-4 text-gray-500 mr-2" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">롤(권한) 설정</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 직급별로 접근 가능한 사이드바 메뉴를 매핑합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center justify-between">
            <span>직급 목록</span>
            <button className="text-[#107C41] hover:underline text-xs font-medium">추가</button>
          </div>
          <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
            {roles.map(role => (
              <li 
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-between ${selectedRole === role.id ? 'bg-[#f0fdf4] border-l-4 border-[#107C41]' : 'border-l-4 border-transparent'}`}
              >
                <div>
                  <p className={`text-sm font-semibold ${selectedRole === role.id ? 'text-[#107C41]' : 'text-gray-800'}`}>{role.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                </div>
                <Icons.ChevronRight className={`w-4 h-4 ${selectedRole === role.id ? 'text-[#107C41]' : 'text-gray-300'}`} />
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-1 md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[600px] flex flex-col">
          {selectedRole ? (
            <>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    <span className="text-[#107C41] font-bold mr-1">{roles.find(r => r.id === selectedRole)?.name}</span> 
                    권한 설정
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">해당 직급의 상세 메뉴 접근 권한을 관리합니다. (자동 저장)</p>
                </div>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto relative">
                {isLoadingMenus && (
                  <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <Icons.Loader2 className="w-6 h-6 text-[#107C41] animate-spin mb-2" />
                      <span className="text-xs font-medium text-gray-600">불러오는 중...</span>
                    </div>
                  </div>
                )}
                {menus.filter(m => !m.parent_id).sort((a,b) => a.sort_order - b.sort_order).map(parent => {
                  const childMenus = menus.filter(m => m.parent_id === parent.id).sort((a,b) => a.sort_order - b.sort_order);
                  if (childMenus.length === 0) return null;
                  
                  return (
                    <div key={parent.id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center">
                        <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center mr-3 shadow-sm">
                          {renderIcon(parent.icon)}
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">{parent.name}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {childMenus.map(menu => {
                          const menuPerm = roleMenus.find(rm => rm.menu_id === menu.id) || { can_read: false, can_write: false, can_delete: false, can_print: false };
                          const isChecked = menuPerm.can_read || menuPerm.can_write || menuPerm.can_delete || menuPerm.can_print;
                          
                          return (
                            <div key={menu.id} className={`p-4 transition-all flex flex-col xl:flex-row xl:items-center justify-between ${isChecked ? 'bg-green-50/10' : 'hover:bg-gray-50'}`}>
                              <div className="mb-3 xl:mb-0 flex-1">
                                <div className="flex items-center text-sm font-semibold text-gray-900">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></div>
                                  {menu.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono mt-1 ml-3.5 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{menu.url || '-'}</div>
                              </div>
                              
                              <div className="flex items-center space-x-5 ml-3.5 xl:ml-0 bg-white xl:bg-transparent p-2.5 xl:p-0 rounded-lg border border-gray-100 xl:border-none shadow-sm xl:shadow-none">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                  <input type="checkbox" checked={menuPerm.can_read} onChange={() => handleTogglePermission(menu.id, 'can_read')} className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" />
                                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">조회</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                  <input type="checkbox" checked={menuPerm.can_write} onChange={() => handleTogglePermission(menu.id, 'can_write')} className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" />
                                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">등록/수정</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                  <input type="checkbox" checked={menuPerm.can_delete} onChange={() => handleTogglePermission(menu.id, 'can_delete')} className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" />
                                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">삭제</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                  <input type="checkbox" checked={menuPerm.can_print} onChange={() => handleTogglePermission(menu.id, 'can_print')} className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" />
                                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">출력</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <Icons.ShieldAlert className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">직급을 선택해주세요</h3>
              <p className="text-gray-500 text-sm">좌측에서 직급을 선택하면<br/>접근 가능한 메뉴 권한을 설정할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
