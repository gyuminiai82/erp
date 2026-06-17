"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { FileSignature, FileBadge, X, Printer } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  
  // Modal states
  const [activeDocument, setActiveDocument] = useState<'contract' | 'certificate' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { showAlert } = useDialog();

  const fetchData = async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('token')) : '';
      const headers = { Authorization: `Bearer ${token}` };
      
      const [empRes, deptRes, posRes] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/departments", { headers }),
        fetch("/api/positions", { headers })
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        const deptData = deptRes.ok ? await deptRes.json() : [];
        const posData = posRes.ok ? await posRes.json() : [];
        
        setDepartments(deptData);
        setPositions(posData);
        
        // Map department and position names
        const enriched = empData.map((e: any) => ({
          ...e,
          department_name: deptData.find((d: any) => d.id === e.department_id)?.name || '-',
          position_name: posData.find((p: any) => p.id === e.position_id)?.name || '-'
        }));
        
        setEmployees(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnDef[] = [
    { field: 'emp_no', headerName: '사번', width: 120 },
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'department_name', headerName: '부서', width: 150 },
    { field: 'position_name', headerName: '직급', width: 100 },
    { field: 'hire_date', headerName: '입사일', width: 120 },
    { field: 'status', headerName: '상태', width: 100 },
  ];

  const handleIssueContract = () => {
    if (selectedRowIndices.length !== 1) {
      return showAlert("근로계약서를 발급할 직원을 한 명만 선택해주세요.", { type: "warning" });
    }
    setSelectedEmployee(employees[selectedRowIndices[0]]);
    setActiveDocument('contract');
  };

  const handleIssueCertificate = () => {
    if (selectedRowIndices.length !== 1) {
      return showAlert("증명서를 발급할 직원을 한 명만 선택해주세요.", { type: "warning" });
    }
    setSelectedEmployee(employees[selectedRowIndices[0]]);
    setActiveDocument('certificate');
  };

  const handlePrint = () => {
    window.print();
  };

  // Current Date formatting
  const today = new Date();
  const dateString = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="w-full">
      {/* Hide this entire main UI when printing */}
      <div className="print:hidden">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">증명서/계약서 발급</h1>
            <p className="text-gray-500">임직원의 근로계약서 및 재직/경력증명서를 생성하고 인쇄합니다.</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50" onClick={handleIssueContract}>
              <FileSignature className="w-4 h-4 mr-2" />
              근로계약서 발급
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleIssueCertificate}>
              <FileBadge className="w-4 h-4 mr-2" />
              재직/경력증명서 발급
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
          <DataGrid
            columns={columns}
            data={employees}
            showCheckboxes={true}
            selectedRowIndices={selectedRowIndices}
            onSelectionChange={setSelectedRowIndices}
          />
        </div>
      </div>

      {/* MODALS */}
      {activeDocument && selectedEmployee && (
        <>
          {/* Modal Overlay (Hidden when printing) */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">
                  {activeDocument === 'contract' ? '표준 근로계약서' : '재직/경력증명서'} 미리보기
                </h2>
                <div className="flex space-x-2">
                  <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Printer className="w-4 h-4 mr-2" />
                    인쇄 (PDF 저장)
                  </Button>
                  <button onClick={() => setActiveDocument(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center">
                {/* Print Content Wrapper */}
                <div className="bg-white shadow-md w-[210mm] min-h-[297mm] p-[20mm] relative">
                  {activeDocument === 'contract' ? (
                    <ContractDocument employee={selectedEmployee} dateString={dateString} />
                  ) : (
                    <CertificateDocument employee={selectedEmployee} dateString={dateString} />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* PRINT ONLY CONTENT */}
          <div className="hidden print:block w-[210mm] min-h-[297mm] bg-white text-black p-[20mm]">
            {activeDocument === 'contract' ? (
              <ContractDocument employee={selectedEmployee} dateString={dateString} />
            ) : (
              <CertificateDocument employee={selectedEmployee} dateString={dateString} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------
// Document Components
// -----------------------------------------------------

function ContractDocument({ employee, dateString }: { employee: any, dateString: string }) {
  return (
    <div className="text-gray-900 leading-relaxed font-sans">
      <h1 className="text-3xl font-bold text-center mb-12 tracking-widest">표준 근로계약서</h1>
      
      <p className="mb-6">(주)차세대ERP솔루션(이하 "사업주"라 함)과(와) <strong>{employee.name}</strong>(이하 "근로자"라 함)은(는) 다음과 같이 근로계약을 체결한다.</p>

      <div className="space-y-6">
        <section>
          <h2 className="font-bold text-lg mb-2">1. 근로계약기간</h2>
          <p className="pl-4">{employee.hire_date} 부터 기간의 정함이 없는 근로계약(정규직)으로 한다.</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">2. 근무장소 및 업무내용</h2>
          <ul className="list-disc pl-8">
            <li>근무장소: (주)차세대ERP솔루션 본사 (또는 사업주가 지정하는 장소)</li>
            <li>업무내용: {employee.department_name} 업무 및 사업주가 지시하는 제반 업무</li>
            <li>직급: {employee.position_name}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">3. 근로시간 및 휴게시간</h2>
          <ul className="list-disc pl-8">
            <li>근로시간: 09:00 ~ 18:00 (1일 8시간, 주 40시간)</li>
            <li>휴게시간: 12:00 ~ 13:00 (1시간)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">4. 임금</h2>
          <ul className="list-disc pl-8">
            <li>기본급: 월 {employee.base_salary ? employee.base_salary.toLocaleString() : '0'}원</li>
            <li>지급방법: 매월 지정된 급여일에 근로자 명의의 예금계좌로 입금한다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">5. 연차유급휴가 및 휴일</h2>
          <ul className="list-disc pl-8">
            <li>연차유급휴가는 근로기준법에서 정하는 바에 따른다.</li>
            <li>주휴일은 매주 일요일로 하며, 근로자의 날(5월 1일)은 유급휴일로 한다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">6. 기타 사항</h2>
          <p className="pl-4">본 계약에 명시되지 않은 사항은 취업규칙 및 근로기준법 등 관련 노동관계법령에 따른다.</p>
        </section>
      </div>

      <div className="mt-16 text-center">
        <p className="mb-12">{dateString}</p>
        
        <div className="flex justify-between px-10">
          <div className="text-left">
            <h3 className="font-bold mb-4">[사업주]</h3>
            <p>사업체명 : (주)차세대ERP솔루션</p>
            <p>대 표 자 : 김 대 표 (인)</p>
            <p>주 소 : 서울특별시 강남구 테헤란로 123</p>
          </div>
          
          <div className="text-left">
            <h3 className="font-bold mb-4">[근로자]</h3>
            <p>성 명 : {employee.name} (인)</p>
            <p>생년월일 : {employee.birth_date || '__________________'}</p>
            <p>주 소 : {employee.address || '__________________________________'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateDocument({ employee, dateString }: { employee: any, dateString: string }) {
  // Determine if currently employed to change title
  const isEmployed = employee.status === '재직';
  const title = isEmployed ? '재직증명서' : '경력증명서';

  return (
    <div className="text-gray-900 leading-relaxed font-sans h-full flex flex-col">
      <h1 className="text-4xl font-bold text-center mb-16 tracking-widest">{title}</h1>
      
      <table className="w-full border-collapse border-2 border-black mb-12">
        <tbody>
          <tr>
            <th className="border border-black p-4 bg-gray-50 w-1/4 text-center font-bold">성 명</th>
            <td className="border border-black p-4 w-1/4 text-center">{employee.name}</td>
            <th className="border border-black p-4 bg-gray-50 w-1/4 text-center font-bold">생년월일</th>
            <td className="border border-black p-4 w-1/4 text-center">{employee.birth_date || '-'}</td>
          </tr>
          <tr>
            <th className="border border-black p-4 bg-gray-50 text-center font-bold">주 소</th>
            <td colSpan={3} className="border border-black p-4">{employee.address || '-'}</td>
          </tr>
          <tr>
            <th className="border border-black p-4 bg-gray-50 text-center font-bold">소 속</th>
            <td className="border border-black p-4 text-center">{employee.department_name}</td>
            <th className="border border-black p-4 bg-gray-50 text-center font-bold">직 급</th>
            <td className="border border-black p-4 text-center">{employee.position_name}</td>
          </tr>
          <tr>
            <th className="border border-black p-4 bg-gray-50 text-center font-bold">재직기간</th>
            <td colSpan={3} className="border border-black p-4 text-center">
              {employee.hire_date} ~ {isEmployed ? '현재' : (employee.deleted_at?.split('T')[0] || '-')}
            </td>
          </tr>
          <tr>
            <th className="border border-black p-4 bg-gray-50 text-center font-bold">용 도</th>
            <td colSpan={3} className="border border-black p-4">제출용</td>
          </tr>
        </tbody>
      </table>

      <div className="text-center mb-16 flex-1 flex flex-col justify-center">
        <p className="text-xl">위와 같이 {isEmployed ? '재직하고' : '근무하였'}음을 증명합니다.</p>
      </div>

      <div className="mt-auto text-center pb-20 relative">
        <p className="text-lg mb-12">{dateString}</p>
        <h2 className="text-2xl font-bold tracking-wider">(주)차세대ERP솔루션 대표이사</h2>
        {/* Placeholder for official seal */}
        <div className="absolute right-20 bottom-16 w-16 h-16 border-4 border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold transform rotate-12 opacity-80">
          직인
        </div>
      </div>
    </div>
  );
}
