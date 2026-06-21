import re

def patch():
    try:
        with open('app/erp/payroll/page.tsx', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Replace 'nps' column definition
    nps_str = """    {
      field: 'nps',
      headerName: '국민연금',
      width: 100,
      renderCell: (val: any, row: any) => {
        const total = Number(row.base_salary || 0) + Number(row.bonus || 0);
        const amt = Math.floor(total * 0.045);
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    new_nps_str = """    {
      field: 'national_pension',
      headerName: '국민연금',
      width: 100,
      renderCell: (val: any) => {
        return <div className="text-right w-full text-red-500/80">-{Number(val || 0).toLocaleString()}</div>;
      }
    },"""
    content = content.replace(nps_str, new_nps_str)

    # Replace 'hi' column definition
    hi_str = """    {
      field: 'hi',
      headerName: '건강보험',
      width: 100,
      renderCell: (val: any, row: any) => {
        const total = Number(row.base_salary || 0) + Number(row.bonus || 0);
        const amt = Math.floor(total * 0.03545);
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    new_hi_str = """    {
      field: 'health_insurance',
      headerName: '건강보험',
      width: 100,
      renderCell: (val: any) => {
        return <div className="text-right w-full text-red-500/80">-{Number(val || 0).toLocaleString()}</div>;
      }
    },"""
    content = content.replace(hi_str, new_hi_str)

    # Replace 'ltci' column definition
    ltci_str = """    {
      field: 'ltci',
      headerName: '장기요양',
      width: 90,
      renderCell: (val: any, row: any) => {
        const total = Number(row.base_salary || 0) + Number(row.bonus || 0);
        const hi = Math.floor(total * 0.03545);
        const amt = Math.floor(hi * 0.1295);
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    new_ltci_str = """    {
      field: 'long_term_care',
      headerName: '장기요양',
      width: 90,
      renderCell: (val: any) => {
        return <div className="text-right w-full text-red-500/80">-{Number(val || 0).toLocaleString()}</div>;
      }
    },"""
    content = content.replace(ltci_str, new_ltci_str)

    # Replace 'ei' column definition
    ei_str = """    {
      field: 'ei',
      headerName: '고용보험',
      width: 90,
      renderCell: (val: any, row: any) => {
        const total = Number(row.base_salary || 0) + Number(row.bonus || 0);
        const amt = Math.floor(total * 0.009);
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    new_ei_str = """    {
      field: 'employment_insurance',
      headerName: '고용보험',
      width: 90,
      renderCell: (val: any) => {
        return <div className="text-right w-full text-red-500/80">-{Number(val || 0).toLocaleString()}</div>;
      }
    },"""
    content = content.replace(ei_str, new_ei_str)

    # Replace 'tax' column definition and add 'tardiness_deduction'
    tax_str = """    {
      field: 'tax',
      headerName: '소득세등',
      width: 90,
      renderCell: (val: any, row: any) => {
        const total = Number(row.base_salary || 0) + Number(row.bonus || 0);
        const nps = Math.floor(total * 0.045);
        const hi = Math.floor(total * 0.03545);
        const ltci = Math.floor(hi * 0.1295);
        const ei = Math.floor(total * 0.009);
        const calcDed = Math.floor((nps + hi + ltci + ei) / 10) * 10;
        const diff = Number(row.deductions || 0) - calcDed;
        const amt = diff > 0 ? diff : 0;
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    new_tax_str = """    {
      field: 'tardiness_deduction',
      headerName: '지각차감',
      width: 90,
      renderCell: (val: any) => {
        return <div className="text-right w-full text-red-500/80">-{Number(val || 0).toLocaleString()}</div>;
      }
    },
    {
      field: 'tax',
      headerName: '소득세등',
      width: 90,
      renderCell: (val: any, row: any) => {
        const nps = Number(row.national_pension || 0);
        const hi = Number(row.health_insurance || 0);
        const ltci = Number(row.long_term_care || 0);
        const ei = Number(row.employment_insurance || 0);
        const tardy = Number(row.tardiness_deduction || 0);
        const calcDed = Math.floor((nps + hi + ltci + ei) / 10) * 10 + tardy;
        const diff = Number(row.deductions || 0) - calcDed;
        const amt = diff > 0 ? diff : 0;
        return <div className="text-right w-full text-red-500/80">-{amt.toLocaleString()}</div>;
      }
    },"""
    content = content.replace(tax_str, new_tax_str)

    with open('app/erp/payroll/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payroll page")

if __name__ == "__main__":
    patch()
