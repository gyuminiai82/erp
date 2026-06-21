"use client";

import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { Button } from "@/components/ui/Button";

export default function StatementsPage() {
  const [activeTab, setActiveTab] = useState<'BS' | 'IS'>('BS');
  const [bsData, setBsData] = useState<any>(null);
  const [isData, setIsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      
      const [bsRes, isRes] = await Promise.all([
        fetch("/api/reports/statements?type=BS", { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch("/api/reports/statements?type=IS", { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (bsRes.ok) {
        setBsData(await bsRes.json());
      }
      if (isRes.ok) {
        setIsData(await isRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#107C41]"></div>
      </div>
    );
  }

  const renderBalanceSheet = () => {
    if (!bsData) return <div className="text-center p-8 text-gray-500">데이터가 없습니다.</div>;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">자산 (Assets)</h3>
          </div>
          <table className="w-full text-sm text-left text-gray-600">
            <tbody>
              {bsData.assets.items.length === 0 ? (
                <tr><td className="p-4 text-center text-gray-400">내역이 없습니다.</td></tr>
              ) : (
                bsData.assets.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3">[{item.code}] {item.name}</td>
                    <td className="px-6 py-3 text-right font-medium">{item.balance.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 font-bold text-gray-800">자산 총계</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-600 text-lg">
                  {bsData.assets.total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Liabilities & Equity */}
        <div className="flex flex-col space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">부채 (Liabilities)</h3>
            </div>
            <table className="w-full text-sm text-left text-gray-600">
              <tbody>
                {bsData.liabilities.items.length === 0 ? (
                  <tr><td className="p-4 text-center text-gray-400">내역이 없습니다.</td></tr>
                ) : (
                  bsData.liabilities.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3">[{item.code}] {item.name}</td>
                      <td className="px-6 py-3 text-right font-medium">{item.balance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-800">부채 총계</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600 text-lg">
                    {bsData.liabilities.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">자본 (Equity)</h3>
            </div>
            <table className="w-full text-sm text-left text-gray-600">
              <tbody>
                {bsData.equity.items.length === 0 ? (
                  <tr><td className="p-4 text-center text-gray-400">내역이 없습니다.</td></tr>
                ) : (
                  bsData.equity.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3">[{item.code}] {item.name}</td>
                      <td className="px-6 py-3 text-right font-medium">{item.balance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-800">자본 총계</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                    {bsData.equity.total.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 font-extrabold text-gray-900">부채와 자본 총계</td>
                  <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-xl">
                    {(bsData.liabilities.total + bsData.equity.total).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!isData) return <div className="text-center p-8 text-gray-500">데이터가 없습니다.</div>;

    const renderRows = (items: any[]) => {
      if (items.length === 0) return <tr><td colSpan={2} className="px-6 py-2 text-center text-gray-400 text-xs">내역 없음</td></tr>;
      return items.map((item, idx) => (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="px-6 py-2 pl-10 text-gray-600 border-b border-gray-50/50">[{item.code}] {item.name}</td>
          <td className="px-6 py-2 text-right font-medium text-gray-700 border-b border-gray-50/50">{item.balance.toLocaleString()}</td>
        </tr>
      ));
    };

    return (
      <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 text-left border-b border-gray-100 bg-slate-50">
          <h2 className="text-2xl font-extrabold text-gray-800">손익계산서 (Income Statement)</h2>
          <p className="text-gray-500 mt-1">기업의 경영성과를 나타내는 보고서입니다.</p>
        </div>
        <table className="w-full text-sm text-left">
          <tbody>
            {/* 1. 매출액 */}
            <tr className="bg-blue-50/30">
              <td className="px-6 py-4 font-bold text-gray-800">I. 매출액</td>
              <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg">{isData.revenues.total.toLocaleString()}</td>
            </tr>
            {renderRows(isData.revenues.items)}

            {/* 2. 매출원가 */}
            <tr className="bg-red-50/30">
              <td className="px-6 py-4 font-bold text-gray-800">II. 매출원가 (제조원가)</td>
              <td className="px-6 py-4 text-right font-bold text-gray-800 text-lg">{isData.cogs.total.toLocaleString()}</td>
            </tr>
            {renderRows(isData.cogs.items)}

            {/* 3. 매출총이익 */}
            <tr className="bg-gray-100/80 border-y border-gray-200">
              <td className="px-6 py-4 font-bold text-gray-900">III. 매출총이익</td>
              <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">{isData.summary.gross_profit.toLocaleString()}</td>
            </tr>

            {/* 4. 판매비와관리비 */}
            <tr className="bg-orange-50/30">
              <td className="px-6 py-4 font-bold text-gray-800">IV. 판매비와관리비</td>
              <td className="px-6 py-4 text-right font-bold text-gray-800 text-lg">{isData.sga.total.toLocaleString()}</td>
            </tr>
            {renderRows(isData.sga.items)}

            {/* 5. 영업이익 */}
            <tr className="bg-emerald-50 border-y border-gray-200">
              <td className="px-6 py-4 font-bold text-gray-900 text-base">V. 영업이익</td>
              <td className="px-6 py-4 text-right font-bold text-emerald-700 text-xl">{isData.summary.operating_profit.toLocaleString()}</td>
            </tr>

            {/* 6. 영업외수익 */}
            <tr>
              <td className="px-6 py-4 font-bold text-gray-800">VI. 영업외수익</td>
              <td className="px-6 py-4 text-right font-bold text-gray-800 text-lg">{isData.non_op_income.total.toLocaleString()}</td>
            </tr>
            {renderRows(isData.non_op_income.items)}

            {/* 7. 영업외비용 */}
            <tr>
              <td className="px-6 py-4 font-bold text-gray-800">VII. 영업외비용</td>
              <td className="px-6 py-4 text-right font-bold text-gray-800 text-lg">{isData.non_op_expenses.total.toLocaleString()}</td>
            </tr>
            {renderRows(isData.non_op_expenses.items)}

            {/* 8. 당기순이익 */}
            <tr className="bg-slate-800 text-white">
              <td className="px-6 py-5 font-extrabold text-lg">VIII. 당기순이익</td>
              <td className="px-6 py-5 text-right font-extrabold text-2xl">{isData.summary.net_income.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">재무제표</h1>
          <p className="text-gray-500">회사의 재무 상태와 경영 성과를 요약한 핵심 회계 보고서입니다.</p>
        </div>
        <Button onClick={fetchStatements} variant="outline" className="flex items-center text-gray-600 bg-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      <div className="mb-6 flex space-x-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('BS')}
          className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all flex items-center ${
            activeTab === 'BS' 
            ? 'bg-white text-[#107C41] border-t-2 border-x border-[#107C41] -mb-px shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <PieChart className="w-4 h-4 mr-2" />
          재무상태표 (B/S)
        </button>
        <button
          onClick={() => setActiveTab('IS')}
          className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all flex items-center ${
            activeTab === 'IS' 
            ? 'bg-white text-[#107C41] border-t-2 border-x border-[#107C41] -mb-px shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          손익계산서 (I/S)
        </button>
      </div>

      <div className="pb-10">
        {activeTab === 'BS' ? renderBalanceSheet() : renderIncomeStatement()}
      </div>
    </div>
  );
}
