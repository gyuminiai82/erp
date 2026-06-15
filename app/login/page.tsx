"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, User, Lock, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('emp23001@minstudio.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (rememberEmail) {
        localStorage.setItem('saved_email', email);
      } else {
        localStorage.removeItem('saved_email');
      }

      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('client_id', 'user');

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "로그인에 실패했습니다.");
      }
      
      // Store token
      localStorage.setItem("erp_token", data.access_token);
      localStorage.setItem("erp_access_token", data.access_token);
      
      // MUST CHANGE PASSWORD CHECK (강제 납치 로직)
      if (data.must_change_password) {
        localStorage.setItem("temp_email", email);
        router.push('/change-password');
        return;
      }
      
      // 정상 로그인
      router.push('/erp');
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      {/* Left Decoration Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-center px-16 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#107C41] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-[#107C41] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-[#107C41]">MINSTUDIO ERP</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            인사, 근태, 급여부터 업무 성과까지. 데이터 기반의 투명하고 효율적인 회사 운영을 위한 스마트 인트라넷 솔루션입니다.
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-600"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-500"></div>
            </div>
            <p className="text-sm text-slate-400 font-medium">사내 임직원 전용 시스템</p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">환영합니다</h2>
            <p className="text-gray-500 mt-2">사내 이메일 계정으로 로그인해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일 계정</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                    placeholder="예: emp23001@minstudio.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">비밀번호</label>
                  <a href="#" className="text-xs font-medium text-[#107C41] hover:underline">비밀번호 찾기</a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#107C41]/20 focus:border-[#107C41] outline-none transition-all"
                    placeholder="비밀번호 입력"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberEmail} 
                    onChange={(e) => setRememberEmail(e.target.checked)} 
                    className="w-4 h-4 text-[#107C41] border-gray-300 rounded focus:ring-[#107C41] cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">이메일 계정 저장</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full mt-8 py-3.5 px-4 bg-[#107C41] hover:bg-[#0c5e31] text-white font-bold rounded-xl shadow-md shadow-green-600/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#107C41] flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "로그인"
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>초기 계정은 관리자가 직접 생성 및 발급합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
