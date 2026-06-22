"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function AttendanceSettingsPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: "",
    policy_type: "FIXED",
    work_start_time: "09:00:00",
    work_end_time: "18:00:00",
    break_start_time: "12:00:00",
    break_end_time: "13:00:00",
    break_time_mins: 60,
    core_time_start: "10:00:00",
    core_time_end: "15:00:00",
    required_work_hours: 8,
    is_default: false
  });
  const { showAlert, showConfirm } = useDialog();

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/attendance-policies");
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleTimeChange = (field: string, val: string) => {
    if (val.length === 5) val += ":00";
    setFormData({...formData, [field]: val});
  };

  const handleSave = async () => {
    try {
      const method = formData.id ? "PUT" : "POST";
      const url = formData.id 
        ? `/api/attendance-policies/${formData.id}`
        : `/api/attendance-policies`;

      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("저장 실패");
      
      setIsModalOpen(false);
      fetchPolicies();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("정말 삭제하시겠습니까?", { type: "error" });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch(`/api/attendance-policies/${id}`, {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "삭제 실패");
      }
      fetchPolicies();
    } catch (err: any) {
      await showAlert(err.message, { type: "error" });
    }
  };

  const openModal = (policy: any = null) => {
    if (policy) {
      setFormData(policy);
    } else {
      setFormData({
        id: null,
        name: "",
        policy_type: "FIXED",
        work_start_time: "09:00:00",
        work_end_time: "18:00:00",
        break_start_time: "12:00:00",
        break_end_time: "13:00:00",
        break_time_mins: 60,
        core_time_start: "10:00:00",
        core_time_end: "15:00:00",
        required_work_hours: 8,
        is_default: false
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">근태 기준 설정</h1>
          <p className="text-sm text-gray-500 mt-1">출퇴근 시간 및 지각 기준 등 다양한 근무 형태를 관리합니다.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          신규 기준 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {policies.map(p => (
          <div key={p.id} className={`bg-white border ${p.is_default ? 'border-blue-400 shadow-md ring-1 ring-blue-400' : 'border-gray-200 shadow-sm'} rounded-2xl p-6 relative`}>
            {p.is_default && (
              <span className="absolute -top-3 left-6 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                기본 정책
              </span>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => openModal(p)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {p.policy_type === "FLEXIBLE" ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>필수 근무시간</span>
                  <span className="font-semibold text-gray-900">{p.required_work_hours}시간</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">코어 타임</span>
                  <span className="font-semibold text-gray-900">{p.core_time_start?.substring(0,5)} ~ {p.core_time_end?.substring(0,5)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">휴게 시간</span>
                  <span className="font-semibold text-gray-900">{p.break_time_mins}분 자동 공제</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>근무 시간</span>
                  <span className="font-semibold text-gray-900">{p.work_start_time?.substring(0,5)} ~ {p.work_end_time?.substring(0,5)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">휴게 시간</span>
                  <span className="font-semibold text-gray-900">{p.break_start_time?.substring(0,5)} ~ {p.break_end_time?.substring(0,5)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900">{formData.id ? '근태 정책 수정' : '새 근태 정책 추가'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">정책 이름</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" placeholder="예: 유연근무제(10-19)" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">근무 유형</label>
                <div className="flex space-x-4 mb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" value="FIXED" checked={formData.policy_type === "FIXED"} onChange={e => setFormData({...formData, policy_type: "FIXED"})} className="text-blue-600 focus:ring-blue-600" />
                    <span className="text-sm font-medium">고정 출퇴근제</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" value="FLEXIBLE" checked={formData.policy_type === "FLEXIBLE"} onChange={e => setFormData({...formData, policy_type: "FLEXIBLE"})} className="text-purple-600 focus:ring-purple-600" />
                    <span className="text-sm font-medium">선택적 유연근무제</span>
                  </label>
                </div>
              </div>

              {formData.policy_type === "FIXED" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">출근 시간</label>
                      <input type="time" value={formData.work_start_time?.substring(0,5) || ""} onChange={e => handleTimeChange("work_start_time", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">퇴근 시간</label>
                      <input type="time" value={formData.work_end_time?.substring(0,5) || ""} onChange={e => handleTimeChange("work_end_time", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴게 시작</label>
                      <input type="time" value={formData.break_start_time?.substring(0,5) || ""} onChange={e => handleTimeChange("break_start_time", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">휴게 종료</label>
                      <input type="time" value={formData.break_end_time?.substring(0,5) || ""} onChange={e => handleTimeChange("break_end_time", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">코어타임 시작</label>
                      <input type="time" value={formData.core_time_start?.substring(0,5) || ""} onChange={e => handleTimeChange("core_time_start", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">코어타임 종료</label>
                      <input type="time" value={formData.core_time_end?.substring(0,5) || ""} onChange={e => handleTimeChange("core_time_end", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">필수 총 근무시간 (시간)</label>
                      <input type="number" value={formData.required_work_hours} onChange={e => setFormData({...formData, required_work_hours: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">자동 휴무 공제 (분)</label>
                      <input type="number" value={formData.break_time_mins} onChange={e => setFormData({...formData, break_time_mins: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">기본 근무 정책으로 지정 (신규 사원 자동 적용)</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-2 bg-gray-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
