"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Users, ArrowRight, FileImage, Database, X } from 'lucide-react';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErdModalOpen, setIsErdModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#107C41] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl border border-slate-200 p-10 md:p-16 text-center shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-700">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Minstudio <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600">ERP</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
          기능개발 테스트용 웹사이트 입니다.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Admin Login Card */}
          <Link href="/admin/login" className="group block">
            <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#107C41] transition-all duration-300 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-b from-[#107C41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-white border border-slate-100 group-hover:bg-[#107C41] text-slate-700 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-sm">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">시스템 관리자</h2>
              <p className="text-slate-500 text-sm mb-6">
                ERP 운영을 위한 기본적인 정보를 설정합니다.
              </p>
              <div className="flex items-center text-[#107C41] font-medium text-sm group-hover:translate-x-1 transition-transform">
                관리자 접속하기 <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* User Login Card */}
          <Link href="/login" className="group block">
            <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 transition-all duration-300 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-white border border-slate-100 group-hover:bg-blue-500 text-slate-700 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-sm">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">일반 사원</h2>
              <p className="text-slate-500 text-sm mb-6">
                회사 업부를 위한 기본적인 기능을 제공합니다.
              </p>
              <div className="flex items-center text-blue-500 font-medium text-sm group-hover:translate-x-1 transition-transform">
                사원 접속하기 <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Architecture & ERD Buttons */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-[#107C41] transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full border border-slate-200"
          >
            <FileImage className="w-4 h-4" />
            <span>시스템 구성도 보기</span>
          </button>

          <button 
            onClick={() => setIsErdModalOpen(true)}
            className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full border border-slate-200"
          >
            <Database className="w-4 h-4" />
            <span>데이터베이스 구조 (ERD) 보기</span>
          </button>
        </div>
      </div>

      {/* Architecture Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">시스템 구성도 (Architecture)</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-50/50 overflow-y-auto flex items-center justify-center">
              <img 
                src="/architecture.png" 
                alt="System Architecture" 
                className="w-full h-auto max-w-4xl rounded-lg shadow-sm border border-gray-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ERD Modal */}
      {isErdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] overflow-hidden relative flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">데이터베이스 구조 (ERD)</h3>
              <button 
                onClick={() => setIsErdModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-[#f0f2f5] overflow-auto">
              <img 
                src="/erd.png" 
                alt="Entity Relationship Diagram" 
                className="max-w-none rounded shadow-md bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
