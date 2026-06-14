"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, FileDown } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataGrid, ColumnDef } from "@/components/ui/DataGrid";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ 
    name: '', email: '', department_id: '', position_id: '',
    phone: '', birth_date: '', gender: '남성', address: '', employment_type: '정규직', resident_num: ''
  });

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
          role_id: "employee", // Default role
          phone: newEmp.phone || null,
          birth_date: newEmp.birth_date || null,
          gender: newEmp.gender || null,
          address: newEmp.address || null,
          employment_type: newEmp.employment_type || "정규직",
          resident_num: newEmp.resident_num || null,
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewEmp({ name: '', email: '', department_id: '', position_id: '', phone: '', birth_date: '', gender: '남성', address: '', employment_type: '정규직', resident_num: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || "생성 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ColumnDef[] = [
    { field: 'emp_no', headerName: '사번', width: 120 },
    { field: 'name', headerName: '이름', width: 120, editable: true },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 150,
      renderCell: (val: any) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{val}</span>
    },
    { 
      field: 'position', 
      headerName: '직급', 
      width: 100,
      renderCell: (val: any) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{val}</span>
    },
    { field: 'phone', headerName: '연락처', width: 150, editable: true },
    { field: 'employment_type', headerName: '고용형태', width: 120, editable: true },
    { 
      field: 'status', 
      headerName: '상태', 
      width: 100,
      renderCell: (val: any) => <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${val === '재직' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{val}</span>
    },
    { field: 'hire_date', headerName: '입사일', width: 120 }
  ];

  const handleDataChange = (rowIndex: number, field: string, newValue: any) => {
    const updated = [...employees];
    updated[rowIndex] = { ...updated[rowIndex], [field]: newValue };
    setEmployees(updated);
    // TODO: 연동을 원하시면 별도 PUT API 호출을 여기에 추가합니다.
  };

  if (loading) return <div className="p-8 text-gray-500 text-center">직원 데이터를 불러오는 중...</div>;

  return (
    <div className="w-full">
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

        <div className="overflow-hidden flex flex-col h-[600px] border-t border-gray-100">
          <DataGrid 
            columns={columns} 
            data={employees} 
            onDataChange={handleDataChange} 
            className="flex-1 border-none"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">신규 사원 등록</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* 기본 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">기본 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <Input value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <Input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} placeholder="hong@minstudio.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <Input value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} placeholder="010-0000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <Input type="date" value={newEmp.birth_date} onChange={e => setNewEmp({...newEmp, birth_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newEmp.gender}
                      onChange={e => setNewEmp({...newEmp, gender: e.target.value})}
                    >
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
                    <Input value={newEmp.resident_num} onChange={e => setNewEmp({...newEmp, resident_num: e.target.value})} placeholder="900101-1******" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <Input value={newEmp.address} onChange={e => setNewEmp({...newEmp, address: e.target.value})} placeholder="서울시 강남구..." />
                  </div>
                </div>
              </div>

              {/* 인사 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">인사 정보</h4>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">고용 형태</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newEmp.employment_type}
                      onChange={e => setNewEmp({...newEmp, employment_type: e.target.value})}
                    >
                      <option value="정규직">정규직</option>
                      <option value="계약직">계약직</option>
                      <option value="아르바이트">아르바이트</option>
                      <option value="인턴">인턴</option>
                      <option value="프리랜서">프리랜서</option>
                    </select>
                  </div>
                </div>
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
