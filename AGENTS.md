<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-patterns-rules -->
# UI Patterns

- **DataGrid UI Pattern**: When using the `DataGrid` component, always match the UI layout pattern from the Employee Management (사원 관리) page. Specifically:
  1. Title and description should be placed above the main container using `flex justify-between items-end mb-8`.
  2. The `DataGrid` must be wrapped in `<div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] border-2 border-gray-400 shadow-sm overflow-hidden bg-white">` to ensure a consistent fixed height, prevent full-page scrolling, and apply a thick gray border.
  3. Action buttons (e.g. Export, Add) and search filters should be placed inside the white wrapper but above the DataGrid, typically right-aligned.
  4. Include `showCheckboxes={true}` and row selection states (`selectedRowIndices`, `onSelectionChange`) when rendering the DataGrid.
<!-- END:ui-patterns-rules -->
