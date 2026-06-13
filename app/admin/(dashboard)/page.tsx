"use client";

import React from 'react';
import { Users, ShieldAlert, Activity, Database, HardDrive, AlertTriangle, Cpu, Terminal } from 'lucide-react';
import { useWebSocket } from './layout';

export default function AdminDashboardPage() {
  const { activeSessions, systemMetrics } = useWebSocket();
  
  // Use websocket metrics if available, otherwise fallback to 0
  const metrics = systemMetrics || {
    cpu_percent: 0,
    ram_used_gb: 0,
    ram_total_gb: 0,
    ram_percent: 0,
    disk_percent: 0
  };

  return (
    <div className="transition-opacity duration-500 ease-in-out opacity-100 pb-10 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">시스템 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">Minstudio ERP 시스템 인프라 및 운영 상태 요약입니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Recent System Logs Table (Spans 2 columns, stretches full height) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">최근 보안 및 감사 로그</h3>
            <button className="text-sm text-[#107C41] font-medium hover:underline">로그 전체 보기</button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">시간</th>
                  <th className="px-6 py-4 font-medium">이벤트</th>
                  <th className="px-6 py-4 font-medium">사용자/IP</th>
                  <th className="px-6 py-4 font-medium text-center">위험도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">10분 전</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Terminal className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">계정 권한 변경</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">EMP23001 사원의 권한을 '부서장'으로 변경</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">admin@minstudio.com</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                      INFO
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">45분 전</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <ShieldAlert className="w-4 h-4 text-red-500 mr-2" />
                      <span className="font-medium text-gray-900">비밀번호 연속 실패</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">EMP19002 계정으로 로그인 실패 5회 초과</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-red-600">203.0.113.45 (미확인 IP)</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                      HIGH
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">2시간 전</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-indigo-400 mr-2" />
                      <span className="font-medium text-gray-900">데이터베이스 자동 백업 완료</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">정기 백업(erp_backup_260612.sql) 생성됨</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">System</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                      SYS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">3시간 전</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                      <span className="font-medium text-gray-900">외부 API 호출 한도 근접</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">SMS 발송 API 일일 한도의 90% 도달</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">System</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                      WARN
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Stacked Cards */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Stat Card: Active Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">현재 활성 세션</p>
                <h3 className="text-3xl font-bold text-gray-900">{activeSessions}<span className="text-sm font-normal text-gray-500 ml-1">명</span></h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm relative z-10">
              <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                동시 접속
              </span>
              <span className="text-gray-400 ml-2">최대 수용량의 8%</span>
            </div>
          </div>

          {/* System Resource Usage */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">서버 리소스 현황</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col space-y-6">
              
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-gray-700">
                    <Cpu className="w-4 h-4 mr-2 text-gray-400" /> CPU 사용률
                  </div>
                  <span className="text-sm font-bold text-gray-900">{metrics.cpu_percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-1000 ${metrics.cpu_percent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${metrics.cpu_percent}%` }}></div>
                </div>
              </div>

              {/* RAM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-gray-700">
                    <Activity className="w-4 h-4 mr-2 text-gray-400" /> 메모리 (RAM)
                  </div>
                  <span className="text-sm font-bold text-gray-900">{metrics.ram_used_gb} / {metrics.ram_total_gb} GB</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-1000 ${metrics.ram_percent > 85 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${metrics.ram_percent}%` }}></div>
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-medium text-gray-700">
                    <HardDrive className="w-4 h-4 mr-2 text-gray-400" /> 디스크 스토리지
                  </div>
                  <span className="text-sm font-bold text-gray-900">{metrics.disk_percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-1000 ${metrics.disk_percent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${metrics.disk_percent}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">실시간 연동 중</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
