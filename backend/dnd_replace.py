import re

file_path = 'd:/001_portfolio/port_erp/app/admin/(dashboard)/common-codes/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
import_str = """import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/DialogProvider";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ code, children }: { code: any, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: code.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    backgroundColor: isDragging ? '#f8fafc' : undefined,
  };
  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50/50 transition-colors group relative">
      <td className="w-10 px-2 py-4 text-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 inline-block" />
      </td>
      {children}
    </tr>
  );
}
"""

content = re.sub(
    r"""import React, { useState, useEffect } from 'react';\nimport { Plus, Trash2, Edit2, Save, X, ChevronRight } from 'lucide-react';\nimport { Button } from "@/components/ui/Button";\nimport { useDialog } from "@/components/providers/DialogProvider";""",
    import_str,
    content
)

# 2. Sensors & DragEnd
sensors_and_drag_str = """
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = codes.findIndex((c) => c.id === active.id);
      const newIndex = codes.findIndex((c) => c.id === over.id);
      const newCodes = arrayMove(codes, oldIndex, newIndex);
      
      // Update sort_order locally
      const updatedCodes = newCodes.map((c, index) => ({ ...c, sort_order: index + 1 }));
      setCodes(updatedCodes);

      // Save to server
      try {
        const payload = updatedCodes.map(c => ({ id: c.id, sort_order: c.sort_order }));
        await fetch("/api/common-codes/reorder/batch", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Reorder failed", e);
      }
    }
  };

  if (loadingGroups) return <div className="p-8 text-gray-500">데이터를 불러오는 중...</div>;
"""

content = re.sub(
    r"""  if \(loadingGroups\) return <div className="p-8 text-gray-500">데이터를 불러오는 중...</div>;""",
    sensors_and_drag_str,
    content
)

# 3. Table Headers
thead_old = """<th className="px-6 py-4 font-medium border-b border-gray-100">코드</th>"""
thead_new = """<th className="w-10 px-2 py-4 border-b border-gray-100"></th>
                      <th className="px-6 py-4 font-medium border-b border-gray-100">코드</th>"""
content = content.replace(thead_old, thead_new)

# 4. Table Body (DndContext wrapping)
tbody_old = """<tbody className="divide-y divide-gray-50">
                    {loadingCodes ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">불러오는 중...</td></tr>
                    ) : codes.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">등록된 상세 코드가 없습니다.</td></tr>
                    ) : codes.map(code => (
                      <tr key={code.id} className="hover:bg-gray-50/50 transition-colors group">"""

tbody_new = """<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <tbody className="divide-y divide-gray-50">
                    {loadingCodes ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">불러오는 중...</td></tr>
                    ) : codes.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">등록된 상세 코드가 없습니다.</td></tr>
                    ) : (
                      <SortableContext items={codes.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {codes.map(code => (
                          <SortableRow key={code.id} code={code}>"""

content = content.replace(tbody_old, tbody_new)

# 5. Table Body Closing
tbody_close_old = """                      </tr>
                    ))}
                  </tbody>"""

tbody_close_new = """                      </SortableRow>
                        ))}
                      </SortableContext>
                    )}
                  </tbody>
                  </DndContext>"""

content = content.replace(tbody_close_old, tbody_close_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement successful")
