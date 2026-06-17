"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Printer, Calendar, FileText } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

interface WithholdingSummary {
  payment_month: string;
  total_employees: number;
  total_gross_pay: number;
  total_income_tax: number;
  total_local_income_tax: number;
}

export default function WithholdingTaxPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [data, setData] = useState<WithholdingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { showAlert } = useDialog();

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setSelectedMonth(`${yyyy}-${mm}`);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch(`/api/taxes/withholding?month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
      <div className="flex justify-between items-end mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            원천징수이행상황신고서
          </h1>
          <p className="text-gray-500 mt-2">매월 국세청에 신고하는 원천세 내역을 조회하고 출력합니다.</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="outline-none text-gray-700 bg-transparent"
            />
          </div>
          <Button onClick={handlePrint} className="bg-gray-800 hover:bg-gray-900 text-white shadow-sm">
            <Printer className="w-4 h-4 mr-2" /> 인쇄
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-800 shadow-lg print:border-none print:shadow-none p-10 print:p-0 mx-auto" style={{ minHeight: '1050px' }}>
          {/* Header */}
          <div className="text-center border-b-4 border-gray-800 pb-6 mb-8">
            <h2 className="text-3xl font-black tracking-widest">원천징수이행상황신고서</h2>
            <div className="mt-4 text-sm font-semibold flex justify-center space-x-8">
              <span>[ 귀속연월 : {selectedMonth.split('-')[0]} 년 {selectedMonth.split('-')[1]} 월 ]</span>
              <span>[ 지급연월 : {selectedMonth.split('-')[0]} 년 {selectedMonth.split('-')[1]} 월 ]</span>
            </div>
          </div>

          {/* Company Info */}
          <table className="w-full text-sm border-collapse border border-gray-800 mb-8">
            <tbody>
              <tr>
                <td className="w-32 bg-gray-100 font-bold border border-gray-800 p-2 text-center">상 호 (법인명)</td>
                <td className="border border-gray-800 p-2">민스튜디오(주)</td>
                <td className="w-32 bg-gray-100 font-bold border border-gray-800 p-2 text-center">사업자등록번호</td>
                <td className="border border-gray-800 p-2">123-45-67890</td>
              </tr>
              <tr>
                <td className="bg-gray-100 font-bold border border-gray-800 p-2 text-center">성 명 (대표자)</td>
                <td className="border border-gray-800 p-2">김실수</td>
                <td className="bg-gray-100 font-bold border border-gray-800 p-2 text-center">전 화 번 호</td>
                <td className="border border-gray-800 p-2">02-1234-5678</td>
              </tr>
              <tr>
                <td className="bg-gray-100 font-bold border border-gray-800 p-2 text-center">소 재 지</td>
                <td colSpan={3} className="border border-gray-800 p-2">서울특별시 강남구 테헤란로 123</td>
              </tr>
            </tbody>
          </table>

          {/* Details */}
          <div className="mb-2 font-bold text-lg">1. 원천징수 명세 및 납부세액</div>
          <table className="w-full text-sm border-collapse border border-gray-800 text-center mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan={2} className="border border-gray-800 p-2">소득구분</th>
                <th className="border border-gray-800 p-2 w-16">코드</th>
                <th className="border border-gray-800 p-2 w-20">인원</th>
                <th className="border border-gray-800 p-2 w-32">총지급액</th>
                <th className="border border-gray-800 p-2 w-32">징수세액 (소득세)</th>
                <th className="border border-gray-800 p-2 w-32">가감계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={4} className="bg-gray-50 font-bold border border-gray-800 p-2 w-16">근로<br/>소득</td>
                <td className="border border-gray-800 p-2 text-left px-4">간이세액 (A01)</td>
                <td className="border border-gray-800 p-2 text-gray-500">A01</td>
                <td className="border border-gray-800 p-2 text-right px-4">{data?.total_employees || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4">{data?.total_gross_pay?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4">{data?.total_income_tax?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4 bg-yellow-50 font-bold">{data?.total_income_tax?.toLocaleString() || 0}</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-2 text-left px-4">중도퇴사 (A02)</td>
                <td className="border border-gray-800 p-2 text-gray-500">A02</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-2 text-left px-4">일용근로 (A03)</td>
                <td className="border border-gray-800 p-2 text-gray-500">A03</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
                <td className="border border-gray-800 p-2 text-right px-4">0</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-800 p-2 text-center">근로소득 계 (A10)</td>
                <td className="border border-gray-800 p-2">A10</td>
                <td className="border border-gray-800 p-2 text-right px-4 text-blue-800">{data?.total_employees || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4 text-blue-800">{data?.total_gross_pay?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4 text-blue-800">{data?.total_income_tax?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-2 text-right px-4 bg-yellow-100 text-red-600">{data?.total_income_tax?.toLocaleString() || 0}</td>
              </tr>
              {/* Padding empty rows to match official form look */}
              <tr>
                <td colSpan={2} className="bg-gray-50 font-bold border border-gray-800 p-2">사업소득 (A25)</td>
                <td className="border border-gray-800 p-2 text-gray-500">A25</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
              </tr>
              <tr>
                <td colSpan={2} className="bg-gray-50 font-bold border border-gray-800 p-2">기타소득 (A40)</td>
                <td className="border border-gray-800 p-2 text-gray-500">A40</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
                <td className="border border-gray-800 p-2">0</td>
              </tr>
              <tr className="bg-gray-200 font-black text-base">
                <td colSpan={2} className="border border-gray-800 p-3">총 합 계 (A99)</td>
                <td className="border border-gray-800 p-3">A99</td>
                <td className="border border-gray-800 p-3 text-right px-4">{data?.total_employees || 0}</td>
                <td className="border border-gray-800 p-3 text-right px-4">{data?.total_gross_pay?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-3 text-right px-4">{data?.total_income_tax?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-3 text-right px-4 bg-yellow-200 text-red-700">{data?.total_income_tax?.toLocaleString() || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* Local Tax */}
          <div className="mb-2 font-bold text-lg">2. 지방소득세 (특별징수분) 명세</div>
          <table className="w-full text-sm border-collapse border border-gray-800 text-center mb-12">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 p-2 w-32">과세표준 (소득세액)</th>
                <th className="border border-gray-800 p-2 w-32">지방소득세 (10%)</th>
                <th className="border border-gray-800 p-2 w-32">가감계 (납부할세액)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 p-3 text-right px-6">{data?.total_income_tax?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-3 text-right px-6">{data?.total_local_income_tax?.toLocaleString() || 0}</td>
                <td className="border border-gray-800 p-3 text-right px-6 bg-yellow-50 font-bold text-red-600">{data?.total_local_income_tax?.toLocaleString() || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer Statement */}
          <div className="text-center mt-16 text-sm">
            <p className="mb-4">「소득세법」 제127조, 제128조 및 「지방세법」 제84조에 따라 위와 같이 원천징수세액을 신고합니다.</p>
            <div className="flex justify-end pr-12 mt-8 items-center">
              <span className="mr-8">{selectedMonth.split('-')[0]} 년 {selectedMonth.split('-')[1]} 월 일</span>
              <span className="font-bold">신 고 인 (원천징수의무자) : </span>
              <span className="mx-4">김실수</span>
              <span className="text-xs text-gray-500">(서명 또는 인)</span>
            </div>
            <div className="mt-16 text-xl font-black tracking-widest text-gray-800">
              세 무 서 장  귀 하
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
