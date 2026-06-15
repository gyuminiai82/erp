"use client";

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Check, X, User, Clock4, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/DialogProvider";

export default function LeaveApprovalsPage() {
  const { showAlert, showConfirm } = useDialog();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllLeaves = async () => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch('/api/leaves/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      } else {
        console.error("Failed to fetch leaves or unauthorized");
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    const isConfirm = await showConfirm(`정말로 ${status} 처리하시겠습니까?`);
    if (!isConfirm) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch(`/api/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        await showAlert(`${status} 처리되었습니다.`, { type: 'success' });
        fetchAllLeaves();
      } else {
        const err = await res.json();
        await showAlert(`처리 실패: ${err.detail || '알 수 없는 오류'}`, { type: 'error' });
      }
    } catch (e) {
      console.error(e);
      await showAlert("처리 중 오류가 발생했습니다.", { type: 'error' });
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
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            휴가 결재 관리
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            부서원들이 제출한 휴가 신청 내역을 확인하고 승인 또는 반려 처리합니다.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-6 font-semibold w-48">신청자 정보</th>
                <th className="py-3 px-6 font-semibold">휴가 종류</th>
                <th className="py-3 px-6 font-semibold">기간</th>
                <th className="py-3 px-6 font-semibold">사유</th>
                <th className="py-3 px-6 font-semibold w-35">현재 상태</th>
                <th className="py-3 px-6 font-semibold w-20">결재</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    처리할 휴가 결재 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{l.employee?.name || '알 수 없음'}</span>
                          <span className="text-xs text-gray-500 border-l border-gray-300 pl-2">
                            {l.employee?.department || '-'} • {l.employee?.position || '-'}
                          </span>
                          {l.remaining_balance !== undefined && l.remaining_balance !== null && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">잔여: {l.remaining_balance}일</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {l.leave_type}
                      </span>
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      {l.start_date === l.end_date ? (
                        <span className="font-medium text-gray-800">{l.start_date}</span>
                      ) : (
                        <span className="font-medium text-gray-800">{l.start_date} <span className="text-gray-400 font-normal mx-1">~</span> {l.end_date}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-gray-600 max-w-xs truncate" title={l.reason}>
                      {l.reason || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {getStatusBadge(l.status)}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === '대기' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 whitespace-nowrap"
                              onClick={() => handleStatusUpdate(l.id, '승인')}
                              disabled={loading}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              승인
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 whitespace-nowrap"
                              onClick={() => handleStatusUpdate(l.id, '반려')}
                              disabled={loading}
                            >
                              <X className="w-4 h-4 mr-1" />
                              반려
                            </Button>
                          </>
                        )}
                        {l.status !== '대기' && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">처리 완료</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
