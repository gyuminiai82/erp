import Link from 'next/link';
import { Shield, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#107C41] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-4xl backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-10 md:p-16 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          Minstudio <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">ERP</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          혁신적인 업무 환경의 시작. 역할을 선택하고 스마트한 사내 인트라넷 시스템에 접속하세요.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Admin Login Card */}
          <Link href="/admin/login" className="group block">
            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-[#107C41] transition-all duration-300 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#107C41]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-slate-700 group-hover:bg-[#107C41] text-white rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-lg">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">시스템 관리자</h2>
              <p className="text-slate-400 text-sm mb-6">
                조직도 관리, 권한 설정, 공통 코드 등<br/>시스템 전반을 제어합니다.
              </p>
              <div className="flex items-center text-[#107C41] font-medium text-sm group-hover:translate-x-1 transition-transform">
                관리자 접속하기 <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* User Login Card */}
          <Link href="/login" className="group block">
            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all duration-300 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-slate-700 group-hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-lg">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">일반 사원</h2>
              <p className="text-slate-400 text-sm mb-6">
                나의 근태 관리, 휴가 신청, 부서원 조회 등<br/>개인 업무 시스템에 접속합니다.
              </p>
              <div className="flex items-center text-blue-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                사원 접속하기 <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
