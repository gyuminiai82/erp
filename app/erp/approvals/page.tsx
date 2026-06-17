"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { Button } from '@/components/ui/Button';
import { Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';
import { Input } from '@/components/ui/Input';

interface ApprovalDoc {
  id: number;
  title: string;
  document_type: string;
  drafter_name: string;
  status: string;
  created_at: string;
}

interface ApprovalLine {
  id: number;
  approver_name: string;
  sequence_no: number;
  status: string;
  comment: string | null;
  acted_at: string | null;
}

interface DocDetail {
  id: number;
  title: string;
  content: string;
  document_type: string;
  status: string;
  drafter_name: string;
  drafter_dept: string;
  created_at: string;
  approval_lines: ApprovalLine[];
}

export default function ApprovalPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [items, setItems] = useState<ApprovalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docDetail, setDocDetail] = useState<DocDetail | null>(null);
  const [comment, setComment] = useState('');
  
  const { showAlert } = useDialog();

  useEffect(() => {
    const t = localStorage.getItem('erp_user_token') || localStorage.getItem('erp_user_access_token');
    if (t) setToken(t);
  }, []);

  const fetchItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'inbox' ? '/api/approvals/inbox' : '/api/approvals/outbox';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [token, activeTab]);

  const openDoc = async (id: number) => {
    if (!token) return;
    setSelectedDocId(id);
    setIsModalOpen(true);
    setDocDetail(null);
    setComment('');
    
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocDetail(data);
      } else {
        showAlert('문서를 불러올 수 없습니다.', { type: 'error' });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setIsModalOpen(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!token || !docDetail) return;
    
    if (action === 'reject' && !comment.trim()) {
      await showAlert('반려 사유를 입력해주세요.', { type: 'warning' });
      return;
    }
    
    try {
      const res = await fetch(`/api/approvals/${docDetail.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      
      const data = await res.json();
      if (res.ok) {
        await showAlert(data.message || '처리되었습니다.', { type: 'success' });
        setIsModalOpen(false);
        fetchItems(); // Refresh list
      } else {
        await showAlert(data.detail || '오류가 발생했습니다.', { type: 'error' });
      }
    } catch (err) {
      console.error(err);
      await showAlert('서버 오류가 발생했습니다.', { type: 'error' });
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    'DRAFT': { label: '작성중', color: 'text-gray-600 bg-gray-100' },
    'IN_PROGRESS': { label: '결재 진행중', color: 'text-blue-600 bg-blue-100' },
    'APPROVED': { label: '결재 완료', color: 'text-green-600 bg-green-100' },
    'REJECTED': { label: '반려', color: 'text-red-600 bg-red-100' },
    'PENDING': { label: '대기', color: 'text-gray-500 bg-gray-100' }
  };

  const columns: ColumnDef[] = useMemo(() => [
    { field: 'id', headerName: '문서번호', width: 100 },
    { field: 'document_type', headerName: '문서종류', width: 120 },
    { 
      field: 'title', 
      headerName: '제목', 
      width: 400,
      renderCell: (val: any, row: any) => (
        <span 
          className="cursor-pointer text-blue-600 hover:underline"
          onClick={() => openDoc(row.id)}
        >
          {val}
        </span>
      )
    },
    { field: 'drafter_name', headerName: '기안자', width: 150 },
    { 
      field: 'status', 
      headerName: '상태', 
      width: 120,
      renderCell: (val: string) => {
        const info = statusMap[val] || { label: val, color: 'text-gray-600 bg-gray-100' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
      }
    },
    { 
      field: 'created_at', 
      headerName: '기안일', 
      width: 180,
      renderCell: (val: string) => val ? new Date(val).toLocaleString() : ''
    }
  ], [activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">결재함</h1>
          <p className="text-gray-500 mt-2">나에게 온 결재를 확인하고 처리할 수 있습니다.</p>
        </div>
      </div>

      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inbox' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          결재 수신함
        </button>
        <button
          onClick={() => setActiveTab('outbox')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'outbox' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          기안 발신함
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <DataGrid
          columns={columns}
          rows={items}
          loading={loading}
          showCheckboxes={false}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">결재 문서 상세</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {docDetail ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Document Content */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 mb-1">문서 종류</span>
                        <span className="text-gray-800 font-medium">{docDetail.document_type}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 mb-1">기안자</span>
                        <span className="text-gray-800 font-medium">{docDetail.drafter_name} ({docDetail.drafter_dept})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-semibold text-gray-500 mb-1">제목</span>
                        <span className="text-gray-800 text-lg font-bold">{docDetail.title}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-600" />
                        상세 내용
                      </h3>
                      <div className="border border-gray-200 rounded-lg p-6 bg-white min-h-[300px] whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
                        {docDetail.content}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Approval Line */}
                  <div className="w-full lg:w-80 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        결재선 진행현황
                      </h3>
                      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        {docDetail.approval_lines.map((line, idx) => (
                          <div key={line.id} className={`p-4 border-b border-gray-100 last:border-b-0 ${line.status === 'PENDING' ? 'bg-blue-50/50' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800 text-sm">{idx + 1}차 결재: {line.approver_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMap[line.status]?.color}`}>
                                {statusMap[line.status]?.label}
                              </span>
                            </div>
                            {line.acted_at && (
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(line.acted_at).toLocaleString()}
                              </div>
                            )}
                            {line.comment && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-100">
                                <span className="font-semibold text-gray-500 mr-1">의견:</span>
                                {line.comment}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions Panel */}
                    {activeTab === 'inbox' && docDetail.status === 'IN_PROGRESS' && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">결재 처리</h3>
                        <textarea 
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="의견을 입력하세요 (반려 시 필수)"
                          className="w-full h-24 p-3 border border-gray-300 rounded-md mb-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleAction('reject')}
                          >
                            반려
                          </Button>
                          <Button 
                            variant="default" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleAction('approve')}
                          >
                            승인
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
