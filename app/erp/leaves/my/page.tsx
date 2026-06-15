"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Send, CheckCircle2, XCircle, Clock4, FileText, PieChart } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LeaveApplicationPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    leave_type: '연차',
    reason: ''
  });
  const [balance, setBalance] = useState<{total_days: number, used_days: number, remaining_days: number} | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMyLeaves = async () => {
    try {
      const token = localStorage.getItem('erp_token') || localStorage.getItem('erp_access_token');
      const res = await fetch('/api/leaves/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('erp_token') || localStorage.getItem('erp_access_token');
      const res = await fetch('/api/leaves/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
    fetchBalance();
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    setForm(f => ({ ...f, start_date: today, end_date: today }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start_date > form.end_date) {
      alert("종료일이 시작일보다 빠를 수 없습니다.");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token') || localStorage.getItem('erp_access_token');
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert("휴가 신청이 완료되었습니다. 관리자 승인을 기다려주세요.");
        setForm(f => ({ ...f, reason: '' }));
        fetchMyLeaves();
        fetchBalance();
      } else {
        const err = await res.json();
        alert(`신청 실패: ${err.detail || '알 수 없는 오류'}`);
      }
    } catch (e) {
      console.error(e);
      alert("휴가 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === '승인') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> 승인됨</span>;
    if (status === '반려') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> 반려됨</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock4 className="w-3 h-3" /> 결재 대기</span>;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            휴가 신청
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            연차, 반차 등의 휴가를 신청하고 결재 진행 상태를 확인합니다.
          </p>
        </div>

        {balance && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-900">나의 연차 현황</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-blue-600/70 text-xs">총 연차</span>
                <span className="font-semibold text-blue-900">{balance.total_days}일</span>
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600/70 text-xs">사용 연차</span>
                <span className="font-semibold text-blue-900">{balance.used_days}일</span>
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600/70 text-xs">잔여 연차</span>
                <span className="font-semibold text-blue-700 text-base">{balance.remaining_days}일</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 신청 폼 */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            신청서 작성
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">휴가 종류</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={form.leave_type}
                onChange={(e) => setForm({...form, leave_type: e.target.value})}
              >
                <option value="연차">연차</option>
                <option value="오전반차">오전반차</option>
                <option value="오후반차">오후반차</option>
                <option value="병가">병가</option>
                <option value="공가">공가</option>
                <option value="특별휴가">특별휴가</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <Input 
                  type="date" 
                  value={form.start_date}
                  onChange={(e) => setForm({...form, start_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <Input 
                  type="date" 
                  value={form.end_date}
                  onChange={(e) => setForm({...form, end_date: e.target.value})}
                  required
                />
              </div>
            </div>
            
            {(form.leave_type === '오전반차' || form.leave_type === '오후반차') && form.start_date !== form.end_date && (
              <p className="text-xs text-red-500">반차는 하루만 신청 가능합니다.</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                rows={4}
                placeholder="휴가 사유를 입력하세요 (선택)"
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              {loading ? '신청 중...' : '휴가 신청하기'}
            </Button>
          </form>
        </div>

        {/* 신청 내역 */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">나의 신청 내역</h3>
            <span className="text-sm text-gray-500">최근 신청순</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-6 font-semibold">기간</th>
                  <th className="py-3 px-6 font-semibold">종류</th>
                  <th className="py-3 px-6 font-semibold">사유</th>
                  <th className="py-3 px-6 font-semibold text-center">결재 상태</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500">
                      휴가 신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6">
                        {l.start_date === l.end_date ? (
                          <span className="font-medium text-gray-800">{l.start_date}</span>
                        ) : (
                          <span className="font-medium text-gray-800">{l.start_date} <span className="text-gray-400 font-normal">~</span> {l.end_date}</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {l.leave_type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-600 truncate max-w-[200px]">
                        {l.reason || '-'}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {getStatusBadge(l.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
