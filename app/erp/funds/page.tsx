"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/Button";

interface FundItem {
  code: string;
  name: string;
  balance: number;
}

interface FundSection {
  total: number;
  details: FundItem[];
}

interface FundsData {
  cash_equivalents: FundSection;
  receivables: FundSection;
  payables: FundSection;
}

export default function FundsPage() {
  const [data, setData] = useState<FundsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch("/api/reports/funds", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#107C41]"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>;

  const { cash_equivalents, receivables, payables } = data;
  const net_liquidity = cash_equivalents.total + receivables.total - payables.total;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">자금 현황</h1>
          <p className="text-gray-500">현재 보유 중인 현금성 자산과 채권, 채무 현황을 한눈에 파악합니다.</p>
        </div>
        <Button onClick={fetchFunds} variant="outline" className="flex items-center text-gray-600 bg-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center text-gray-500 mb-4 whitespace-nowrap">
            <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-medium truncate">보유 자금 (현금성)</span>
          </div>
          <div className="text-2xl 2xl:text-3xl font-bold text-gray-800 break-keep">
            {cash_equivalents.total.toLocaleString()} <span className="text-base 2xl:text-lg font-normal text-gray-500 ml-1">원</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center text-gray-500 mb-4 whitespace-nowrap">
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="font-medium truncate">받을 돈 (채권)</span>
          </div>
          <div className="text-2xl 2xl:text-3xl font-bold text-gray-800 break-keep">
            {receivables.total.toLocaleString()} <span className="text-base 2xl:text-lg font-normal text-gray-500 ml-1">원</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center text-gray-500 mb-4 whitespace-nowrap">
            <div className="w-10 h-10 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="font-medium truncate">갚을 돈 (채무)</span>
          </div>
          <div className="text-2xl 2xl:text-3xl font-bold text-gray-800 break-keep">
            {payables.total.toLocaleString()} <span className="text-base 2xl:text-lg font-normal text-gray-500 ml-1">원</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-md text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="flex items-center text-slate-300 mb-4 z-10 whitespace-nowrap">
            <span className="font-medium truncate">순유동자금 예상액</span>
          </div>
          <div className="text-2xl 2xl:text-3xl font-bold z-10 break-keep">
            {net_liquidity.toLocaleString()} <span className="text-base 2xl:text-lg font-normal text-slate-400 ml-1">원</span>
          </div>
        </div>
      </div>

      {/* Details Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cash Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">현금성 자산 상세</h3>
          </div>
          <div className="p-0">
            {cash_equivalents.details.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">내역이 없습니다.</div>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <tbody>
                  {cash_equivalents.details.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                        <span className="text-xs text-gray-400 mr-2">[{item.code}]</span>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800 break-keep">
                        {item.balance.toLocaleString()} 원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Receivables Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">채권 상세</h3>
          </div>
          <div className="p-0">
            {receivables.details.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">내역이 없습니다.</div>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <tbody>
                  {receivables.details.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                        <span className="text-xs text-gray-400 mr-2">[{item.code}]</span>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800 break-keep">
                        {item.balance.toLocaleString()} 원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payables Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-red-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">채무 상세</h3>
          </div>
          <div className="p-0">
            {payables.details.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">내역이 없습니다.</div>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <tbody>
                  {payables.details.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-ellipsis overflow-hidden max-w-[150px]">
                        <span className="text-xs text-gray-400 mr-2">[{item.code}]</span>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800 break-keep">
                        {item.balance.toLocaleString()} 원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
