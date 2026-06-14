"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Shield, User } from "lucide-react";

type Role = "admin" | "user";

export default function AdminLogin() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@minstudio.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

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
      localStorage.setItem("erp_token", data.access_token);
      localStorage.setItem("erp_user_role", data.role);

      router.push(data.role === "admin" ? "/admin" : "/erp");

    } catch (err: any) {
      setErrorMsg(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-2xl tracking-tighter">M</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 tracking-tight">
          Minstudio 접속
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          내부 업무 시스템 권한 인증
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px]">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-gray-200">
          
          <div className="flex p-1 mb-8 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => { 
                setRole("admin"); 
                setEmail("admin@minstudio.com");
                setPassword("admin123");
                setErrorMsg(""); 
              }}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                role === "admin"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Shield className="w-4 h-4 mr-2 opacity-70" />
              시스템 관리자
            </button>
            <button
              type="button"
              onClick={() => { 
                setRole("user"); 
                setEmail("emp23001@minstudio.com");
                setPassword("1234");
                setErrorMsg(""); 
              }}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${
                role === "user"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <User className="w-4 h-4 mr-2 opacity-70" />
              일반 사원
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-100 p-3.5 rounded-lg flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2.5 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {role === "admin" ? "관리자 이메일" : "이메일 주소"}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-colors"
                placeholder={role === "admin" ? "admin@minstudio.com" : "user@minstudio.com"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "로그인"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              비밀번호를 잊으셨나요?
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Minstudio.
        </p>
      </div>
    </div>
  );
}
