'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  department_id: number | null;
  position_id: number | null;
  department?: { name: string };
  position?: { name: string };
}

interface ApproverInput {
  employee_id: number;
  sequence_no: number;
}

export default function DraftApprovalPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [documentType, setDocumentType] = useState('기안서');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<Employee[]>([]);
  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    if (t) {
      setToken(t);
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUser(data); })
        .catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Exclude self from approvers list
          const others = data.filter((emp: Employee) => emp.id !== user?.id);
          setEmployees(others);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };
    fetchEmployees();
  }, [token, user]);

  const handleAddApprover = (emp: Employee) => {
    if (selectedApprovers.find(a => a.id === emp.id)) return;
    setSelectedApprovers([...selectedApprovers, emp]);
  };

  const handleRemoveApprover = (empId: number) => {
    setSelectedApprovers(selectedApprovers.filter(a => a.id !== empId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    if (selectedApprovers.length === 0) {
      setError("최소 1명 이상의 결재자를 지정해주세요.");
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
          approvers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "기안 상신에 실패했습니다.");

      alert("기안이 성공적으로 상신되었습니다.");
      router.push('/erp'); // To be changed to approval list later
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">기안 작성</h1>
          <p className="text-gray-500 mt-2">새로운 전자결재 문서를 작성하고 상신합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">문서 종류</label>
              <select 
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="기안서">기안서</option>
                <option value="품의서">품의서</option>
                <option value="지출결의서">지출결의서</option>
                <option value="휴가신청서">휴가신청서</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">결재선 지정</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsApproverModalOpen(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
                >
                  결재자 추가
                </button>
                <div className="flex-1 text-sm text-gray-500">
                  {selectedApprovers.length === 0 ? "지정된 결재자가 없습니다." : `${selectedApprovers.length}명 지정됨`}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Approvers List */}
          {selectedApprovers.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">결재 순서</h3>
              <div className="space-y-2">
                {selectedApprovers.map((emp, idx) => (
                  <div key={emp.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-800">{emp.name}</span>
                      <span className="text-sm text-gray-500">
                        {emp.department?.name || '부서없음'} / {emp.position?.name || '직급없음'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveApprover(emp.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="문서 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-96 resize-y font-mono text-sm"
              placeholder="결재 문서 내용을 입력하세요..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '상신 중...' : '상신하기'}
            </button>
          </div>
        </form>
      </div>

      {/* Approver Selection Modal */}
      {isApproverModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">결재자 선택</h2>
              <button onClick={() => setIsApproverModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-center py-4">선택 가능한 사원이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {employees.map(emp => {
                    const isSelected = selectedApprovers.some(a => a.id === emp.id);
                    return (
                      <div 
                        key={emp.id} 
                        onClick={() => !isSelected && handleAddApprover(emp)}
                        className={`flex justify-between items-center p-3 rounded border cursor-pointer transition-colors
                          ${isSelected ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
                      >
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-xs text-gray-500">
                            {emp.department?.name || '부서없음'} / {emp.position?.name || '직급없음'}
                          </p>
                        </div>
                        {isSelected && <span className="text-xs text-blue-600 font-semibold">선택됨</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
              <button
                onClick={() => setIsApproverModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
