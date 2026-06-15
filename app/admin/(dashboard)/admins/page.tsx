"use client";

import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, ShieldCheck, Mail, Calendar, Edit } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function SystemAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    username: "",
    email: "",
    password: "",
    is_active: true
  });
  const { showAlert, showConfirm } = useDialog();

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSave = async () => {
    try {
      const method = formData.id ? "PUT" : "POST";
      const url = formData.id 
        ? `/api/admins/${formData.id}`
        : `/api/admins`;
        
      const payload: any = {
        username: formData.username,
        email: formData.email,
        is_active: formData.is_active
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "저장 실패");
      }
      
      setIsModalOpen(false);
      setFormData({ id: null, username: "", email: "", password: "", is_active: true });
      fetchAdmins();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("해당 최고 관리자 계정을 삭제하시겠습니까?", { type: "error" });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "삭제 실패");
      }
      fetchAdmins();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
    }
  };

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">시스템 최고 관리자</h1>
          <p className="text-sm text-gray-500 mt-1">ERP 전체의 설정과 보안을 관리하는 최상위 계정입니다.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: null, username: "", email: "", password: "", is_active: true });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          신규 관리자 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">계정명</th>
              <th className="px-6 py-4">이메일</th>
              <th className="px-6 py-4 text-center">상태</th>
              <th className="px-6 py-4">생성일시</th>
              <th className="px-6 py-4">최근 접속</th>
              <th className="px-6 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                      {admin.username.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{admin.username}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
                        마스터
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {admin.email}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {admin.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(admin.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {admin.last_login ? new Date(admin.last_login).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => {
                        setFormData({
                          id: admin.id,
                          username: admin.username,
                          email: admin.email,
                          password: "",
                          is_active: admin.is_active
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50 transition-colors"
                      title="수정"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(admin.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  등록된 관리자 계정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                {formData.id ? '관리자 정보 수정' : '신규 관리자 추가'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">관리자 이름</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" 
                  placeholder="예: admin"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" 
                  placeholder="admin@minstudio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{formData.id ? '새 비밀번호' : '비밀번호'}</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" 
                  placeholder={formData.id ? '변경하지 않으려면 비워두세요' : ''}
                />
              </div>
              {formData.id && (
                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">계정 활성화 (비활성 시 로그인 불가)</span>
                  </label>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-2 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{formData.id ? '수정하기' : '추가하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
