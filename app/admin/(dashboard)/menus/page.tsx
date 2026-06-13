"use client";

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    url: '',
    icon: 'Circle',
    parent_id: null as number | null,
    sort_order: 10
  });

  const [draggedMenuId, setDraggedMenuId] = useState<number | null>(null);
  const [dragOverMenuId, setDragOverMenuId] = useState<number | null>(null);

  const fetchMenus = () => {
    fetch("http://localhost:8000/api/menus")
      .then(res => res.json())
      .then(data => setMenus(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenModal = (menu?: any) => {
    if (menu) {
      setEditMode(true);
      setFormData({
        id: menu.id,
        name: menu.name,
        url: menu.url || '',
        icon: menu.icon || '',
        parent_id: menu.parent_id,
        sort_order: menu.sort_order
      });
    } else {
      setEditMode(false);
      setFormData({
        id: 0,
        name: '',
        url: '',
        icon: 'Circle',
        parent_id: null,
        sort_order: 10
      });
    }
    setIconSearchQuery('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editMode ? 'PUT' : 'POST';
    const url = editMode ? `http://localhost:8000/api/menus/${formData.id}` : `http://localhost:8000/api/menus`;
    
    let sortOrder = formData.sort_order;
    if (!editMode) {
      const siblings = menus.filter(m => m.parent_id === formData.parent_id);
      if (siblings.length > 0) {
        sortOrder = Math.max(...siblings.map(m => m.sort_order)) + 10;
      } else {
        sortOrder = 10;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url || null,
          icon: formData.icon || null,
          parent_id: formData.parent_id || null,
          sort_order: sortOrder
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchMenus();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 메뉴를 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/menus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMenus();
      } else {
        const error = await res.json();
        alert(error.detail || "삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedMenuId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent, id: number, parentId: number | null) => {
    e.preventDefault();
    if (draggedMenuId === null || draggedMenuId === id) return;
    
    const draggedMenu = menus.find(m => m.id === draggedMenuId);
    if (!draggedMenu || draggedMenu.parent_id !== parentId) return;

    setDragOverMenuId(id);
  };

  const handleDragLeave = () => {
    setDragOverMenuId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverMenuId(null);
    if (draggedMenuId === null || draggedMenuId === targetId) {
      setDraggedMenuId(null);
      return;
    }

    const draggedMenu = menus.find(m => m.id === draggedMenuId);
    const targetMenu = menus.find(m => m.id === targetId);
    if (!draggedMenu || !targetMenu || draggedMenu.parent_id !== targetMenu.parent_id) {
      setDraggedMenuId(null);
      return;
    }

    const siblings = menus
      .filter(m => m.parent_id === draggedMenu.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const oldIndex = siblings.findIndex(m => m.id === draggedMenuId);
    const newIndex = siblings.findIndex(m => m.id === targetId);

    const newSiblings = [...siblings];
    const [movedItem] = newSiblings.splice(oldIndex, 1);
    newSiblings.splice(newIndex, 0, movedItem);

    const updates = newSiblings.map((m, index) => ({
      id: m.id,
      sort_order: (index + 1) * 10
    }));

    const newMenus = menus.map(m => {
      const update = updates.find(u => u.id === m.id);
      if (update) return { ...m, sort_order: update.sort_order };
      return m;
    });
    
    setMenus(newMenus);
    setDraggedMenuId(null);

    try {
      const res = await fetch("http://localhost:8000/api/menus/batch-sort", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menus: updates })
      });
      if (!res.ok) {
        alert("순서 저장에 실패했습니다.");
        fetchMenus();
      }
    } catch (err) {
      console.error(err);
      fetchMenus();
    }
  };

  const handleDragEnd = () => {
    setDraggedMenuId(null);
    setDragOverMenuId(null);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">메뉴 관리</h1>
          <p className="text-sm text-gray-500 mt-1">대시보드 좌측 사이드바에 표시되는 동적 메뉴를 설정합니다.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-[#107C41] text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center">
          <Icons.Plus className="w-4 h-4 mr-2" />
          새 메뉴 추가
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold text-center w-16">이동</th>
                <th className="px-6 py-4 font-semibold w-20">아이콘</th>
              <th className="px-6 py-4 font-semibold">메뉴명</th>
              <th className="px-6 py-4 font-semibold">경로 (URL)</th>
              <th className="px-6 py-4 font-semibold text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {menus.filter(m => !m.parent_id).sort((a,b) => a.sort_order - b.sort_order).map((parent) => (
              <React.Fragment key={parent.id}>
                <tr 
                  className={`transition-colors group bg-white ${draggedMenuId === parent.id ? 'opacity-40' : 'hover:bg-gray-50'} ${dragOverMenuId === parent.id ? 'bg-green-50 shadow-[inset_0_2px_0_0_#107C41]' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, parent.id)}
                  onDragOver={(e) => handleDragOver(e, parent.id, null)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, parent.id)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium text-center cursor-grab active:cursor-grabbing group-hover:text-gray-700">
                    <Icons.GripVertical className="w-4 h-4 mx-auto text-gray-300 group-hover:text-[#107C41] transition-colors" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="p-2 bg-gray-100 rounded-lg inline-flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      {renderIcon(parent.icon)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{parent.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{parent.url || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(parent)} className="text-gray-400 hover:text-[#107C41] transition-colors p-2">
                      <Icons.Edit2 className="w-4 h-4" />
                    </button>
                    {menus.filter(m => m.parent_id === parent.id).length === 0 && (
                      <button onClick={() => handleDelete(parent.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 ml-1">
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                {menus.filter(m => m.parent_id === parent.id).sort((a,b) => a.sort_order - b.sort_order).map((child) => (
                  <tr 
                    key={child.id} 
                    className={`transition-colors group bg-gray-50/30 ${draggedMenuId === child.id ? 'opacity-40' : 'hover:bg-gray-50'} ${dragOverMenuId === child.id ? 'bg-green-50 shadow-[inset_0_2px_0_0_#107C41]' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, child.id)}
                    onDragOver={(e) => handleDragOver(e, child.id, parent.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, child.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <td className="px-6 py-3 text-sm text-gray-400 font-medium text-center cursor-grab active:cursor-grabbing group-hover:text-gray-600">
                      <Icons.GripVertical className="w-3.5 h-3.5 mx-auto text-gray-300 group-hover:text-[#107C41] transition-colors" />
                    </td>
                    <td className="px-6 py-3"></td>
                    <td className="px-6 py-3 pl-10 text-sm font-medium text-gray-700 flex items-center">
                      <div className="w-4 h-px bg-gray-300 mr-2"></div>
                      {child.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 font-mono">{child.url}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleOpenModal(child)} className="text-gray-400 hover:text-[#107C41] transition-colors p-1.5">
                        <Icons.Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(child.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 ml-1">
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {menus.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                  <Icons.Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  메뉴 데이터를 불러오는 중이거나 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editMode ? '메뉴 수정' : '새 메뉴 추가'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상위 메뉴</label>
                <select value={formData.parent_id || ''} onChange={e => setFormData({...formData, parent_id: e.target.value ? Number(e.target.value) : null})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none bg-white">
                  <option value="">(최상위 메뉴로 설정)</option>
                  {menus.filter(m => !m.parent_id && m.id !== formData.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">상위 메뉴를 지정하면 2차(하위) 메뉴가 됩니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경로 URL {formData.parent_id ? '*' : ''}</label>
                <input required={!!formData.parent_id} type="text" placeholder="/admin/..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none font-mono" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">아이콘 선택</label>
                  <div className="relative">
                    <Icons.Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1.5" />
                    <input 
                      type="text" 
                      placeholder="아이콘 영문 검색 (예: user)" 
                      value={iconSearchQuery} 
                      onChange={e => setIconSearchQuery(e.target.value)} 
                      className="w-48 pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#107C41] outline-none" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 h-44 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                  {Object.keys(Icons)
                    .filter(key => key !== 'createLucideIcon' && key !== 'default')
                    .filter(key => key.toLowerCase().includes(iconSearchQuery.toLowerCase()))
                    .slice(0, 140) // 성능을 위해 최대 140개 노출
                    .map(iconName => {
                      const IconComponent = (Icons as any)[iconName];
                      if (typeof IconComponent !== 'function' && typeof IconComponent !== 'object') return null;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({...formData, icon: iconName})}
                          className={`p-2 flex items-center justify-center rounded-lg transition-all ${formData.icon === iconName ? 'bg-[#107C41] text-white shadow-md ring-2 ring-[#107C41]/20 scale-110 z-10' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-100 shadow-sm'}`}
                          title={iconName}
                        >
                          <IconComponent className="w-5 h-5" />
                        </button>
                      );
                  })}
                  {Object.keys(Icons).filter(key => key.toLowerCase().includes(iconSearchQuery.toLowerCase())).length === 0 && (
                    <div className="col-span-7 text-center text-gray-400 text-xs py-10 flex flex-col items-center">
                      <Icons.SearchX className="w-6 h-6 mb-2 text-gray-300" />
                      검색 결과가 없습니다. 영문으로 검색해보세요.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#107C41] rounded-lg hover:bg-green-700 transition-colors shadow-sm">{editMode ? '수정 사항 저장' : '메뉴 추가'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
