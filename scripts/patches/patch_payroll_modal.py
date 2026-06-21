import re

def patch():
    try:
        with open('app/erp/payroll/page.tsx', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # 1. Update Payroll interface
    iface_str = """  employee_name?: string;
  employee_no?: string;
  department_name?: string;
  _state?: 'I' | 'C' | 'U' | 'D' | '';
}"""
    new_iface_str = """  employee_name?: string;
  employee_no?: string;
  department_name?: string;
  calculation_basis?: string;
  _state?: 'I' | 'C' | 'U' | 'D' | '';
}"""
    content = content.replace(iface_str, new_iface_str)

    # 2. Add states for basis modal
    state_str = """  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);"""
    new_state_str = """  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBasisModalOpen, setIsBasisModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);"""
    content = content.replace(state_str, new_state_str)

    # 3. Add column for "명세서 보기"
    col_str = """    {
      field: 'payment_date',
      headerName: '지급일',
      width: 120,
      editable: true,
      renderCell: (val: any) => <div className="text-center w-full text-gray-600">{val}</div>
    }
  ];"""
    new_col_str = """    {
      field: 'payment_date',
      headerName: '지급일',
      width: 120,
      editable: true,
      renderCell: (val: any) => <div className="text-center w-full text-gray-600">{val}</div>
    },
    {
      field: 'details',
      headerName: '명세서',
      width: 100,
      renderCell: (val: any, row: any) => (
        <div className="text-center w-full flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs bg-white text-[#107C41] border-[#107C41] hover:bg-[#107C41] hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPayroll(row);
              setIsBasisModalOpen(true);
            }}
          >
            보기
          </Button>
        </div>
      )
    }
  ];"""
    content = content.replace(col_str, new_col_str)

    # 4. Add the Basis Modal JSX
    modal_str = """      {/* Manual Registration Modal */}
      {isModalOpen && ("""
    new_modal_str = """      {/* Basis Detail Modal */}
      {isBasisModalOpen && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#107C41]">
              <h2 className="text-lg font-bold text-white">
                급여 명세서 ({selectedPayroll.payment_month})
              </h2>
              <button onClick={() => setIsBasisModalOpen(false)} className="p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPayroll.employee_name}</h3>
                  <p className="text-sm text-gray-500">{selectedPayroll.department_name} | {selectedPayroll.employee_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">실수령액</p>
                  <p className="text-2xl font-bold text-[#107C41]">{Number(selectedPayroll.net_pay || 0).toLocaleString()}원</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 지급 내역 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 border-b pb-2 flex justify-between">
                    <span>지급 내역</span>
                    <span className="text-blue-600">{Number((selectedPayroll.base_salary||0) + (selectedPayroll.bonus||0)).toLocaleString()}원</span>
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">기본급</span>
                    <span>{Number(selectedPayroll.base_salary || 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">연장/휴일수당</span>
                    <span>{Number(selectedPayroll.bonus || 0).toLocaleString()}원</span>
                  </div>
                </div>

                {/* 공제 내역 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 border-b pb-2 flex justify-between">
                    <span>공제 내역</span>
                    <span className="text-red-500">{Number(selectedPayroll.deductions||0).toLocaleString()}원</span>
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">국민연금</span>
                    <span>{Number((selectedPayroll as any).national_pension || 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">건강보험</span>
                    <span>{Number((selectedPayroll as any).health_insurance || 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">장기요양보험</span>
                    <span>{Number((selectedPayroll as any).long_term_care || 0).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">고용보험</span>
                    <span>{Number((selectedPayroll as any).employment_insurance || 0).toLocaleString()}원</span>
                  </div>
                  {(selectedPayroll as any).tardiness_deduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">지각차감</span>
                      <span className="text-red-500">{Number((selectedPayroll as any).tardiness_deduction || 0).toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 산출 근거 */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-blue-500">📝</span> 수당 및 공제 산출 근거
                </h4>
                {selectedPayroll.calculation_basis ? (
                  <ul className="space-y-2">
                    {selectedPayroll.calculation_basis.split('\\n').map((line, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic py-2 text-center">산출 근거 내역이 없습니다.</p>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <Button onClick={() => setIsBasisModalOpen(false)} className="bg-gray-800 hover:bg-gray-900 text-white">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {isModalOpen && ("""
    content = content.replace(modal_str, new_modal_str)

    with open('app/erp/payroll/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payroll page for calculation basis")

if __name__ == "__main__":
    patch()
