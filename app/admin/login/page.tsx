"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Shield, User, Lock, Activity, ArrowRight, CheckCircle2 } from "lucide-react";

type Role = "admin" | "user";

export default function AdminLogin() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@minstudio.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      formData.append("client_id", role);

      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
      }

      const data = await response.json();
      
      localStorage.setItem("erp_access_token", data.access_token);
      localStorage.setItem("erp_user_role", data.role);

      setSuccessMsg(`${data.role === "admin" ? "관리자" : "사용자"}로 로그인 되었습니다.`);
      
      setTimeout(() => {
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/erp");
        }
      }, 500);

    } catch (err: any) {
      setErrorMsg(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-purple-600/20 blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />

      {/* Main Glassmorphism Container */}
      <div className="relative w-full max-w-5xl flex flex-col md:flex-row bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 m-4">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex flex-col justify-between w-5/12 p-12 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-r border-slate-700/50 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Minstudio ERP</span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 leading-tight">
              차세대 <br />스마트 업무 환경
            </h1>
            <p className="text-slate-400 leading-relaxed">
              최고 수준의 보안과 직관적인 인터페이스로 회사의 모든 자원과 인사 정보를 안전하고 효율적으로 관리하세요.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">엔터프라이즈 보안</p>
                <p className="text-slate-400 text-xs mt-0.5">E2E 암호화 및 실시간 모니터링</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-14 relative z-10 bg-slate-900/80 md:bg-transparent">
          <div className="max-w-md mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">접속하기</h2>
              <p className="text-slate-400">계정 유형을 선택하고 로그인해 주세요.</p>
            </div>

            {/* Role Tabs */}
            <div className="flex p-1 mb-8 bg-slate-800/80 rounded-xl border border-slate-700/50 backdrop-blur-md">
              <button
                type="button"
                onClick={() => { setRole("admin"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out ${
                  role === "admin"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                시스템 관리자
              </button>
              <button
                type="button"
                onClick={() => { setRole("user"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out ${
                  role === "user"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                일반 사원
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">
                  {role === "admin" ? "관리자 이메일" : "사번 또는 이메일"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-800 transition-all outline-none"
                    placeholder={role === "admin" ? "admin@minstudio.com" : "user@minstudio.com"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-300">비밀번호</label>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    비밀번호를 잊으셨나요?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-800 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>안전하게 연결</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
