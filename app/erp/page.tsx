export default function ERPDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">내 대시보드</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-sm">환영합니다! 사원(Employee) 전용 ERP 대시보드 화면입니다.</p>
        <p className="text-gray-500 text-xs mt-2">좌측 사이드바 메뉴는 관리자가 부여한 권한(DB)에 따라 동적으로 나타납니다.</p>
      </div>
    </div>
  );
}
