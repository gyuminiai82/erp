import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export interface ColumnDef {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  editType?: 'text' | 'select';
  options?: { label: string; value: string | number }[];
  renderCell?: (value: any, row: any) => React.ReactNode;
}

export interface DataGridProps {
  columns: ColumnDef[];
  data: any[];
  rowHeight?: number;
  headerHeight?: number;
  onDataChange?: (rowIndex: number, field: string, newValue: any) => void;
  className?: string;
  style?: React.CSSProperties;
  showCheckboxes?: boolean;
  selectedRowIndices?: number[];
  onSelectionChange?: (indices: number[]) => void;
}

export function DataGrid({
  columns,
  data,
  rowHeight = 32, // slightly taller row height
  headerHeight = 36,
  onDataChange,
  className = "h-full w-full",
  style,
  showCheckboxes = false,
  selectedRowIndices = [],
  onSelectionChange
}: DataGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Column Resizing
  const [colWidths, setColWidths] = useState<number[]>(columns.map(c => c.width || 150));
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  useEffect(() => {
    setColWidths(columns.map(c => c.width || 150));
  }, [columns]);

  useEffect(() => {
    if (resizingCol === null) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta); // min width 50px
      setColWidths(prev => {
        const next = [...prev];
        next[resizingCol] = newWidth;
        return next;
      });
    };
    
    const handleMouseUp = () => {
      setResizingCol(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, startX, startWidth]);

  const handleResizeStart = (colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingCol(colIndex);
    setStartX(e.clientX);
    setStartWidth(colWidths[colIndex]);
  };

  // Selection state
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ startRow: number; endRow: number; startCol: number; endCol: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editOffset, setEditOffset] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (field: string) => {
    setSortConfig(current => {
      if (!current || current.field !== field) {
        return { field, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return null;
    });
  };

  const processedData = useMemo(() => {
    let result = data.map((d, idx) => ({ ...d, _originalIndex: idx }));
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.field];
        const valB = b[sortConfig.field];
        if (valA === null || valA === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, sortConfig]);

  // Virtualization calculations
  const totalHeight = processedData.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(processedData.length - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 2);
  
  const visibleData = useMemo(() => {
    return processedData.slice(startIndex, endIndex + 1);
  }, [processedData, startIndex, endIndex]);

  // Handle Resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Mouse Handlers for Selection
  const handleMouseDown = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    if (editingCell) {
      if (editingCell.row === rowIndex && editingCell.col === colIndex) {
        // Clicking inside the currently editing cell (e.g. clicking a select dropdown)
        e.stopPropagation();
        return;
      } else {
        finishEditing();
      }
    }
    
    setSelectedCell({ row: rowIndex, col: colIndex });
    setSelectionRange({ startRow: rowIndex, endRow: rowIndex, startCol: colIndex, endCol: colIndex });
    setIsDragging(true);
  };

  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    if (!isDragging || !selectionRange) return;
    setSelectionRange({
      ...selectionRange,
      endRow: rowIndex,
      endCol: colIndex
    });
  };

  const handleRowHeaderMouseDown = (rowIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    if (editingCell) {
      finishEditing();
    }
    
    setSelectedCell({ row: rowIndex, col: 0 });
    setSelectionRange({ startRow: rowIndex, endRow: rowIndex, startCol: 0, endCol: columns.length - 1 });
    setIsDragging(true);
  };

  const handleRowHeaderMouseEnter = (rowIndex: number) => {
    if (!isDragging || !selectionRange) return;
    setSelectionRange({
      ...selectionRange,
      endRow: rowIndex,
      startCol: 0,
      endCol: columns.length - 1
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Editing Handlers
  const handleDoubleClick = (rowIndex: number, colIndex: number, value: any, e?: React.MouseEvent) => {
    if (!columns[colIndex].editable) return;
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(value !== null && value !== undefined ? String(value) : "");
    
    if (e) {
      let offset = value !== null && value !== undefined ? String(value).length : 0;
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
          offset = range.startOffset;
        }
      } else if ((document as any).caretPositionFromPoint) {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        if (pos && pos.offsetNode.nodeType === Node.TEXT_NODE) {
          offset = pos.offset;
        }
      }
      setEditOffset(offset);
    } else {
      setEditOffset(null);
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.tagName === 'INPUT') {
        const inputEl = inputRef.current as HTMLInputElement;
        if (editOffset !== null) {
          inputEl.setSelectionRange(editOffset, editOffset);
        } else {
          inputEl.select();
        }
      }
    }
  }, [editingCell, editOffset]);

  const finishEditing = () => {
    if (editingCell && onDataChange) {
      const field = columns[editingCell.col].field;
      const originalValue = data[editingCell.row][field];
      if (originalValue !== editValue) {
        onDataChange(editingCell.row, field, editValue);
      }
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        finishEditing();
        // Move selection down
        if (selectedCell && selectedCell.row < data.length - 1) {
          setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
          setSelectionRange({ startRow: selectedCell.row + 1, endRow: selectedCell.row + 1, startCol: selectedCell.col, endCol: selectedCell.col });
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
      return;
    }

    if (selectedCell) {
      let { row, col } = selectedCell;
      if (e.key === 'ArrowUp' && row > 0) row--;
      else if (e.key === 'ArrowDown' && row < data.length - 1) row++;
      else if (e.key === 'ArrowLeft' && col > 0) col--;
      else if (e.key === 'ArrowRight' && col < columns.length - 1) col++;
      else if (e.key === 'Enter' && columns[col].editable) {
        handleDoubleClick(row, col, data[row][columns[col].field]);
        e.preventDefault();
        return;
      }

      if (row !== selectedCell.row || col !== selectedCell.col) {
        setSelectedCell({ row, col });
        setSelectionRange({ startRow: row, endRow: row, startCol: col, endCol: col });
        e.preventDefault();
      }
    }
  };

  // Rendering helpers
  const isCellSelected = (rowIndex: number, colIndex: number) => {
    return selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
  };

  const isCellInRange = (rowIndex: number, colIndex: number) => {
    if (!selectionRange) return false;
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minCol = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol);
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  };

  const isRowHeaderSelected = (rowIndex: number) => {
    if (!selectionRange) return false;
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);
    return rowIndex >= minRow && rowIndex <= maxRow;
  };

  const isColHeaderSelected = (colIndex: number) => {
    if (!selectionRange) return false;
    const minCol = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol);
    return colIndex >= minCol && colIndex <= maxCol;
  };

  const rowHeaderWidth = 40;

  return (
    <div 
      className={`relative border border-[#d4d4d4] bg-white overflow-hidden flex flex-col focus:outline-none ${className}`}
      style={{ ...style, fontFamily: 'Arial, sans-serif' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >

      {/* Body / Virtual Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-white select-none relative"
        onScroll={handleScroll}
      >
        {/* Header */}
        <div 
          className="flex border-b border-[#d4d4d4] text-xs text-[#444] select-none z-30 sticky top-0"
          style={{ height: headerHeight, minWidth: 'min-content' }}
        >
          {/* State Column Header */}
          <div className="w-[20px] border-r border-[#d4d4d4] flex-shrink-0 bg-[#f3f3f3]" />
          {/* Checkbox Header */}
          {showCheckboxes && (
            <div 
              className="flex items-center justify-center border-r border-[#d4d4d4] flex-shrink-0 bg-[#f3f3f3] w-[40px]"
            >
              <input 
                type="checkbox"
                checked={data.length > 0 && selectedRowIndices.length === data.length}
                onChange={(e) => {
                  if (!onSelectionChange) return;
                  if (e.target.checked) {
                    onSelectionChange(data.map((_, idx) => idx));
                  } else {
                    onSelectionChange([]);
                  }
                }}
                className="cursor-pointer"
              />
            </div>
          )}
          {/* Corner Cell (Empty) */}
          <div 
            className="flex items-center justify-center border-r border-[#d4d4d4] flex-shrink-0 bg-[#f3f3f3]"
            style={{ width: rowHeaderWidth }}
          />
          {/* Column Headers */}
          {columns.map((col, i) => {
            const selected = isColHeaderSelected(i);
            const isSorted = sortConfig?.field === col.field;
            return (
              <div 
                key={i} 
                className="flex items-center justify-center border-r border-[#d4d4d4] flex-shrink-0 truncate cursor-pointer relative group select-none"
                style={{ 
                  width: colWidths[i],
                  backgroundColor: selected ? '#e6ebf5' : '#f3f3f3',
                  fontWeight: 'normal',
                }}
                onClick={() => handleSort(col.field)}
              >
                {col.headerName}
                {isSorted && (
                  <span className="ml-1 text-[10px] text-gray-500 font-bold">
                    {sortConfig!.direction === 'asc' ? '▲' : '▼'}
                  </span>
                )}
                
                {/* Resizer Handle */}
                <div 
                  className="absolute right-[-2px] top-0 bottom-0 w-2.5 cursor-col-resize z-10"
                  onMouseDown={(e) => handleResizeStart(i, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
        <div style={{ height: totalHeight, minWidth: 'min-content', position: 'relative' }}>
          <div style={{ transform: `translateY(${startIndex * rowHeight}px)`, position: 'absolute', left: 0, right: 0 }}>
            {visibleData.map((row, i) => {
              const actualRowIndex = row._originalIndex;
              const rowSelected = isRowHeaderSelected(actualRowIndex);

              return (
                <div 
                  key={actualRowIndex} 
                  className="flex border-b border-[#d4d4d4] w-max min-w-full"
                  style={{ 
                    height: rowHeight,
                    zIndex: editingCell?.row === actualRowIndex ? 50 : 1,
                    position: 'relative'
                  }}
                >
                  {/* State Indicator */}
                  <div className="w-[20px] border-r border-[#d4d4d4] flex-shrink-0 flex items-center justify-center bg-[#f3f3f3]">
                    {row._state === 'U' && <span className="text-[10px] text-blue-600 font-bold" title="수정됨">U</span>}
                    {row._state === 'C' && <span className="text-[10px] text-green-600 font-bold" title="추가됨">I</span>}
                    {row._state === 'D' && <span className="text-[10px] text-red-600 font-bold" title="삭제됨">D</span>}
                  </div>

                  {/* Checkbox Cell */}
                  {showCheckboxes && (
                    <div 
                      className="flex items-center justify-center border-r border-[#d4d4d4] flex-shrink-0 w-[40px]"
                      style={{ 
                        backgroundColor: rowSelected ? '#a9c4eb' : '#f3f3f3' 
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedRowIndices.includes(actualRowIndex)}
                        onChange={(e) => {
                          if (!onSelectionChange) return;
                          const next = e.target.checked
                            ? [...selectedRowIndices, actualRowIndex]
                            : selectedRowIndices.filter(idx => idx !== actualRowIndex);
                          onSelectionChange(next);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Row Header (Numbers) */}
                  <div 
                    className="flex items-center justify-center border-r border-[#d4d4d4] flex-shrink-0 text-xs cursor-default"
                    style={{ 
                      width: rowHeaderWidth,
                      backgroundColor: rowSelected ? '#a9c4eb' : '#f3f3f3',
                      color: rowSelected ? '#000' : '#444'
                    }}
                    onMouseDown={(e) => handleRowHeaderMouseDown(actualRowIndex, e)}
                    onMouseEnter={() => handleRowHeaderMouseEnter(actualRowIndex)}
                  >
                    {startIndex + i + 1}
                  </div>

                  {/* Row Cells */}
                  {columns.map((col, colIndex) => {
                    const value = row[col.field];
                    const selected = isCellSelected(actualRowIndex, colIndex);
                    const inRange = isCellInRange(actualRowIndex, colIndex);
                    const isEditing = editingCell?.row === actualRowIndex && editingCell?.col === colIndex;
                    
                    return (
                        <div
                          key={colIndex}
                          className={`px-1.5 flex items-center border-r border-[#d4d4d4] flex-shrink-0 relative text-sm`}
                          style={{ 
                            width: colWidths[colIndex],
                            backgroundColor: selected ? '#fff' : (inRange ? '#e6ebf5' : '#fff'),
                            zIndex: isEditing ? 50 : 20
                          }}
                        onMouseDown={(e) => handleMouseDown(actualRowIndex, colIndex, e)}
                        onMouseEnter={() => handleMouseEnter(actualRowIndex, colIndex)}
                        onDoubleClick={(e) => handleDoubleClick(actualRowIndex, colIndex, value, e)}
                      >
                        {/* Excel Selection Borders (Black) */}
                        {inRange && (
                          <div className={`absolute inset-0 pointer-events-none z-20`}
                               style={{
                                 borderTop: actualRowIndex === Math.min(selectionRange!.startRow, selectionRange!.endRow) ? '2px solid #000' : 'none',
                                 borderBottom: actualRowIndex === Math.max(selectionRange!.startRow, selectionRange!.endRow) ? '2px solid #000' : 'none',
                                 borderLeft: colIndex === Math.min(selectionRange!.startCol, selectionRange!.endCol) ? '2px solid #000' : 'none',
                                 borderRight: colIndex === Math.max(selectionRange!.startCol, selectionRange!.endCol) ? '2px solid #000' : 'none',
                               }}
                          />
                        )}

                        {/* Fill Handle (Black small square) */}
                        {inRange && 
                         actualRowIndex === Math.max(selectionRange!.startRow, selectionRange!.endRow) && 
                         colIndex === Math.max(selectionRange!.startCol, selectionRange!.endCol) && (
                          <div className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] bg-black border border-white cursor-crosshair z-30" />
                        )}

                        {isEditing ? (
                          col.editType === 'select' && col.options ? (
                            <div
                              className="absolute inset-0 w-full h-full z-50 outline-none"
                              tabIndex={0}
                              ref={inputRef as any}
                              onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  finishEditing();
                                }
                              }}
                            >
                              <div className="absolute inset-0 ring-2 ring-inset ring-black bg-white pointer-events-none" />
                              <div className="relative w-full h-full flex items-center px-1.5">
                                <div className="w-full truncate">{editValue}</div>
                              </div>
                              {(() => {
                                const isNearBottom = (actualRowIndex * rowHeight - scrollTop + 200) > containerHeight;
                                return (
                                  <div className={`absolute left-[-2px] right-[-2px] bg-white border border-gray-400 shadow-xl max-h-48 overflow-y-auto z-[100] ${isNearBottom ? 'bottom-full mb-[2px]' : 'top-full mt-[2px]'}`}>
                                    {col.options!.map((opt, idx) => (
                                      <div
                                        key={idx}
                                        className="px-2 py-1.5 hover:bg-[#e6ebf5] cursor-pointer text-sm"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (onDataChange) {
                                            onDataChange(actualRowIndex, col.field, opt.value);
                                          }
                                          setEditingCell(null);
                                        }}
                                      >
                                        {opt.label}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="absolute inset-0 w-full h-full z-40 bg-white">
                              <div className="absolute inset-0 ring-2 ring-inset ring-black pointer-events-none" />
                              <input
                                ref={inputRef as React.RefObject<HTMLInputElement>}
                                type="text"
                                className="relative w-full h-full border-none outline-none px-1.5 py-0 m-0 bg-transparent text-sm leading-none"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={finishEditing}
                                style={{ lineHeight: 'inherit' }}
                              />
                            </div>
                          )
                        ) : (
                          <div className="w-full truncate">
                            {col.renderCell ? col.renderCell(value, row) : value}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[#444]">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
