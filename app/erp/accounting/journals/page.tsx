"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/DialogProvider";
import { Plus, X, FileText, PlusCircle, Trash2 } from "lucide-react";

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState("대체");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<any[]>([
    { account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
    { account_code: "", account_name: "", debit: 0, credit: 0, description: "" }
  ]);

  const { showAlert } = useDialog();

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    const res = await fetch("/api/accounting/journals");
    if (res.ok) {
      const data = await res.json();
      setJournals(data);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { account_code: "", account_name: "", debit: 0, credit: 0, description: "" }]);
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
      lines: lines.filter(l => l.account_code)
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
        { account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
        { account_code: "", account_name: "", debit: 0, credit: 0, description: "" }
      ]);
    } else {
      const err = await res.json();
      showAlert(err.detail || "전표 등록 중 오류가 발생했습니다.", { type: "error" });
    }
  };

  const columns = [
    { field: "id", headerName: "전표번호", width: 90, renderCell: (val: any) => <div className="text-center w-full">#{val}</div> },
    { field: "entry_date", headerName: "전표일자", width: 120, renderCell: (val: any) => <div className="text-center w-full">{val}</div> },
    { field: "entry_type", headerName: "유형", width: 90, renderCell: (val: any) => <div className="text-center w-full">{val}</div> },
    { field: "description", headerName: "적요", width: 250 },
    { field: "total_debit", headerName: "차변 합계", width: 130, renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div> },
    { field: "total_credit", headerName: "대변 합계", width: 130, renderCell: (val: any) => <div className="text-right w-full">{Number(val).toLocaleString()}원</div> },
    { field: "status", headerName: "상태", width: 100, renderCell: (val: any) => <div className="text-center w-full">{val}</div> },
    { field: "creator_name", headerName: "작성자", width: 100, renderCell: (val: any) => <div className="text-center w-full">{val}</div> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">전표 관리</h1>
          <p className="text-gray-500">회계의 기본인 분개와 전표 입력을 관리하고 대차평균을 검증합니다.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#107C41] hover:bg-[#0b5c30] text-white">
            <Plus className="w-4 h-4 mr-2" />
            신규 전표 등록
          </Button>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <DataGrid
          data={journals}
          columns={columns}
          showCheckboxes={true}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#107C41]" />
                신규 전표 작성
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전표일자 *</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형 *</label>
                  <select value={entryType} onChange={e => setEntryType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="대체">대체 전표</option>
                    <option value="입금">입금 전표</option>
                    <option value="출금">출금 전표</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">적요</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="전표 전체 적요" />
                </div>
              </div>

              <div className="mb-4 flex justify-between items-end border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">전표 라인 (분개)</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-8">
                  <PlusCircle className="w-3 h-3 mr-1" /> 라인 추가
                </Button>
              </div>

              <div className="space-y-2 mb-8">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="col-span-2">계정코드</div>
                  <div className="col-span-3">계정명</div>
                  <div className="col-span-2 text-right">차변(Debit)</div>
                  <div className="col-span-2 text-right">대변(Credit)</div>
                  <div className="col-span-2">적요</div>
                  <div className="col-span-1 text-center">삭제</div>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2">
                      <input type="text" value={line.account_code} onChange={e => handleLineChange(idx, "account_code", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="ex: 101" required />
                    </div>
                    <div className="col-span-3">
                      <input type="text" value={line.account_name} onChange={e => handleLineChange(idx, "account_name", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="보통예금" required />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={line.debit} onChange={e => handleLineChange(idx, "debit", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right text-blue-600 font-medium bg-blue-50/30" min="0" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={line.credit} onChange={e => handleLineChange(idx, "credit", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right text-red-600 font-medium bg-red-50/30" min="0" />
                    </div>
                    <div className="col-span-2">
                      <input type="text" value={line.description} onChange={e => handleLineChange(idx, "description", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="상세 내용" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => handleRemoveLine(idx)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                  취소
                </Button>
                <Button type="submit" disabled={!isBalanced} className={isBalanced ? "bg-[#107C41] hover:bg-[#0b5c30] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}>
                  전표 등록 완료
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
