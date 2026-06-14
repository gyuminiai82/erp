import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export interface ColumnDef {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
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
}

export function DataGrid({
  columns,
  data,
  rowHeight = 40,
  headerHeight = 40,
  onDataChange,
  className = "",
  style
}: DataGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Selection state
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ startRow: number; endRow: number; startCol: number; endCol: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Virtualization calculations
  const totalHeight = data.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(data.length - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 2);
  
  const visibleData = useMemo(() => {
    return data.slice(startIndex, endIndex + 1).map((row, i) => ({
      ...row,
      _originalIndex: startIndex + i
    }));
  }, [data, startIndex, endIndex]);

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
    if (editingCell) finishEditing();
    
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Editing Handlers
  const handleDoubleClick = (rowIndex: number, colIndex: number, value: any) => {
    if (!columns[colIndex].editable) return;
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(value !== null && value !== undefined ? String(value) : "");
    // focus input is handled in effect
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

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
        
        // Scroll into view logic could be added here
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

  const getBorderClasses = (rowIndex: number, colIndex: number) => {
    if (!selectionRange) return "";
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minCol = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol);
    
    if (!isCellInRange(rowIndex, colIndex)) return "";
    
    let classes = "border-blue-500 ";
    if (rowIndex === minRow) classes += "border-t-2 ";
    if (rowIndex === maxRow) classes += "border-b-2 ";
    if (colIndex === minCol) classes += "border-l-2 ";
    if (colIndex === maxCol) classes += "border-r-2 ";
    return classes;
  };

  return (
    <div 
      className={`relative border border-gray-300 bg-white overflow-hidden flex flex-col focus:outline-none ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div 
        className="flex bg-gray-100 border-b border-gray-300 font-semibold text-sm text-gray-700 select-none z-10 relative"
        style={{ height: headerHeight, minWidth: 'min-content' }}
      >
        {columns.map((col, i) => (
          <div 
            key={i} 
            className="flex items-center px-2 border-r border-gray-300 flex-shrink-0 truncate"
            style={{ width: col.width || 150 }}
          >
            {col.headerName}
          </div>
        ))}
      </div>

      {/* Body / Virtual Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-white select-none relative"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, minWidth: 'min-content', position: 'relative' }}>
          <div style={{ transform: `translateY(${startIndex * rowHeight}px)`, position: 'absolute', left: 0, right: 0 }}>
            {visibleData.map((row, i) => {
              const actualRowIndex = row._originalIndex;
              return (
                <div 
                  key={actualRowIndex} 
                  className="flex border-b border-gray-200 hover:bg-gray-50/50"
                  style={{ height: rowHeight }}
                >
                  {columns.map((col, colIndex) => {
                    const value = row[col.field];
                    const selected = isCellSelected(actualRowIndex, colIndex);
                    const inRange = isCellInRange(actualRowIndex, colIndex);
                    const isEditing = editingCell?.row === actualRowIndex && editingCell?.col === colIndex;
                    
                    return (
                      <div
                        key={colIndex}
                        className={`px-2 flex items-center border-r border-gray-200 flex-shrink-0 relative truncate text-sm
                          ${inRange && !selected ? 'bg-blue-50/50' : ''}
                          ${selected ? 'bg-white z-10' : ''}
                        `}
                        style={{ width: col.width || 150 }}
                        onMouseDown={(e) => handleMouseDown(actualRowIndex, colIndex, e)}
                        onMouseEnter={() => handleMouseEnter(actualRowIndex, colIndex)}
                        onDoubleClick={() => handleDoubleClick(actualRowIndex, colIndex, value)}
                      >
                        {/* Excel Selection Borders */}
                        {inRange && (
                          <div className={`absolute inset-0 pointer-events-none border-blue-500 z-10
                            ${actualRowIndex === Math.min(selectionRange!.startRow, selectionRange!.endRow) ? 'border-t-2' : ''}
                            ${actualRowIndex === Math.max(selectionRange!.startRow, selectionRange!.endRow) ? 'border-b-2' : ''}
                            ${colIndex === Math.min(selectionRange!.startCol, selectionRange!.endCol) ? 'border-l-2' : ''}
                            ${colIndex === Math.max(selectionRange!.startCol, selectionRange!.endCol) ? 'border-r-2' : ''}
                          `} />
                        )}

                        {/* Fill Handle (the little square) */}
                        {inRange && 
                         actualRowIndex === Math.max(selectionRange!.startRow, selectionRange!.endRow) && 
                         colIndex === Math.max(selectionRange!.startCol, selectionRange!.endCol) && (
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-crosshair z-20" />
                        )}

                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className="absolute inset-0 w-full h-full border-2 border-blue-500 px-2 outline-none z-30 text-sm bg-white"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                          />
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
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
