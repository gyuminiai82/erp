"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Search, List, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AttendanceStatusPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchAttendances(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const fetchAttendances = async (year: number, month: number) => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const res = await fetch(`/api/attendances/all?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
           // fallback if backend is not updated yet
           setAttendances(data);
           setLeaves([]);
        } else {
           setAttendances(data.attendances || []);
           setLeaves(data.leaves || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevDay = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
  };

  const handleNextDay = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const hd = new (require('date-holidays'))('KR');
    
    const weeks = [];
    let days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-100 bg-gray-50/50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAttendances = attendances.filter(a => a.work_date === dateStr);
      const dayLeaves = leaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
      
      const onTime = dayAttendances.filter(a => a.status === '정상').length;
      const late = dayAttendances.filter(a => a.status === '지각').length;
      const early = dayAttendances.filter(a => a.status === '조퇴').length;
      const absent = dayAttendances.filter(a => a.status === '결근').length;
      const leaveCount = dayLeaves.length;
      
      const holidayObj = hd.isHoliday(new Date(year, month, day));
      const isHoliday = holidayObj && holidayObj.length > 0 && holidayObj[0].type === 'public';
      const holidayName = isHoliday ? holidayObj[0].name : '';
      const isSunday = new Date(year, month, day).getDay() === 0;
      
      days.push(
        <div 
          key={day} 
          className="h-32 border border-gray-200 bg-white p-2 flex flex-col cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => {
            setSelectedDay(new Date(year, month, day));
          }}
        >
          <div className={`font-semibold text-sm flex items-center gap-1 ${isHoliday || isSunday ? 'text-red-500' : 'text-gray-700'}`}>
            {day}
            {isHoliday && <span className="text-[10px] font-medium bg-red-50 text-red-600 px-1 rounded border border-red-100">{holidayName}</span>}
          </div>
          <div className="mt-2 space-y-1">
            {onTime > 0 && <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded truncate">정상: {onTime}명</div>}
            {late > 0 && <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded truncate">지각: {late}명</div>}
            {early > 0 && <div className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded truncate">조퇴: {early}명</div>}
            {absent > 0 && <div className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded truncate">결근: {absent}명</div>}
            {leaveCount > 0 && <div className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded truncate">휴가: {leaveCount}명</div>}
          </div>
        </div>
      );
      
      if (days.length === 7) {
        weeks.push(<div key={`week-${weeks.length}`} className="grid grid-cols-7">{days}</div>);
        days = [];
      }
    }
    
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<div key={`empty-end-${days.length}`} className="h-32 border border-gray-100 bg-gray-50/50"></div>);
      }
      weeks.push(<div key={`week-${weeks.length}`} className="grid grid-cols-7">{days}</div>);
    }

    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`py-3 text-center text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
              {d}
            </div>
          ))}
        </div>
        {weeks}
      </div>
    );
  };

  const renderTimeline = () => {
    const targetDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    let dayData = attendances.filter(a => a.work_date === targetDateStr);
    let dayLeavesData = leaves.filter(l => l.start_date <= targetDateStr && l.end_date >= targetDateStr);
    
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      dayData = dayData.filter(a => 
        (a.employee?.name && a.employee.name.toLowerCase().includes(kw)) ||
        (a.employee?.department && a.employee.department.toLowerCase().includes(kw))
      );
      dayLeavesData = dayLeavesData.filter(l => 
        (l.employee?.name && l.employee.name.toLowerCase().includes(kw)) ||
        (l.employee?.department && l.employee.department.toLowerCase().includes(kw))
      );
    }
    
    const START_HOUR = 6;
    const END_HOUR = 22;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    
    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-800">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 {currentDate.getDate()}일 타임라인</h3>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="이름 또는 부서 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="w-48 flex-shrink-0 p-3 font-semibold text-sm text-gray-600 border-r border-gray-200 flex items-center">
                직원 정보
              </div>
              <div className="flex-1 relative h-10 flex">
                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                  <div key={i} className="flex-1 relative">
                    <span className="absolute -left-3 top-1 text-xs text-gray-400">{START_HOUR + i}:00</span>
                    {i === TOTAL_HOURS - 1 && (
                      <span className="absolute -right-3 top-1 text-xs text-gray-400">{START_HOUR + i + 1}:00</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {dayData.length === 0 && dayLeavesData.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  해당 일자의 출근 및 휴가 기록이 없습니다.
                </div>
              ) : (
                (() => {
                  const employeeMap = new Map();
                  dayData.forEach(a => {
                     if (a.employee) employeeMap.set(a.employee_id || a.employee.id, { emp: a.employee, attendance: a, leave: null });
                  });
                  dayLeavesData.forEach(l => {
                     if (l.employee) {
                        const id = l.employee_id || l.employee.id;
                        if (employeeMap.has(id)) {
                           employeeMap.get(id).leave = l;
                        } else {
                           employeeMap.set(id, { emp: l.employee, attendance: null, leave: l });
                        }
                     }
                  });
                  const combinedRecords = Array.from(employeeMap.values());
                  
                  return combinedRecords.map(item => {
                    const emp = item.emp;
                    const record = item.attendance;
                    const leave = item.leave;
                    
                    let leftPercent = 0;
                    let widthPercent = 0;
                    
                    if (record && record.check_in) {
                      const checkInTimeStr = record.check_in.split('T')[1] || record.check_in.split(' ')[1];
                      if (checkInTimeStr) {
                        const [hh, mm] = checkInTimeStr.split(':').map(Number);
                        const decimalHours = hh + (mm / 60);
                        leftPercent = Math.max(0, ((decimalHours - START_HOUR) / TOTAL_HOURS) * 100);
                        
                        let outDecimal = 24;
                        if (record.check_out) {
                          const checkOutTimeStr = record.check_out.split('T')[1] || record.check_out.split(' ')[1];
                          if (checkOutTimeStr) {
                            const [out_hh, out_mm] = checkOutTimeStr.split(':').map(Number);
                            outDecimal = out_hh + (out_mm / 60);
                          }
                        } else {
                           const now = new Date();
                           if (currentDate.getDate() === now.getDate() && currentDate.getMonth() === now.getMonth()) {
                              outDecimal = now.getHours() + (now.getMinutes() / 60);
                           }
                        }
                        widthPercent = Math.min(100 - leftPercent, ((outDecimal - (START_HOUR + (leftPercent/100*TOTAL_HOURS))) / TOTAL_HOURS) * 100);
                      }
                    }
                    
                    return (
                      <div key={record ? record.id : `leave-${leave?.id}`} className="relative flex hover:bg-gray-50 transition-colors">
                        <div className="w-48 flex-shrink-0 p-3 text-sm border-r border-gray-200">
                          <div className="font-semibold text-gray-800">{emp?.name || '알 수 없음'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{emp?.department || '-'} • {emp?.position || '-'}</div>
                        </div>
                        <div className="flex-1 relative py-2">
                          <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-gray-100 border-dashed"></div>
                            ))}
                          </div>
                          
                          {record && record.check_in && (
                            <div 
                              className="absolute top-1/2 transform -translate-y-1/2 h-6 bg-blue-500/90 rounded shadow-sm border border-blue-600 flex items-center px-2 z-10 hover:bg-blue-600 cursor-pointer"
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              title={`출근: ${record.check_in} ${record.check_out ? '| 퇴근: ' + record.check_out : ''}`}
                            >
                              {widthPercent > 10 && (
                                <span className="text-[10px] text-white font-medium truncate">
                                  {record.check_in.substring(11, 16)} - {record.check_out ? record.check_out.substring(11, 16) : '진행중'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {leave && (
                          <div className="absolute top-1/2 transform -translate-y-1/2 left-52 z-20">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 shadow-sm border border-purple-200">
                              {leave.leave_type}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            전체 근태 현황
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            조직 내 전 직원의 출퇴근 기록 및 근태 상태를 모니터링합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4" />
              캘린더
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setViewMode('timeline')}
            >
              <BarChart2 className="w-4 h-4" />
              타임라인
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <button onClick={viewMode === 'calendar' ? handlePrevMonth : handlePrevDay} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-lg font-bold text-gray-800 w-48 text-center">
          {viewMode === 'calendar' 
            ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
            : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`
          }
        </span>
        <button onClick={viewMode === 'calendar' ? handleNextMonth : handleNextDay} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          onClick={() => setCurrentDate(new Date())}
          className="ml-4 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          오늘
        </button>
      </div>

      {viewMode === 'calendar' ? renderCalendar() : renderTimeline()}

      {/* Detail Modal for Calendar Day Click */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDay.getFullYear()}년 {selectedDay.getMonth() + 1}월 {selectedDay.getDate()}일 근태 상세
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold border-b">이름</th>
                    <th className="py-3 px-4 font-semibold border-b">부서/직급</th>
                    <th className="py-3 px-4 font-semibold border-b">출근 시간</th>
                    <th className="py-3 px-4 font-semibold border-b">퇴근 시간</th>
                    <th className="py-3 px-4 font-semibold border-b">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendances.filter(a => a.work_date === `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`).map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-800">{a.employee?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{a.employee?.department || '-'} / {a.employee?.position || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{a.check_in?.substring(11, 16) || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{a.check_out?.substring(11, 16) || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                          ${a.status === '정상' ? 'bg-green-100 text-green-700' : 
                            a.status === '지각' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendances.filter(a => a.work_date === `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">기록이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
