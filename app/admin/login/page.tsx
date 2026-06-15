"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, User, Lock, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@minstudio.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('client_id', 'admin'); // 관리자 권한

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });
      
      if (!res.ok) {
        throw new Error("로그인에 실패했습니다. 관리자 계정 정보를 확인해주세요.");
      }

      const data = await res.json();
      
      // Store token
      localStorage.setItem("erp_token", data.access_token);
      localStorage.setItem("erp_access_token", data.access_token);
      localStorage.setItem("erp_user_role", data.role);
      
      // 정상 로그인 -> 관리자 페이지
      router.push('/admin');
      
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      {/* Left Decoration Panel (Admin Theme - Dark/Gray) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-center px-16 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-slate-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-gray-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-gray-900/50 border border-gray-700">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            Minstudio<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white">Admin System</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            조직도, 권한, 공통 코드 및 시스템 전반의 설정을 안전하게 관리하는 최상위 권한자 전용 시스템입니다.
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-black flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-medium">허가된 시스템 관리자 전용</p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">관리자 접속</h2>
            <p className="text-gray-500 mt-2">시스템 관리자 전용 계정으로 로그인해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8">
            {errorMsg && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">관리자 이메일</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    placeholder="admin@minstudio.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">비밀번호</label>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    placeholder="비밀번호 입력"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full mt-8 py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md shadow-gray-900/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "관리자 로그인"
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-200 pt-6">
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm font-semibold text-gray-600 hover:text-black transition-colors flex items-center justify-center w-full"
            >
              <User className="w-4 h-4 mr-1.5" /> 일반 사원 접속 페이지로 이동
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
