"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, Database, AlertTriangle, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [severity, setSeverity] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, size, severity, keyword]);

  const fetchLogs = () => {
    setIsLoading(true);
    let url = `/api/audit-logs?page=${page}&size=${size}`;
    if (severity !== 'ALL') url += `&severity=${severity}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const getSeverityUI = (sev: string) => {
    switch(sev) {
      case 'HIGH':
        return { icon: <ShieldAlert className="w-4 h-4 text-red-500 mr-2" />, badge: 'bg-red-100 text-red-700', label: 'HIGH' };
      case 'WARNING':
        return { icon: <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />, badge: 'bg-amber-100 text-amber-700', label: 'WARN' };
      case 'SYSTEM':
        return { icon: <Database className="w-4 h-4 text-indigo-400 mr-2" />, badge: 'bg-gray-100 text-gray-600', label: 'SYS' };
      default:
        return { icon: <Terminal className="w-4 h-4 text-gray-400 mr-2" />, badge: 'bg-blue-100 text-blue-700', label: 'INFO' };
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / size) || 1;

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">감사 로그</h1>
        <p className="text-sm text-gray-500 mt-1">시스템에서 발생한 모든 주요 이벤트와 보안 변경 이력을 조회합니다.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
        {/* Top Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="이벤트, 이메일 검색..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41] bg-white transition-shadow shadow-sm"
            />
          </form>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative">
              <select 
                value={severity}
                onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:border-[#107C41] shadow-sm cursor-pointer"
              >
                <option value="ALL">전체 위험도</option>
                <option value="INFO">정보 (INFO)</option>
                <option value="WARNING">경고 (WARN)</option>
                <option value="HIGH">위험 (HIGH)</option>
                <option value="SYSTEM">시스템 (SYS)</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <select 
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:border-[#107C41] shadow-sm cursor-pointer"
            >
              <option value={20}>20개씩</option>
              <option value={50}>50개씩</option>
              <option value={100}>100개씩</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#107C41] rounded-full animate-spin mb-3"></div>
                <span className="text-sm font-medium text-gray-500">데이터 불러오는 중...</span>
              </div>
            </div>
          )}
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-semibold w-48">발생 일시</th>
                <th className="px-6 py-4 font-semibold w-24 text-center">위험도</th>
                <th className="px-6 py-4 font-semibold min-w-[200px]">이벤트 제목 및 상세</th>
                <th className="px-6 py-4 font-semibold w-48">사용자/계정</th>
                <th className="px-6 py-4 font-semibold w-32">접속 IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    조건에 일치하는 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const ui = getSeverityUI(log.severity);
                  return (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-gray-500 font-mono text-[13px]">{formatDateTime(log.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ui.badge}`}>
                          {ui.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center mb-1">
                          {ui.icon}
                          <span className="font-semibold text-gray-900">{log.event_title}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6 break-all whitespace-normal max-w-lg leading-relaxed">
                          {log.event_desc}
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-medium ${log.severity === 'HIGH' ? 'text-red-600' : 'text-gray-700'}`}>
                        {log.user_email === 'unknown' ? '미확인 사용자' : log.user_email}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {log.ip_address}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-900">{total}</span>개의 로그 중 <span className="font-bold text-gray-900">{(page - 1) * size + 1}</span>-
            <span className="font-bold text-gray-900">{Math.min(page * size, total)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                let pageNum = page - 2 + idx;
                if (page <= 3) pageNum = idx + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + idx;
                
                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      page === pageNum 
                        ? 'bg-[#107C41] text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
