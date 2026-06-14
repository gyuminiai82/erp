import Link from 'next/link';
import { Hammer, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Hammer className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            페이지 준비 중입니다
          </h1>
          
          <p className="text-gray-500 mb-8 leading-relaxed">
            요청하신 기능은 현재 <span className="font-semibold text-blue-600">개발 중</span>에 있습니다.<br />
            더 나은 서비스로 빠른 시일 내에 찾아뵙겠습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로
            </button>
            <Link 
              href="/"
              className="flex items-center justify-center px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
            >
              <Home className="w-4 h-4 mr-2" />
              메인 홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
