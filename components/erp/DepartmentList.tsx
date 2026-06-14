"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Save, X } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Department {
  id: number;
  name: string;
  manager_id?: number | null;
}

export default function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("http://localhost:8000/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setNewName("");
        fetchDepartments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setEditingId(null);
        fetchDepartments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 부서를 삭제하시겠습니까? (소속 사원이 없어야 합니다)")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/departments/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchDepartments();
      } else {
        const data = await res.json();
        alert(data.detail || "삭제 실패");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">부서 목록 불러오는 중...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          부서 관리
        </h3>
      </div>

      <div className="flex space-x-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <Input 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새로운 부서 이름 입력"
          className="flex-1"
        />
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          추가
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
              <th className="py-3 px-4 font-semibold w-16 text-center">ID</th>
              <th className="py-3 px-4 font-semibold">부서명</th>
              <th className="py-3 px-4 font-semibold w-32 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 text-center text-gray-500">{dept.id}</td>
                <td className="py-3 px-4">
                  {editingId === dept.id ? (
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 py-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleUpdate(dept.id)} className="h-8 bg-green-600 hover:bg-green-700 text-white px-3">저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 px-3">취소</Button>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-800">{dept.name}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center space-x-2">
                  <button 
                    onClick={() => { setEditingId(dept.id); setEditName(dept.name); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(dept.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">등록된 부서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
