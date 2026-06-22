"use client";

import React, { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function CompanySettingsPage() {
  const [info, setInfo] = useState({
    name: "",
    registration_number: "",
    representative: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    seal_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useDialog();

  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        setInfo(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleRegistrationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 10) val = val.substring(0, 10);
    
    let formatted = val;
    if (val.length > 5) {
      formatted = `${val.substring(0, 3)}-${val.substring(3, 5)}-${val.substring(5)}`;
    } else if (val.length > 3) {
      formatted = `${val.substring(0, 3)}-${val.substring(3)}`;
    }
    
    setInfo({...info, registration_number: formatted});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(info)
      });
      if (!res.ok) throw new Error("저장 실패");
      await showAlert("회사 정보가 성공적으로 저장되었습니다.", { type: "success" });
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">회사 기본 정보</h1>
          <p className="text-sm text-gray-500 mt-1">시스템에서 사용할 회사의 기본 정보를 관리합니다.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl">
        <div className="flex items-center mb-6">
          <div className="bg-blue-50 p-2 rounded-lg mr-3">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">기본 정보 입력</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">회사명</label>
            <input 
              type="text" 
              value={info.name || ''} 
              onChange={e => setInfo({...info, name: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">사업자등록번호</label>
            <input 
              type="text" 
              value={info.registration_number || ''} 
              onChange={handleRegistrationNumberChange}
              placeholder="000-00-00000"
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">대표자명</label>
            <input 
              type="text" 
              value={info.representative || ''} 
              onChange={e => setInfo({...info, representative: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">본사 주소</label>
            <input 
              type="text" 
              value={info.address || ''} 
              onChange={e => setInfo({...info, address: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">대표 이메일</label>
            <input 
              type="email" 
              value={info.contact_email || ''} 
              onChange={e => setInfo({...info, contact_email: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">대표 전화번호</label>
            <input 
              type="text" 
              value={info.contact_phone || ''} 
              onChange={e => setInfo({...info, contact_phone: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">회사 로고 이미지 URL</label>
            <input 
              type="text" 
              value={info.logo_url || ''} 
              onChange={e => setInfo({...info, logo_url: e.target.value})}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
            {info.logo_url && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg inline-block">
                <p className="text-xs text-gray-500 mb-2">미리보기:</p>
                <img src={info.logo_url} alt="로고 미리보기" className="max-h-20 object-contain" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">대표 직인 이미지 URL (근로계약서, 증명서 출력용)</label>
            <input 
              type="text" 
              value={info.seal_url || ''} 
              onChange={e => setInfo({...info, seal_url: e.target.value})}
              placeholder="https://example.com/seal.png"
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
            />
            {info.seal_url && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg inline-block">
                <p className="text-xs text-gray-500 mb-2">미리보기:</p>
                <img src={info.seal_url} alt="직인 미리보기" className="max-h-20 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
