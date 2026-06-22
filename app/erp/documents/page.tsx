"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Input } from "@/components/ui/Input";
import { FileSignature, FileBadge, X, Printer, Search, Undo2 } from 'lucide-react';
import { useDialog } from "@/components/providers/DialogProvider";

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  
  // Modal states
  const [activeDocument, setActiveDocument] = useState<'contract' | 'certificate' | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const { showAlert } = useDialog();

  const fetchData = async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_user_token') || localStorage.getItem('token')) : '';
      const headers = { Authorization: `Bearer ${token}` };
      
      const [empRes, deptRes, posRes, companyRes] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/departments", { headers }),
        fetch("/api/positions", { headers }),
        fetch("/api/company", { headers })
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        const deptData = deptRes.ok ? await deptRes.json() : [];
        const posData = posRes.ok ? await posRes.json() : [];
        
        setDepartments(deptData);
        setPositions(posData);
        
        const companyData = companyRes.ok ? await companyRes.json() : null;
        setCompanyInfo(companyData);
        
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

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const nameMatch = emp.name && emp.name.toLowerCase().includes(q);
    const empNoMatch = emp.emp_no && emp.emp_no.toLowerCase().includes(q);
    return nameMatch || empNoMatch;
  });

  const handleIssueContract = () => {
    if (selectedRowIndices.length !== 1) {
      return showAlert("근로계약서를 발급할 직원을 한 명만 선택해주세요.", { type: "warning" });
    }
    setSelectedEmployee(filteredEmployees[selectedRowIndices[0]]);
    setActiveDocument('contract');
  };

  const handleIssueCertificate = () => {
    if (selectedRowIndices.length !== 1) {
      return showAlert("증명서를 발급할 직원을 한 명만 선택해주세요.", { type: "warning" });
    }
    setSelectedEmployee(filteredEmployees[selectedRowIndices[0]]);
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
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50/50">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 bg-white w-full h-10 focus:z-10 relative" 
                    placeholder="이름, 사번 검색..." 
                  />
                </div>
                <Button variant="secondary" className="h-10 px-6 shrink-0" onClick={() => {}}>
                  조회
                </Button>
                <Button variant="secondary" onClick={() => setSearchQuery('')} className="h-10 px-3 shrink-0" title="초기화">
                  <Undo2 className="w-4 h-4 text-[#107C41]" />
                </Button>
              </div>

              <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
                <Button variant="outline" size="sm" className="h-9 flex items-center bg-white border-blue-600 text-blue-600 hover:bg-blue-50" onClick={handleIssueContract}>
                  <FileSignature className="w-4 h-4 mr-1" />
                  근로계약서 발급
                </Button>
                <Button size="sm" className="h-9 flex items-center bg-blue-600 hover:bg-blue-700 text-white" onClick={handleIssueCertificate}>
                  <FileBadge className="w-4 h-4 mr-1" />
                  재직/경력증명서 발급
                </Button>
              </div>
            </div>

            <div className="flex flex-col h-[calc(100vh-380px)] min-h-[400px] border border-gray-300 rounded-md overflow-hidden bg-white">
              <DataGrid
                columns={columns}
                data={filteredEmployees}
                showCheckboxes={true}
                selectedRowIndices={selectedRowIndices}
                onSelectionChange={setSelectedRowIndices}
              />
            </div>
          </div>
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
                    <ContractDocument employee={selectedEmployee} dateString={dateString} companyInfo={companyInfo} />
                  ) : (
                    <CertificateDocument employee={selectedEmployee} dateString={dateString} companyInfo={companyInfo} />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* PRINT ONLY CONTENT */}
          <div id="print-section" className="hidden print:block w-[210mm] bg-white text-black p-[20mm]">
            {activeDocument === 'contract' ? (
              <ContractDocument employee={selectedEmployee} dateString={dateString} companyInfo={companyInfo} />
            ) : (
              <CertificateDocument employee={selectedEmployee} dateString={dateString} companyInfo={companyInfo} />
            )}
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              /* 강제로 모달 및 불필요한 UI 숨김 처리 (스크롤바 제거) */
              .print\\:hidden {
                display: none !important;
              }
              /* 스크롤바 자체를 숨김 */
              ::-webkit-scrollbar {
                display: none !important;
              }
              #print-section, #print-section * {
                visibility: visible;
              }
              #print-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                margin: 0;
                padding: 20mm;
                box-shadow: none;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
          `}} />
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------
// Document Components
// -----------------------------------------------------

function ContractDocument({ employee, dateString, companyInfo }: { employee: any, dateString: string, companyInfo?: any }) {
  const getBirthDate = () => {
    if (employee.birth_date) return employee.birth_date;
    if (employee.resident_num && employee.resident_num.length >= 6) {
      const yy = employee.resident_num.substring(0, 2);
      const mm = employee.resident_num.substring(2, 4);
      const dd = employee.resident_num.substring(4, 6);
      const yearPrefix = parseInt(yy) > 50 ? '19' : '20';
      return `${yearPrefix}${yy}년 ${mm}월 ${dd}일`;
    }
    return '__________________';
  };

  return (
    <div className="text-gray-900 leading-relaxed font-sans">
      <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">표준 근로계약서</h1>
      
      <p className="mb-4">(주)차세대ERP솔루션(이하 "사업주"라 함)과(와) <strong>{employee.name}</strong>(이하 "근로자"라 함)은(는) 다음과 같이 근로계약을 체결한다.</p>

      <div className="space-y-4">
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

      <div className="mt-8 text-center">
        <p className="mb-8">{dateString}</p>
        
        <div className="flex justify-between px-10 relative">
          <div className="text-left relative inline-block">
            <h3 className="font-bold mb-3">[사업주]</h3>
            <p className="mb-1">사업체명 : {companyInfo?.name || '(주)차세대ERP솔루션'}</p>
            <p className="mb-1">대 표 자 : {companyInfo?.representative || '김 대 표'} (인)</p>
            <p className="mb-1">주 소 : {companyInfo?.address || '서울특별시 강남구 테헤란로 123'}</p>
            
            {companyInfo?.seal_url && (
              <img src={companyInfo.seal_url} alt="직인" className="absolute object-contain mix-blend-multiply opacity-90" style={{ width: '60px', height: '60px', left: '140px', top: '24px' }} />
            )}
          </div>
          
          <div className="text-left">
            <h3 className="font-bold mb-3">[근로자]</h3>
            <p className="mb-1">성 명 : {employee.name} (인)</p>
            <p className="mb-1">생년월일 : {getBirthDate()}</p>
            <p className="mb-1 break-all">주 소 : {employee.address || '___________________________'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateDocument({ employee, dateString, companyInfo }: { employee: any, dateString: string, companyInfo?: any }) {
  // Determine if currently employed to change title
  const isEmployed = employee.status === '재직';
  const title = isEmployed ? '재직증명서' : '경력증명서';

  const getBirthDate = () => {
    if (employee.birth_date) return employee.birth_date;
    if (employee.resident_num && employee.resident_num.length >= 6) {
      const yy = employee.resident_num.substring(0, 2);
      const mm = employee.resident_num.substring(2, 4);
      const dd = employee.resident_num.substring(4, 6);
      const yearPrefix = parseInt(yy) > 50 ? '19' : '20';
      return `${yearPrefix}${yy}년 ${mm}월 ${dd}일`;
    }
    return '-';
  };

  return (
    <div className="text-gray-900 leading-relaxed font-sans h-full flex flex-col">
      <h1 className="text-4xl font-bold text-center mb-16 tracking-widest">{title}</h1>
      
      <table className="w-full border-collapse border-2 border-black mb-12">
        <tbody>
          <tr>
            <th className="border border-black p-4 bg-gray-50 w-1/4 text-center font-bold">성 명</th>
            <td className="border border-black p-4 w-1/4 text-center">{employee.name}</td>
            <th className="border border-black p-4 bg-gray-50 w-1/4 text-center font-bold">생년월일</th>
            <td className="border border-black p-4 w-1/4 text-center">{getBirthDate()}</td>
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
        <h2 className="text-2xl font-bold tracking-wider">{companyInfo?.name || '(주)차세대ERP솔루션'} 대표이사</h2>
        {companyInfo?.seal_url ? (
          <img src={companyInfo.seal_url} alt="직인" className="absolute object-contain mix-blend-multiply opacity-90" style={{ width: '80px', height: '80px', right: '80px', bottom: '56px' }} />
        ) : (
          <div className="absolute right-20 bottom-16 w-16 h-16 border-4 border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold transform rotate-12 opacity-80">
            직인
          </div>
        )}
      </div>
    </div>
  );
}
