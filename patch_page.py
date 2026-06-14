import re

with open(r'd:\001_portfolio\port_erp\app\erp\attendance\all\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

calendar_original = """      const dayAttendances = attendances.filter(a => a.work_date === dateStr);
      
      const onTime = dayAttendances.filter(a => a.status === '정상').length;
      const late = dayAttendances.filter(a => a.status === '지각').length;
      const absent = dayAttendances.filter(a => a.status === '결근').length;"""

calendar_replacement = """      const dayAttendances = attendances.filter(a => a.work_date === dateStr);
      const dayLeaves = leaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
      
      const onTime = dayAttendances.filter(a => a.status === '정상').length;
      const late = dayAttendances.filter(a => a.status === '지각').length;
      const early = dayAttendances.filter(a => a.status === '조퇴').length;
      const absent = dayAttendances.filter(a => a.status === '결근').length;
      const leaveCount = dayLeaves.length;"""

content = content.replace(calendar_original, calendar_replacement)

calendar_render_original = """            {onTime > 0 && <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded truncate">정상: {onTime}명</div>}
            {late > 0 && <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded truncate">지각: {late}명</div>}
            {absent > 0 && <div className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded truncate">결근: {absent}명</div>}"""

calendar_render_replacement = """            {onTime > 0 && <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded truncate">정상: {onTime}명</div>}
            {late > 0 && <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded truncate">지각: {late}명</div>}
            {early > 0 && <div className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded truncate">조퇴: {early}명</div>}
            {absent > 0 && <div className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded truncate">결근: {absent}명</div>}
            {leaveCount > 0 && <div className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded truncate">휴가: {leaveCount}명</div>}"""

content = content.replace(calendar_render_original, calendar_render_replacement)

timeline_original = """    let dayData = attendances.filter(a => a.work_date === targetDateStr);
    
    if (searchKeyword) {"""

timeline_replacement = """    let dayData = attendances.filter(a => a.work_date === targetDateStr);
    let dayLeavesData = leaves.filter(l => l.start_date <= targetDateStr && l.end_date >= targetDateStr);
    
    if (searchKeyword) {"""

content = content.replace(timeline_original, timeline_replacement)

timeline_search_original = """    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      dayData = dayData.filter(a => 
        (a.employee?.name && a.employee.name.toLowerCase().includes(kw)) ||
        (a.employee?.department && a.employee.department.toLowerCase().includes(kw))
      );
    }"""

timeline_search_replacement = """    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      dayData = dayData.filter(a => 
        (a.employee?.name && a.employee.name.toLowerCase().includes(kw)) ||
        (a.employee?.department && a.employee.department.toLowerCase().includes(kw))
      );
      dayLeavesData = dayLeavesData.filter(l => 
        (l.employee?.name && l.employee.name.toLowerCase().includes(kw)) ||
        (l.employee?.department && l.employee.department.toLowerCase().includes(kw))
      );
    }"""

content = content.replace(timeline_search_original, timeline_search_replacement)

timeline_render_original = """            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {dayData.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  해당 일자의 출근 기록이 없습니다.
                </div>
              ) : (
                dayData.map(record => {
                  const emp = record.employee;
                  
                  // Calculate bar position
                  let leftPercent = 0;
                  let widthPercent = 0;
                  
                  if (record.check_in) {"""

timeline_render_replacement = """            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {dayData.length === 0 && dayLeavesData.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  해당 일자의 출근 및 휴가 기록이 없습니다.
                </div>
              ) : (
                (() => {
                  const employeeMap = new Map();
                  dayData.forEach(a => {
                     if (a.employee) employeeMap.set(a.employee_id || a.employee.id, { emp: a.employee, attendance: a, leave: null });
                  });
                  dayLeavesData.forEach(l => {
                     if (l.employee) {
                        const id = l.employee_id || l.employee.id;
                        if (employeeMap.has(id)) {
                           employeeMap.get(id).leave = l;
                        } else {
                           employeeMap.set(id, { emp: l.employee, attendance: null, leave: l });
                        }
                     }
                  });
                  const combinedRecords = Array.from(employeeMap.values());
                  
                  return combinedRecords.map(item => {
                    const emp = item.emp;
                    const record = item.attendance;
                    const leave = item.leave;
                    
                    // Calculate bar position
                    let leftPercent = 0;
                    let widthPercent = 0;
                    
                    if (record && record.check_in) {"""

content = content.replace(timeline_render_original, timeline_render_replacement)

timeline_end_original = """                    </div>
                  );
                })
              )}
            </div>"""

timeline_end_replacement = """                      {/* Leave Badge */}
                        {leave && (
                          <div className="absolute top-1/2 transform -translate-y-1/2 left-4 z-20">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 shadow-sm border border-purple-200">
                              {leave.leave_type}
                            </span>
                          </div>
                        )}
                    </div>
                  );
                })
                })()
              )}
            </div>"""

content = content.replace(timeline_end_original, timeline_end_replacement)

with open(r'd:\001_portfolio\port_erp\app\erp\attendance\all\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
