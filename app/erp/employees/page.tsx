"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, FileDown } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department_id: '', position_id: '' });

  const fetchData = async () => {
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        fetch("http://localhost:8000/api/employees"),
        fetch("http://localhost:8000/api/departments"),
        fetch("http://localhost:8000/api/positions")
      ]);
      
      if (empRes.ok) setEmployees(await empRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (posRes.ok) setPositions(await posRes.json());
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmp.name,
          email: newEmp.email,
          department_id: Number(newEmp.department_id),
          position_id: newEmp.position_id ? Number(newEmp.position_id) : null,
          role_id: "employee" // Default role
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewEmp({ name: '', email: '', department_id: '', position_id: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || "생성 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">직원 데이터를 불러오는 중...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사원 관리</h1>
          <p className="text-gray-500">전체 임직원 목록 조회 및 신규 사원 등록을 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700">
            <FileDown className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            신규 사원 등록
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input className="pl-9 bg-white" placeholder="이름, 사번, 이메일 검색..." />
          </div>
          <select className="border-gray-200 rounded-lg text-sm bg-white px-3 focus:ring-blue-500 focus:border-blue-500">
            <option value="">모든 부서</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="border-gray-200 rounded-lg text-sm bg-white px-3 focus:ring-blue-500 focus:border-blue-500">
            <option value="">모든 직급</option>
            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-6 font-semibold">사번</th>
                <th className="py-3 px-6 font-semibold">이름</th>
                <th className="py-3 px-6 font-semibold">부서</th>
                <th className="py-3 px-6 font-semibold">직급</th>
                <th className="py-3 px-6 font-semibold">이메일</th>
                <th className="py-3 px-6 font-semibold">상태</th>
                <th className="py-3 px-6 font-semibold">입사일</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-6 text-gray-600 font-medium">{emp.emp_no}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{emp.name}</td>
                  <td className="py-4 px-6 text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {emp.department}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {emp.position}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{emp.email}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      emp.status === '재직' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{emp.hire_date || '-'}</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">등록된 사원이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">신규 사원 등록</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <Input value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="홍길동" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <Input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} placeholder="hong@minstudio.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서 지정</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newEmp.department_id}
                  onChange={e => setNewEmp({...newEmp, department_id: e.target.value})}
                >
                  <option value="">부서 선택</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급 지정</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newEmp.position_id}
                  onChange={e => setNewEmp({...newEmp, position_id: e.target.value})}
                >
                  <option value="">직급 선택</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">등록하기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
