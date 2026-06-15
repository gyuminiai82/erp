"use client";

import React, { useState, useEffect } from 'react';
import { Settings2, Save } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState({
    emp_no_prefix: "EMP",
    emp_no_year_format: "YY",
    emp_no_length: 3,
    national_pension_rate: 0.0475,
    health_insurance_rate: 0.03595,
    long_term_care_rate: 0.1314,
    employment_insurance_rate: 0.009,
    overtime_multiplier: 1.5,
    holiday_multiplier: 1.5,
    holiday_overtime_multiplier: 2.0
  });
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert } = useDialog();

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setSettings({
          emp_no_prefix: data.emp_no_prefix || "EMP",
          emp_no_year_format: data.emp_no_year_format || "YY",
          emp_no_length: data.emp_no_length || 3,
          national_pension_rate: data.national_pension_rate ?? 0.0475,
          health_insurance_rate: data.health_insurance_rate ?? 0.03595,
          long_term_care_rate: data.long_term_care_rate ?? 0.1314,
          employment_insurance_rate: data.employment_insurance_rate ?? 0.009,
          overtime_multiplier: data.overtime_multiplier ?? 1.5,
          holiday_multiplier: data.holiday_multiplier ?? 1.5,
          holiday_overtime_multiplier: data.holiday_overtime_multiplier ?? 2.0
        });
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        emp_no_prefix: settings.emp_no_prefix,
        emp_no_year_format: settings.emp_no_year_format,
        emp_no_length: Number(settings.emp_no_length),
        national_pension_rate: Number(settings.national_pension_rate),
        health_insurance_rate: Number(settings.health_insurance_rate),
        long_term_care_rate: Number(settings.long_term_care_rate),
        employment_insurance_rate: Number(settings.employment_insurance_rate),
        overtime_multiplier: Number(settings.overtime_multiplier),
        holiday_multiplier: Number(settings.holiday_multiplier),
        holiday_overtime_multiplier: Number(settings.holiday_overtime_multiplier)
      };
      
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("저장 실패");
      
      await showAlert("급여/보험료 정책이 성공적으로 저장되었습니다.", { type: "success" });
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">급여/보험료 정책 관리</h1>
          <p className="text-sm text-gray-500 mt-1">4대 보험 요율 및 수당 계산 정책을 관리합니다.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 첫 번째 카드: 수당 할증률 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-red-50 p-2 rounded-lg mr-3">
              <span className="font-bold text-red-600 text-lg">#</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">법정 수당 할증률 설정</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">초과근무(야근) 및 주말 출근 시 적용될 수당 배수를 설정합니다.</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">평일 연장근로 배수</label>
              <input 
                type="number" step="0.1" 
                value={settings.overtime_multiplier} 
                onChange={e => setSettings({...settings, overtime_multiplier: Number(e.target.value)})} 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
              <p className="text-xs text-gray-400 mt-1">예: 1.5 (통상임금의 150%)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴일(주말) 기본 배수 (8시간 이내)</label>
              <input 
                type="number" step="0.1" 
                value={settings.holiday_multiplier} 
                onChange={e => setSettings({...settings, holiday_multiplier: Number(e.target.value)})} 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴일(주말) 연장 배수 (8시간 초과)</label>
              <input 
                type="number" step="0.1" 
                value={settings.holiday_overtime_multiplier} 
                onChange={e => setSettings({...settings, holiday_overtime_multiplier: Number(e.target.value)})} 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
          </div>
        </div>

        {/* 두 번째 카드: 4대보험 요율 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <span className="font-bold text-blue-600 text-lg">#</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">4대 보험 공제 요율</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">근로자 부담분 기준 요율을 소수로 입력하세요 (예: 4.5% = 0.045).</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">국민연금</label>
              <input 
                type="number" step="0.0001" 
                value={settings.national_pension_rate} 
                onChange={e => setSettings({...settings, national_pension_rate: Number(e.target.value)})} 
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">건강보험</label>
              <input 
                type="number" step="0.0001" 
                value={settings.health_insurance_rate} 
                onChange={e => setSettings({...settings, health_insurance_rate: Number(e.target.value)})} 
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">장기요양 (건보료의 %)</label>
              <input 
                type="number" step="0.0001" 
                value={settings.long_term_care_rate} 
                onChange={e => setSettings({...settings, long_term_care_rate: Number(e.target.value)})} 
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">고용보험</label>
              <input 
                type="number" step="0.0001" 
                value={settings.employment_insurance_rate} 
                onChange={e => setSettings({...settings, employment_insurance_rate: Number(e.target.value)})} 
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
