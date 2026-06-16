"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function MyPayslipPage() {
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useDialog();

  useEffect(() => {
    const today = new Date();
    // Default to previous month's payroll since this month might not be paid yet
    let m = today.getMonth(); // 0-indexed, so getMonth() is the previous month!
    let y = today.getFullYear();
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    const mm = m.toString().padStart(2, '0');
    setCurrentMonth(`${y}-${mm}`);
  }, []);

  useEffect(() => {
    if (currentMonth) {
      fetchPayrolls();
    }
  }, [currentMonth]);

  const fetchPayrolls = async () => {
    setLoading(true);
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    try {
      const res = await fetch(`/api/payrolls/my?month=${currentMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data);
      } else {
        setPayrolls([]);
      }
    } catch (e) {
      console.error(e);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setCurrentMonth(`${newY}-${newM.toString().padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setCurrentMonth(`${newY}-${newM.toString().padStart(2, '0')}`);
  };

  const handleDownload = () => {
    showAlert("명세서 PDF 다운로드 기능은 준비 중입니다.", { type: "info" });
  };

  const currentPayroll = payrolls.length > 0 ? payrolls[0] : null;

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-[#107C41]" />
            내 급여 명세서
          </h1>
          <p className="text-gray-500">월별 상세 급여 지급 내역을 확인합니다.</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-semibold text-gray-800 min-w-[120px] text-center flex items-center justify-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              {currentMonth}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium">
            <Download className="w-4 h-4 mr-2" />
            명세서 다운로드
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#107C41]"></div>
        </div>
      ) : currentPayroll ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden relative">
          {/* Header Pattern */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#107C41] to-emerald-400"></div>
          
          <div className="p-8 sm:p-10">
            <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{currentMonth.split('-')[0]}년 {parseInt(currentMonth.split('-')[1])}월 급여명세서</h2>
                <p className="text-gray-500 mt-2">지급일: {currentPayroll.payment_date}</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg p-4 text-left min-w-[200px]">
                  <div className="text-sm text-gray-500 mb-1">소속</div>
                  <div className="font-semibold text-gray-800 mb-3">{currentPayroll.department_name || '-'}</div>
                  <div className="text-sm text-gray-500 mb-1">성명</div>
                  <div className="font-semibold text-gray-800 text-lg">{currentPayroll.employee_name} ({currentPayroll.employee_no})</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Earnings */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-6 bg-blue-500 rounded-full mr-2"></span>
                  지급 내역
                </h3>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">기본급</span>
                    <span className="font-semibold text-gray-800">{currentPayroll.base_salary.toLocaleString()} 원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">상여 및 수당</span>
                    <span className="font-semibold text-gray-800">{currentPayroll.bonus.toLocaleString()} 원</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-700">지급 총액</span>
                    <span className="font-bold text-blue-600 text-lg">{(currentPayroll.base_salary + currentPayroll.bonus).toLocaleString()} 원</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-6 bg-red-500 rounded-full mr-2"></span>
                  공제 내역
                </h3>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">4대보험 및 세금 (합계)</span>
                    <span className="font-semibold text-gray-800">{currentPayroll.deductions.toLocaleString()} 원</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-700">공제 총액</span>
                    <span className="font-bold text-red-500 text-lg">{currentPayroll.deductions.toLocaleString()} 원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="mt-10 bg-gradient-to-br from-gray-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="flex flex-col sm:flex-row justify-between items-center relative z-10">
                <div className="mb-4 sm:mb-0 text-center sm:text-left">
                  <span className="block text-slate-300 font-medium mb-1">차인지급액 (실수령액)</span>
                  <span className="text-sm text-slate-400">지급 총액 - 공제 총액</span>
                </div>
                <div className="text-4xl font-bold tracking-tight">
                  {currentPayroll.net_pay.toLocaleString()} <span className="text-2xl font-normal text-slate-300">원</span>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center text-gray-400 text-sm">
              본 급여명세서는 전자결재를 통해 승인되었으며, 회사 직인 및 서명을 생략합니다.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{currentMonth} 급여 내역이 없습니다.</h3>
          <p className="text-gray-500">해당 월의 급여 대장이 아직 확정되지 않았거나 생성되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}
