"use client";

import React, { useState, useEffect } from 'react';
import { Settings2, Save, Hash } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emp_no_prefix: "EMP",
    emp_no_year_format: "YY",
    emp_no_length: 3
  });
  const [preview, setPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useDialog();

  useEffect(() => {
    fetch("http://localhost:8000/api/settings")
      .then(res => res.json())
      .then(data => {
        setSettings({
          emp_no_prefix: data.emp_no_prefix || "EMP",
          emp_no_year_format: data.emp_no_year_format || "YY",
          emp_no_length: data.emp_no_length || 3
        });
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Generate Preview
    const yearStr = settings.emp_no_year_format === "YY" ? "24" : 
                    settings.emp_no_year_format === "YYYY" ? "2024" : "";
    const seq = "1".padStart(Number(settings.emp_no_length) || 3, "0");
    setPreview(`${settings.emp_no_prefix}${yearStr}${seq}`);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        emp_no_prefix: settings.emp_no_prefix,
        emp_no_year_format: settings.emp_no_year_format,
        emp_no_length: Number(settings.emp_no_length)
      };
      
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("저장 실패");
      
      await showAlert("환경설정이 성공적으로 저장되었습니다.", { type: "success" });
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">시스템 환경설정</h1>
          <p className="text-sm text-gray-500 mt-1">ERP 시스템의 글로벌 규칙과 정책을 관리합니다.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#107C41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm flex items-center disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 사번 생성 규칙 섹션 */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-blue-50 p-2 rounded-lg mr-3">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">사번 자동 생성 규칙</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              신규 사원 등록 시 시스템이 자동으로 부여할 사번의 형태를 정의합니다.
              규칙을 변경하더라도 기존 사원들의 사번은 변경되지 않습니다.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">접두사 (Prefix)</label>
                <input 
                  type="text" 
                  value={settings.emp_no_prefix} 
                  onChange={e => setSettings({...settings, emp_no_prefix: e.target.value.toUpperCase()})}
                  className="w-full sm:w-1/2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all uppercase"
                  placeholder="예: EMP"
                />
                <p className="text-xs text-gray-400 mt-1">사번 맨 앞에 붙는 영문 대문자 문자열입니다.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">연도 포함 방식</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="year_fmt" value="YY" checked={settings.emp_no_year_format === "YY"} onChange={e => setSettings({...settings, emp_no_year_format: e.target.value})} className="text-[#107C41] focus:ring-[#107C41]" />
                    <span className="text-sm text-gray-700">2자리 연도 (예: 24)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="year_fmt" value="YYYY" checked={settings.emp_no_year_format === "YYYY"} onChange={e => setSettings({...settings, emp_no_year_format: e.target.value})} className="text-[#107C41] focus:ring-[#107C41]" />
                    <span className="text-sm text-gray-700">4자리 연도 (예: 2024)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="year_fmt" value="NONE" checked={settings.emp_no_year_format === "NONE"} onChange={e => setSettings({...settings, emp_no_year_format: e.target.value})} className="text-[#107C41] focus:ring-[#107C41]" />
                    <span className="text-sm text-gray-700">포함하지 않음</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">일련번호 자릿수</label>
                <select 
                  value={settings.emp_no_length} 
                  onChange={e => setSettings({...settings, emp_no_length: Number(e.target.value)})}
                  className="w-full sm:w-1/2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                >
                  <option value="3">3자리 (001~999)</option>
                  <option value="4">4자리 (0001~9999)</option>
                  <option value="5">5자리 (00001~99999)</option>
                </select>
              </div>
            </div>

            {/* Preview Box */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">실시간 미리보기</span>
              <span className="text-2xl font-mono font-bold text-[#107C41] tracking-tight">{preview}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
