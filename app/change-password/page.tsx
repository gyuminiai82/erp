"use client";

import React, { useState } from 'react';
import { Lock, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError("새 비밀번호는 최소 4자리 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    
    // 이메일은 localStorage에 저장해둔 값 사용
    const email = localStorage.getItem("temp_email");
    if (!email) {
      setError("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "비밀번호 변경 실패");
      
      setSuccess(true);
      // 토큰 및 데이터 삭제
      localStorage.removeItem("temp_email");
      localStorage.removeItem("erp_token"); // 혹시 토큰이 있다면 삭제하여 재로그인 유도
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 text-[#107C41] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 변경 완료!</h2>
          <p className="text-gray-500 mb-6">성공적으로 비밀번호를 변경했습니다.<br/>새로운 비밀번호로 다시 로그인해주세요.</p>
          <div className="w-6 h-6 border-2 border-[#107C41] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#107C41]"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#107C41] opacity-[0.03] blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#107C41] opacity-[0.03] blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-xl border border-yellow-100 shadow-sm mb-4">
            <Lock className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">초기 비밀번호 변경</h2>
          <p className="text-sm text-gray-500 mt-2">보안을 위해 초기 비밀번호를 변경해야 시스템을 이용할 수 있습니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {error && (
            <div className="bg-red-50 border-b border-red-100 p-4 flex items-start animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">현재(초기) 비밀번호</label>
              <input 
                type="password" required
                value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all focus:bg-white"
                placeholder="현재 비밀번호 입력"
              />
            </div>
            
            <div className="h-px bg-gray-100 my-2"></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                  placeholder="새로운 비밀번호 입력"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호 확인</label>
              <input 
                type={showPassword ? "text" : "password"} required
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                placeholder="비밀번호 다시 입력"
              />
            </div>

            <button 
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-[#107C41] hover:bg-[#0c5e31] text-white font-medium rounded-xl shadow-sm shadow-green-600/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#107C41] flex justify-center"
            >
              비밀번호 변경 및 계속하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
