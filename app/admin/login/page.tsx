"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

type Role = "admin" | "user";

export default function AdminLogin() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@minstudio.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      formData.append("client_id", role); // role을 백엔드로 전달 (admin 또는 user)

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
      
      // Store token in localStorage
      localStorage.setItem("erp_access_token", data.access_token);
      localStorage.setItem("erp_user_role", data.role);

      setSuccessMsg(`${data.role === "admin" ? "관리자" : "사용자"}로 로그인 되었습니다.`);
      
      // Redirect to Dashboard
      router.push("/admin");

    } catch (err: any) {
      setErrorMsg(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-900 font-sans">
      <div className="w-full max-w-sm bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        
        {/* Title Bar like a Windows app */}
        <div className="bg-slate-800 text-slate-300 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center font-semibold tracking-wide">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.5,2H2.5C2.2,2,2,2.2,2,2.5v19C2,21.8,2.2,22,2.5,22h19c0.3,0,0.5-0.2,0.5-0.5v-19C22,2.2,21.8,2,21.5,2z M12,18H6v-2h6V18z M12,14H6v-2h6V14z M12,10H6V8h6V10z M18,18h-4v-2h4V18z M18,14h-4v-2h4V14z M18,10h-4V8h4V10z" />
            </svg>
            Minstudio ERP 접속
          </div>
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 bg-white bg-opacity-20 hover:bg-opacity-40 cursor-pointer"></div>
            <div className="w-2.5 h-2.5 bg-white bg-opacity-20 hover:bg-opacity-40 cursor-pointer"></div>
            <div className="w-2.5 h-2.5 bg-red-500 hover:bg-red-600 cursor-pointer"></div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-300 bg-[#f8f8f8]">
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider border-r border-gray-300 ${
              role === "admin"
                ? "bg-white text-blue-600 border-b-2 border-b-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            시스템 관리자
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("user");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              role === "user"
                ? "bg-white text-blue-600 border-b-2 border-b-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            일반 사원
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-500 mb-5 border-b border-gray-200 pb-2">
            {role === "admin" 
              ? "데이터베이스 관리 및 시스템 설정을 위해 로그인하십시오." 
              : "사내 인트라넷 접근을 위해 인증을 진행하십시오."}
          </p>

          {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg("")} />}
          {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg("")} />}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={role === "admin" ? "관리자 계정 (ID)" : "사번 또는 이메일"}
              type="text"
              required
              placeholder={role === "admin" ? "admin@minstudio.com" : "user@minstudio.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="암호 (PASSWORD)"
              type="password"
              required
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" loading={loading} className="!bg-blue-600 hover:!bg-blue-700 focus:ring-blue-600">
                연결 (Connect)
              </Button>
            </div>
          </form>
        </div>
        
        <div className="bg-[#f3f2f1] border-t border-gray-300 px-3 py-1 text-[10px] text-gray-400 flex justify-between">
          <span>준비됨</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
