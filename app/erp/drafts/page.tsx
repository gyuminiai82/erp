'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Paperclip, Save, Send, Users, X, FileText } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  department_id: number | null;
  position_id: number | null;
  department?: string;
  position?: string;
}

interface ApproverInput {
  employee_id: number;
  sequence_no: number;
}

interface Project {
  id: number;
  name: string;
}

export default function DraftApprovalPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name: string; department?: string } | null>(null);
  
  // Form State
  const [documentType, setDocumentType] = useState('기안서');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<Employee[]>([]);
  
  // UI State
  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApproverModalOpen) {
      setSearchTerm('');
    }
  }, [isApproverModalOpen]);

  useEffect(() => {
    const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    if (t) {
      setToken(t);
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { 
          if (data) {
            // Role name might be department if not explicitly returned, but we assume it's provided or we just use role_name
            setUser({ id: data.id, name: data.name, department: data.role_name }); 
          }
        })
        .catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    // Fetch Employees
    fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const others = data.filter((emp: Employee) => emp.id !== user?.id);
        setEmployees(others);
      })
      .catch(err => console.error("Failed to fetch employees", err));

    // Fetch Projects
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setProjects(data))
      .catch(err => console.error("Failed to fetch projects", err));
      
  }, [token, user]);

  const handleAddApprover = (emp: Employee) => {
    if (selectedApprovers.find(a => a.id === emp.id)) return;
    setSelectedApprovers([...selectedApprovers, emp]);
  };

  const handleRemoveApprover = (empId: number) => {
    setSelectedApprovers(selectedApprovers.filter(a => a.id !== empId));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    if (!isDraft && selectedApprovers.length === 0) {
      setError("상신하려면 최소 1명 이상의 결재자를 지정해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const approvers: ApproverInput[] = selectedApprovers.map((emp, index) => ({
        employee_id: emp.id,
        sequence_no: index + 1
      }));

      const res = await fetch('/api/approvals/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_type: documentType,
          title,
          content,
          project_id: projectId === '' ? null : projectId,
          is_draft: isDraft,
          approvers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "기안 처리에 실패했습니다.");

      alert(isDraft ? "임시저장 되었습니다." : "기안이 성공적으로 상신되었습니다.");
      router.push('/erp/approvals'); 
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto bg-gray-50/30">
      <div className="mb-4 border-b-2 border-gray-900 pb-2 flex justify-between items-end">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          기안서 작성
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border-2 border-gray-300 shadow-sm rounded-none">
        
        {/* 기안 기본 정보 테이블 */}
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="bg-gray-100 py-2 px-4 text-left w-36 text-gray-700 font-semibold border-r border-gray-200">문서유형</th>
              <td className="py-2 px-4">
                <select 
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-48"
                >
                  <option value="일반기안">일반기안</option>
                  <option value="품의서">품의서</option>
                  <option value="지출결의서">지출결의서</option>
                  <option value="휴가신청서">휴가신청서</option>
                </select>
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="bg-gray-100 py-2 px-4 text-left w-36 text-gray-700 font-semibold border-r border-gray-200">기안자</th>
              <td className="py-2 px-4 text-gray-900">{user?.name || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="bg-gray-100 py-2 px-4 text-left w-36 text-gray-700 font-semibold border-r border-gray-200">기안부서</th>
              <td className="py-2 px-4 text-gray-900">{user?.department || '부서없음'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="bg-gray-100 py-2 px-4 text-left w-36 text-gray-700 font-semibold border-r border-gray-200">프로젝트</th>
              <td className="py-2 px-4">
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                >
                  <option value="">[선택]</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="w-full h-2 bg-gray-100 border-y border-gray-200"></div>

        {/* 결재선 지정 영역 */}
        <div className="p-3 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between bg-white">
          <div className="flex items-center space-x-4 flex-1 overflow-x-auto pb-2 md:pb-0">
            <span className="font-semibold text-gray-700 whitespace-nowrap min-w-[60px]">결재선</span>
            
            <div className="flex items-center text-sm font-medium text-gray-800">
              {/* 기안자 (자신) */}
              <div className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                <span className="text-blue-600 mr-2 font-bold">기안</span>
                {user?.name || '기안자'}
              </div>
              
              {selectedApprovers.map((emp, idx) => (
                <div key={emp.id} className="flex items-center">
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                  <div className="flex items-center px-3 py-1.5 bg-white rounded-full border border-gray-300 shadow-sm relative group cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
                       onClick={() => handleRemoveApprover(emp.id)}
                       title="클릭하여 결재자 삭제">
                    <span className="text-gray-500 mr-2 text-xs">{emp.department || '부서'}</span>
                    <span>{emp.name}</span>
                    <span className="ml-1 text-xs text-gray-400">{emp.position || '직급'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsApproverModalOpen(true)}
            className="mt-2 md:mt-0 ml-4 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 flex items-center text-sm whitespace-nowrap shadow-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4 mr-2 text-blue-600" />
            결재선 지정
          </button>
        </div>

        {/* 기안 작성 폼 */}
        <div className="p-4 space-y-4 bg-white">
          <div className="flex items-start">
            <span className="w-20 font-semibold text-gray-700 pt-1.5 shrink-0">제목</span>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="기안 제목을 입력하세요" 
              className="flex-1 px-2 py-1.5 border-b-2 border-gray-300 focus:border-blue-600 outline-none transition-colors text-base font-medium text-gray-900 bg-transparent"
            />
          </div>

          <div className="flex items-start mt-4">
            <span className="w-20 font-semibold text-gray-700 pt-1.5 shrink-0">내용</span>
            <div className="flex-1 border border-gray-300 rounded p-1">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="상세 내용을 입력하세요." 
                className="w-full h-40 p-3 outline-none resize-none text-sm text-gray-700 leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-100 border-y border-gray-200"></div>

        {/* 첨부파일 */}
        <div className="p-3 border-b border-gray-200 flex items-center bg-white">
          <span className="w-24 font-semibold text-gray-700 shrink-0">첨부파일</span>
          <button className="px-3 py-1.5 border border-dashed border-gray-400 text-gray-600 rounded hover:bg-gray-50 flex items-center text-sm font-medium transition-colors">
            <Paperclip className="w-4 h-4 mr-2" />
            파일 추가 (선택)
          </button>
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded font-bold hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2 text-gray-500" />
          임시저장
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md flex items-center transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : (
            <Send className="w-5 h-5 mr-2" />
          )}
          상신하기
        </button>
      </div>

      {/* 결재자 지정 모달 */}
      {isApproverModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">결재자 추가</h2>
              <button onClick={() => setIsApproverModalOpen(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>
            
            {/* 검색 입력란 */}
            <div className="p-3 border-b bg-gray-50/50">
              <input
                type="text"
                placeholder="이름, 부서 또는 직급으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              />
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="space-y-2">
                {(() => {
                  const filtered = employees.filter(emp => 
                    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
                  );
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {searchTerm ? '검색 결과가 없습니다.' : '선택 가능한 임직원이 없습니다.'}
                      </div>
                    );
                  }
                  
                  return filtered.map(emp => {
                    const isSelected = selectedApprovers.some(a => a.id === emp.id);
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                        <div>
                          <div className="font-semibold text-gray-800">{emp.name} <span className="text-xs text-gray-500 font-normal ml-1">{emp.position}</span></div>
                          <div className="text-xs text-gray-500">{emp.department || '부서없음'}</div>
                        </div>
                        <button
                          onClick={() => isSelected ? handleRemoveApprover(emp.id) : handleAddApprover(emp)}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            isSelected ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                        >
                          {isSelected ? '제거' : '추가'}
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setIsApproverModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-sm">
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
