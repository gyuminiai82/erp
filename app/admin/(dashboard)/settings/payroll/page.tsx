"use client";

import React, { useState, useEffect } from 'react';
import { Settings2, Save } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState({
    emp_no_prefix: "EMP",
    emp_no_year_format: "YY",
    emp_no_length: 3,
    national_pension_rate: 0.045,
    health_insurance_rate: 0.03545,
    long_term_care_rate: 0.1295,
    employment_insurance_rate: 0.009,
    overtime_multiplier: 1.5
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
          national_pension_rate: data.national_pension_rate ?? 0.045,
          health_insurance_rate: data.health_insurance_rate ?? 0.03545,
          long_term_care_rate: data.long_term_care_rate ?? 0.1295,
          employment_insurance_rate: data.employment_insurance_rate ?? 0.009,
          overtime_multiplier: data.overtime_multiplier ?? 1.5
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
        overtime_multiplier: Number(settings.overtime_multiplier)
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

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <Settings2 className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">급여 및 4대보험 정책</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            매년 변경되는 4대 보험 요율과 초과근무 수당 배수를 설정합니다. 이 값은 사원 급여 자동 계산에 반영됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">국민연금 요율 (%)</label>
              <div className="relative">
                <input 
                  type="number" step="0.001"
                  value={Number((settings.national_pension_rate * 100).toFixed(3))} 
                  onChange={e => setSettings({...settings, national_pension_rate: Number(e.target.value) / 100})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">건강보험 요율 (%)</label>
              <div className="relative">
                <input 
                  type="number" step="0.001"
                  value={Number((settings.health_insurance_rate * 100).toFixed(3))} 
                  onChange={e => setSettings({...settings, health_insurance_rate: Number(e.target.value) / 100})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">고용보험 요율 (%)</label>
              <div className="relative">
                <input 
                  type="number" step="0.001"
                  value={Number((settings.employment_insurance_rate * 100).toFixed(3))} 
                  onChange={e => setSettings({...settings, employment_insurance_rate: Number(e.target.value) / 100})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">장기요양보험 요율 (%)</label>
              <div className="relative">
                <input 
                  type="number" step="0.001"
                  value={Number((settings.long_term_care_rate * 100).toFixed(3))} 
                  onChange={e => setSettings({...settings, long_term_care_rate: Number(e.target.value) / 100})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">건보료 대비 비율 (예: 12.95%)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">초과근무 수당 배수</label>
              <div className="relative">
                <input 
                  type="number" step="0.1"
                  value={settings.overtime_multiplier} 
                  onChange={e => setSettings({...settings, overtime_multiplier: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all pr-8"
                />
                <span className="absolute right-3 top-2 text-gray-400">배</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
