"use client";

import { useState, useEffect } from "react";
import { 
  FileSignature, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ERPDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch("/api/dashboard/summary", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard summary", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Minstudio ERP 대시보드</h1>
        <p className="text-gray-500">오늘의 핵심 업무 현황을 한눈에 파악하세요.</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 결재 대기 */}
        <div 
          onClick={() => router.push('/erp/approvals')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <FileSignature className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-medium mb-1">내 결재 대기함</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{summary?.pending_approvals || 0}</span>
              <span className="text-sm text-gray-500 font-medium">건</span>
            </div>
          </div>
        </div>

        {/* 오늘의 근태 */}
        <div 
          onClick={() => router.push('/erp/attendance/my')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
          </div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-medium mb-1">오늘의 출근 인원</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{summary?.attendance?.present || 0}</span>
              <span className="text-sm text-gray-500 font-medium">/ {summary?.attendance?.total || 0}명</span>
            </div>
          </div>
        </div>

        {/* 안전재고 미달 */}
        <div 
          onClick={() => router.push('/erp/inventory')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
          </div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-medium mb-1">안전재고 미달 품목</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">{summary?.low_stock_items?.length || 0}</span>
              <span className="text-sm text-gray-500 font-medium">건</span>
            </div>
          </div>
        </div>

        {/* 이번달 수주 요약 (가상의 지표) */}
        <div 
          onClick={() => router.push('/erp/orders')}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-medium mb-1">최근 영업 수주</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{summary?.recent_orders?.length || 0}</span>
              <span className="text-sm text-gray-500 font-medium">건 진행중</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Lists Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 최근 영업 수주 현황 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              최근 영업 수주 (Sales Orders)
            </h2>
            <button onClick={() => router.push('/erp/orders')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              전체 보기
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-100 uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">주문번호</th>
                  <th className="px-5 py-3 font-medium">거래처명</th>
                  <th className="px-5 py-3 font-medium text-right">총 금액</th>
                  <th className="px-5 py-3 font-medium text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary?.recent_orders?.length > 0 ? summary.recent_orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push('/erp/orders')}>
                    <td className="px-5 py-3 text-gray-900 font-mono font-medium">{order.order_no}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{order.client_name}</td>
                    <td className="px-5 py-3 text-right text-gray-900 font-bold">{order.total_amount.toLocaleString()}원</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      최근 수주 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 발주 필요 품목 (안전재고 미달) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              발주 필요 품목 (안전재고 미달)
            </h2>
            <button onClick={() => router.push('/erp/inventory')} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
              재고 관리로 이동
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-100 uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">품목코드</th>
                  <th className="px-5 py-3 font-medium">품목명</th>
                  <th className="px-5 py-3 font-medium text-right">현재 재고</th>
                  <th className="px-5 py-3 font-medium text-right">안전 재고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary?.low_stock_items?.length > 0 ? summary.low_stock_items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-red-50/50 transition-colors cursor-pointer" onClick={() => router.push('/erp/inventory')}>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{item.item_code}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium">{item.item_name}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">{item.current_stock}</span> {item.unit}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 font-medium">
                      {item.safety_stock} {item.unit}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      안전재고 미달 품목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
