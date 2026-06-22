"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/DialogProvider";
import { Plus, X, FileText, PlusCircle, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<boolean>(false);
  
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState("대체");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([
    { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" },
    { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" }
  ]);

  const { showAlert } = useDialog();

  useEffect(() => {
    fetchJournals();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resDept, resClient, resProj] = await Promise.all([
        fetch("/api/departments", { headers }), fetch("/api/clients", { headers }), fetch("/api/projects", { headers })
      ]);
      if (resDept.ok) setDepartments(await resDept.json());
      if (resClient.ok) setClients(await resClient.json());
      if (resProj.ok) setProjects(await resProj.json());
    } catch(err) { console.error(err); }
  };

  const fetchJournals = async () => {
    const res = await fetch("/api/accounting/journals");
    if (res.ok) {
      const data = await res.json();
      setJournals(data);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index][field] = field === "debit" || field === "credit" ? Number(value) : value;
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showAlert('차변과 대변 합계가 일치해야 합니다 (대차평균의 원리).', { type: 'warning' });
      return;
    }

    const payload = {
      entry_date: entryDate,
      entry_type: entryType,
      description,
      lines: lines.filter(l => l.account_code).map(l => ({
        ...l,
        department_id: l.department_id || null,
        client_id: l.client_id || null,
        project_id: l.project_id || null
      }))
    };

    const res = await fetch("/api/accounting/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchJournals();
      setEntryDate(new Date().toISOString().split("T")[0]);
      setEntryType("대체");
      setDescription("");
      setLines([
        { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" },
        { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" }
      ]);
    } else {
      const err = await res.json();
      showAlert(err.detail || "전표 추가 중 오류가 발생했습니다.", { type: "error" });
    }
  };

  const openCreateModal = () => {
    setViewMode(false);
    setCurrentEntryId(null);
    setEntryDate(new Date().toISOString().split("T")[0]);
    setEntryType("대체");
    setDescription("");
    setLines([
      { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" },
      { account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" }
    ]);
    setIsModalOpen(true);
  };

  const openViewModal = (journal: any) => {
    setViewMode(true);
    setCurrentEntryId(journal.id);
    setEntryDate(journal.entry_date);
    setEntryType(journal.entry_type);
    setDescription(journal.description || "");
    if (journal.lines && journal.lines.length > 0) {
      setLines(journal.lines.map((l: any) => ({
        ...l,
        department_id: l.department_id || "",
        client_id: l.client_id || "",
        project_id: l.project_id || ""
      })));
    } else {
      setLines([{ account_code: "", account_name: "", debit: 0, credit: 0, description: "", department_id: "", client_id: "", project_id: "" }]);
    }
    setIsModalOpen(true);
  };



  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">전표 관리</h1>
          <p className="text-gray-500">회계의 기본인 분개와 전표 입력을 관리하고 대차평균을 검증합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 w-full max-w-[400px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="검색어 입력..." 
                    className="pl-9 w-full h-9 text-sm" 
                  />
                </div>
                <Button variant="secondary" size="sm" className="h-9">
                  조회
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={openCreateModal} className="h-9 flex items-center bg-white">
                <Plus className="w-4 h-4 mr-1 text-[#107C41]" />
                신규 전표 추가
              </Button>
            </div>
          </div>

          <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pb-10 pr-2">
            {journals.map(journal => (
              <div key={journal.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden group">
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-500">#{journal.id}</span>
                    <span className="font-bold text-gray-900">{journal.entry_date}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">{journal.entry_type}</span>
                    {journal.description && <span className="text-sm text-gray-600 truncate max-w-md">| {journal.description}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <span className="mr-2">작성: {journal.creator_name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${journal.status === 'APPROVED' ? 'bg-green-100 text-green-700' : journal.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                        {journal.status === 'APPROVED' ? '승인됨' : journal.status === 'REJECTED' ? '반려됨' : '대기중'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openViewModal(journal)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs px-3 py-0 border-gray-300 hover:bg-gray-100 text-gray-700">상세 및 수정</Button>
                  </div>
                </div>
                
                {/* Body Table */}
                <div className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/40 text-gray-500 text-xs border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2 font-medium w-1/4">계정과목</th>
                        <th className="px-4 py-2 font-medium w-1/3">적요</th>
                        <th className="px-4 py-2 font-medium text-right w-1/6">차변 (Debit)</th>
                        <th className="px-4 py-2 font-medium text-right w-1/6">대변 (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {journal.lines?.map((line: any) => (
                        <tr key={line.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2 text-gray-900 font-medium">
                            <span className="text-gray-400 font-normal mr-2">[{line.account_code}]</span>
                            {line.account_name}
                          </td>
                          <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{line.description || "-"}</td>
                          <td className="px-4 py-2 text-right text-blue-600 font-semibold">{line.debit ? line.debit.toLocaleString() : ""}</td>
                          <td className="px-4 py-2 text-right text-red-600 font-semibold">{line.credit ? line.credit.toLocaleString() : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100/50 font-bold border-t border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 text-right text-gray-600 uppercase tracking-wider text-xs">합계 (Total)</td>
                        <td className="px-4 py-2.5 text-right text-blue-700 text-base">{journal.total_debit.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-red-700 text-base">{journal.total_credit.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
            
            {journals.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>조회된 전표가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#107C41]" />
                {viewMode ? `전표 상세 내역 (#${currentEntryId})` : "신규 전표 작성"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전표일자 *</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} disabled={viewMode} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
                  <select value={entryType} onChange={e => setEntryType(e.target.value)} disabled={viewMode} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="대체">대체 전표</option>
                    <option value="입금">입금 전표</option>
                    <option value="출금">출금 전표</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">적요</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} disabled={viewMode} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500" placeholder="전표 전체 적요" />
                </div>
              </div>

              <div className="mb-4 flex justify-between items-end border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">전표 라인 (분개)</h3>
                {!viewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-8">
                    <PlusCircle className="w-3 h-3 mr-1" /> 라인 추가
                  </Button>
                )}
              </div>

              <div className="space-y-2 mb-8">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="col-span-2 px-2">계정코드</div>
                  <div className="col-span-3 px-2">계정명</div>
                  <div className="col-span-2 px-2 text-right">차변(Debit)</div>
                  <div className="col-span-2 px-2 text-right">대변(Credit)</div>
                  <div className="col-span-2 px-2">적요</div>
                  <div className="col-span-1 text-center">삭제</div>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-2 border border-gray-100 rounded bg-white">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2">
                        <input type="text" value={line.account_code} onChange={e => handleLineChange(idx, "account_code", e.target.value)} disabled={viewMode} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500" placeholder="ex: 101" required />
                      </div>
                      <div className="col-span-3">
                        <input type="text" value={line.account_name} onChange={e => handleLineChange(idx, "account_name", e.target.value)} disabled={viewMode} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500" placeholder="보통예금" required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={line.debit} onChange={e => handleLineChange(idx, "debit", e.target.value)} disabled={viewMode} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right text-blue-600 font-medium bg-blue-50/30 disabled:opacity-70 disabled:bg-gray-50" min="0" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={line.credit} onChange={e => handleLineChange(idx, "credit", e.target.value)} disabled={viewMode} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right text-red-600 font-medium bg-red-50/30 disabled:opacity-70 disabled:bg-gray-50" min="0" />
                      </div>
                      <div className="col-span-2">
                        <input type="text" value={line.description} onChange={e => handleLineChange(idx, "description", e.target.value)} disabled={viewMode} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500" placeholder="상세 내용" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {!viewMode && (
                          <button type="button" onClick={() => handleRemoveLine(idx)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* 다차원 입력 항목 (부서, 거래처, 프로젝트) */}
                    <div className="grid grid-cols-3 gap-4 pt-1 pl-1">
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500 w-12">부서:</span>
                        <select value={line.department_id || ""} onChange={e => handleLineChange(idx, "department_id", e.target.value ? Number(e.target.value) : "")} disabled={viewMode} className="flex-1 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100">
                          <option value="">선택 안함</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500 w-12">거래처:</span>
                        <select value={line.client_id || ""} onChange={e => handleLineChange(idx, "client_id", e.target.value ? Number(e.target.value) : "")} disabled={viewMode} className="flex-1 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100">
                          <option value="">선택 안함</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-500 w-16">프로젝트:</span>
                        <select value={line.project_id || ""} onChange={e => handleLineChange(idx, "project_id", e.target.value ? Number(e.target.value) : "")} disabled={viewMode} className="flex-1 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100">
                          <option value="">선택 안함</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mb-6 border border-gray-200">
                <span className="text-gray-600 font-medium">대차 합계</span>
                <div className="flex gap-8 text-lg font-bold">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase">차변(Debit)</span>
                    <span className="text-blue-600">{totalDebit.toLocaleString()}원</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase">대변(Credit)</span>
                    <span className="text-red-600">{totalCredit.toLocaleString()}원</span>
                  </div>
                  <div className="flex flex-col items-end pl-4 border-l border-gray-300">
                    <span className="text-xs text-gray-500 uppercase">대차 차액</span>
                    <span className={isBalanced ? "text-green-600" : "text-yellow-600"}>
                      {Math.abs(totalDebit - totalCredit).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  {viewMode ? "닫기" : "취소"}
                </Button>
                {!viewMode && (
                  <Button type="submit" disabled={!isBalanced} className={isBalanced ? "bg-[#107C41] hover:bg-[#0b5c30] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}>
                    전표 추가 완료
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
