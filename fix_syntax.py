with open(r'd:\001_portfolio\port_erp\app\erp\attendance\all\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "if (record && record.check_in) {" in line and "const checkInTimeStr" in lines[i+1]:
        skip = True
        new_lines.append("""                    if (record && record.check_in) {
                      const checkInTimeStr = record.check_in.split('T')[1] || record.check_in.split(' ')[1];
                      if (checkInTimeStr) {
                        const [hh, mm] = checkInTimeStr.split(':').map(Number);
                        const decimalHours = hh + (mm / 60);
                        leftPercent = Math.max(0, ((decimalHours - START_HOUR) / TOTAL_HOURS) * 100);
                        
                        let outDecimal = 24; // assume end of day if no check out yet
                        if (record.check_out) {
                          const checkOutTimeStr = record.check_out.split('T')[1] || record.check_out.split(' ')[1];
                          if (checkOutTimeStr) {
                            const [out_hh, out_mm] = checkOutTimeStr.split(':').map(Number);
                            outDecimal = out_hh + (out_mm / 60);
                          }
                        } else {
                           // if not checked out, limit to current time if today
                           const now = new Date();
                           if (currentDate.getDate() === now.getDate() && currentDate.getMonth() === now.getMonth()) {
                              outDecimal = now.getHours() + (now.getMinutes() / 60);
                           }
                        }
                        
                        widthPercent = Math.min(100 - leftPercent, ((outDecimal - (START_HOUR + (leftPercent/100*TOTAL_HOURS))) / TOTAL_HOURS) * 100);
                      }
                    }
                    
                    return (
                      <div key={record ? record.id : `leave-${leave?.id}`} className="relative flex hover:bg-gray-50 transition-colors">
                        <div className="w-48 flex-shrink-0 p-3 text-sm border-r border-gray-200">
                          <div className="font-semibold text-gray-800">{emp?.name || '알 수 없음'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{emp?.department || '-'} • {emp?.position || '-'}</div>
                        </div>
                        <div className="flex-1 relative py-2">
                          {/* Background grid lines */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-gray-100 border-dashed"></div>
                            ))}
                          </div>
                          
                          {/* Time Bar */}
                          {record && record.check_in && (
""")
    if skip and "{leave && (" in line:
        skip = False
    
    if not skip:
        new_lines.append(line)

with open(r'd:\001_portfolio\port_erp\app\erp\attendance\all\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
