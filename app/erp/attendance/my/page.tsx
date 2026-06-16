"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Coffee, CheckCircle, AlertCircle } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function MyAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    setCurrentMonth(`${y}-${m}`);
  }, []);

  useEffect(() => {
    if (currentMonth) {
      fetchData();
    }
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    const [year, month] = currentMonth.split('-');
    try {
      const res = await fetch(`/api/attendances/my?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        setLeaves(data.leaves || []);
      } else {
        setAttendances([]);
        setLeaves([]);
      }
    } catch (e) {
      console.error(e);
      setAttendances([]);
      setLeaves([]);
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

  // 통계 계산
  const workDays = attendances.length;
  const lateDays = attendances.filter(a => a.status === '지각').length;
  const leaveDays = leaves.length; // 간단히 건수로 계산

  // 캘린더 생성 로직
  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay();

  const renderCalendar = () => {
    if (!currentMonth) return null;
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 bg-gray-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const att = attendances.find(a => a.work_date === dateStr);
      const leave = leaves.find(l => l.start_date <= dateStr && l.end_date >= dateStr);
      
      const isWeekend = new Date(year, month - 1, d).getDay() === 0 || new Date(year, month - 1, d).getDay() === 6;

      days.push(
        <div key={d} className={`h-24 border border-gray-100 p-2 flex flex-col ${isWeekend ? 'bg-red-50/10' : 'bg-white'} hover:shadow-md transition-shadow relative group`}>
          <span className={`text-sm font-medium ${isWeekend ? 'text-red-400' : 'text-gray-700'}`}>{d}</span>
          
          <div className="mt-1 flex flex-col gap-1 text-xs">
            {leave && (
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-semibold w-fit">
                {leave.leave_type}
              </span>
            )}
            {att && (
              <>
                <span className="text-blue-600 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
                  {att.check_in?.substring(11, 16) || '-'}
                </span>
                <span className="text-orange-500 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1"></span>
                  {att.check_out?.substring(11, 16) || '-'}
                </span>
                {att.status === '지각' && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-red-100 text-red-600 px-1 rounded">지각</span>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-[#107C41]" />
            내 근태 현황
          </h1>
          <p className="text-gray-500">나의 월별 출결 및 휴가 현황을 확인합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mr-4">
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">총 출근일수</div>
            <div className="text-2xl font-bold text-gray-800">{workDays}일</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mr-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">지각 횟수</div>
            <div className="text-2xl font-bold text-red-600">{lateDays}회</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mr-4">
            <Coffee className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium mb-1">휴가 사용일</div>
            <div className="text-2xl font-bold text-purple-600">{leaveDays}일</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-bold text-gray-800 min-w-[120px] text-center text-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-[#107C41]" />
              {currentMonth}
            </div>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>출근시간</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>퇴근시간</div>
            <div className="flex items-center"><span className="px-1.5 bg-purple-100 text-purple-700 rounded-sm font-semibold mr-2 text-[10px]">휴가</span>휴가/반차</div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#107C41]"></div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-lg overflow-hidden shadow-sm">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={day} className={`py-2 text-center text-sm font-bold border-r border-b border-gray-100 bg-gray-50 
                  ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
