"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

function SortableRoleItem({ role, selectedRole, setSelectedRole }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: role.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef} style={style}
      className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-between ${selectedRole === role.id ? 'bg-[#f0fdf4] border-l-4 border-[#107C41]' : 'border-l-4 border-transparent'}`}
    >
      <div 
        className="flex-1 h-full flex flex-col justify-center" 
        onClick={() => setSelectedRole(role.id)}
        onPointerDown={() => setSelectedRole(role.id)}
      >
        <p className={`text-sm font-semibold ${selectedRole === role.id ? 'text-[#107C41]' : 'text-gray-800'}`}>{role.name}</p>
        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
      </div>
      <div {...attributes} {...listeners} className="p-2 -mr-2 cursor-grab active:cursor-grabbing flex items-center justify-center rounded hover:bg-gray-100">
        <Icons.GripVertical className="w-4 h-4 text-gray-400" />
      </div>
    </li>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [roleMenus, setRoleMenus] = useState<any[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const { showAlert } = useDialog();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch("/api/roles")
      .then(res => res.json())
      .then(data => setRoles(data));
      
    fetch("/api/menus")
      .then(res => res.json())
      .then(data => setMenus(data));
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setIsLoadingMenus(true);
      fetch(`/api/roles/${selectedRole}/menus`)
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
      fetch(`/api/roles/${selectedRole}/menus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: newRoleMenus })
      });
    }
  };

  const handleToggleGroup = (childMenuIds: number[], turnOn: boolean) => {
    let newRoleMenus = [...roleMenus];
    
    if (turnOn) {
      childMenuIds.forEach(menuId => {
        let menuPerm = newRoleMenus.find(rm => rm.menu_id === menuId);
        if (!menuPerm) {
          newRoleMenus.push({ menu_id: menuId, can_read: true, can_write: true, can_delete: true, can_print: true });
        } else {
          menuPerm.can_read = true;
          menuPerm.can_write = true;
          menuPerm.can_delete = true;
          menuPerm.can_print = true;
        }
      });
    } else {
      newRoleMenus = newRoleMenus.filter(rm => !childMenuIds.includes(rm.menu_id));
    }
    
    setRoleMenus(newRoleMenus);
    
    if (selectedRole) {
      fetch(`/api/roles/${selectedRole}/menus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: newRoleMenus })
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setRoles((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // update backend
        const payload = newItems.map((item, idx) => ({ id: item.id, sort_order: idx }));
        fetch("/api/roles/batch-sort", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: payload })
        });
        
        return newItems;
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName) return;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
      });
      if (res.ok) {
        const addedRole = await res.json();
        setRoles([...roles, addedRole]);
        setIsAddModalOpen(false);
        setNewRoleName('');
        setNewRoleDesc('');
      } else {
        await showAlert("Failed to add role. Name might already exist.", { type: "error" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">권한 설정</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 권한별로 접근 가능한 사이드바 메뉴를 매핑합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center justify-between">
            <span>권한 목록</span>
            <button onClick={() => setIsAddModalOpen(true)} className="text-[#107C41] hover:underline text-xs font-medium">추가</button>
          </div>
          <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={roles.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {roles.map(role => (
                  <SortableRoleItem key={role.id} role={role} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
                ))}
              </SortableContext>
            </DndContext>
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
                  <p className="text-xs text-gray-500 mt-1">해당 권한의 상세 메뉴 접근 권한을 관리합니다. (자동 저장)</p>
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
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center mr-3 shadow-sm">
                            {renderIcon(parent.icon)}
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm">{parent.name}</h4>
                        </div>
                        
                        {(() => {
                          const childMenuIds = childMenus.map(m => m.id);
                          const isAllChecked = childMenuIds.every(id => {
                            const rm = roleMenus.find(r => r.menu_id === id);
                            return rm && rm.can_read && rm.can_write && rm.can_delete && rm.can_print;
                          });
                          const isSomeChecked = !isAllChecked && childMenuIds.some(id => {
                            const rm = roleMenus.find(r => r.menu_id === id);
                            return rm && (rm.can_read || rm.can_write || rm.can_delete || rm.can_print);
                          });

                          return (
                            <label className="flex items-center space-x-2 cursor-pointer group bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm hover:bg-gray-100 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={isAllChecked} 
                                ref={el => { if (el) el.indeterminate = isSomeChecked; }}
                                onChange={(e) => handleToggleGroup(childMenuIds, e.target.checked)} 
                                className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" 
                              />
                              <span className="text-xs font-semibold text-gray-700">전체 선택</span>
                            </label>
                          );
                        })()}
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
              <h3 className="text-gray-900 font-semibold mb-1">권한을 선택해주세요</h3>
              <p className="text-gray-500 text-sm">좌측에서 권한을 선택하면<br/>접근 가능한 메뉴 권한을 설정할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">새 권한 추가</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">권한 코드 (영문)</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={e => setNewRoleName(e.target.value)} 
                  placeholder="예: manager" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">권한명 (한글 설명)</label>
                <input 
                  type="text" 
                  value={newRoleDesc} 
                  onChange={e => setNewRoleDesc(e.target.value)} 
                  placeholder="예: 과장" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41]"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">취소</button>
              <button onClick={handleAddRole} className="px-4 py-2 text-sm font-medium text-white bg-[#107C41] hover:bg-[#0c5c30] rounded-lg transition-colors shadow-sm">추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
