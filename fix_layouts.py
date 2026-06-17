import os
import re

files = [
    ('app/erp/projects/list/page.tsx', '프로젝트 조회/등록', '전체 프로젝트의 기본 정보와 현황을 관리합니다.', '프로젝트 등록', 'projects'),
    ('app/erp/projects/wbs/page.tsx', 'WBS 작업 관리', '프로젝트별 세부 작업을 관리하고 진척도를 추적합니다.', '작업 추가', 'tasks'),
    ('app/erp/projects/resources/page.tsx', '투입 인력(M/M) 관리', '프로젝트에 투입된 인원과 참여율을 관리합니다.', '인력 추가', 'resources'),
    ('app/erp/projects/budget/page.tsx', '예산 및 비용 관리', '프로젝트의 항목별 예산과 실제 지출 내역을 추적합니다.', '예산 추가', 'budgets'),
    ('app/erp/projects/issues/page.tsx', '이슈 및 리스크 관리', '프로젝트 진행 중 발생한 문제점이나 리스크를 등록하고 해결 과정을 추적합니다.', '이슈 등록', 'issues'),
    ('app/erp/projects/documents/page.tsx', '산출물 보관함', '프로젝트 관련 기획서, 보고서, 계약서 등을 중앙 집중식으로 관리합니다.', '파일 업로드', 'documents')
]

for filepath, title, desc, btn, varname in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'selectedRowIndices' not in content:
        content = content.replace('const [token', 'const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);\n  const [token')

    start_idx = content.find('return (')
    if start_idx == -1: continue

    project_dropdown = ""
    if varname != 'projects':
        project_dropdown = f'''
            <select 
              value={{selectedProject}} 
              onChange={{(e) => setSelectedProject(e.target.value)}}
              className="px-3 py-2 border border-gray-300 rounded text-sm min-w-[200px] outline-none focus:border-blue-500"
            >
              <option value="">프로젝트 선택</option>
              {{projects.map((p: any) => (
                <option key={{p.id}} value={{p.id}}>{{p.name}}</option>
              ))}}
            </select>'''

    datagrid = f"<DataGrid columns={{columns}} data={{{varname}}} showCheckboxes={{true}} selectedRowIndices={{selectedRowIndices}} onSelectionChange={{setSelectedRowIndices}} />"
    if varname != 'projects':
        datagrid = f"{{selectedProject ? ({datagrid}) : (<div className=\\"flex items-center justify-center h-full text-gray-500\\">프로젝트를 선택해주세요.</div>)}}"

    new_return = f'''return (
    <div className="p-6 bg-gray-50/30 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 mt-2">{desc}</p>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="검색어 입력..." className="px-3 py-2 border border-gray-300 rounded text-sm w-64 outline-none focus:border-blue-500" />{project_dropdown}
            <button className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded text-sm font-medium hover:bg-green-100 transition-colors">조회</button>
            <button className="px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded text-sm font-medium hover:bg-gray-100 transition-colors">↺</button>
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center shadow-sm transition-colors">
              + {btn}
            </button>
            <button className="px-4 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 shadow-sm transition-colors">
              선택 삭제
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 shadow-sm transition-colors">
              저장
            </button>
            <button className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded text-sm font-medium hover:bg-green-50 flex items-center shadow-sm transition-colors">
              엑셀 다운로드
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {datagrid}
        </div>
      </div>
    </div>
  );
}}
'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content[:start_idx] + new_return)
