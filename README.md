# Advanced Data Table

A powerful, feature-rich data table component built with React, TypeScript, and Next.js. This package provides comprehensive data visualization capabilities with advanced filtering, sorting, pagination, and export functionality.

## Features

- 🔍 **Advanced Filtering**: Complex filter conditions with multiple operators and data types
- 🔄 **Real-time Search**: Instant search across multiple fields with debouncing
- 📊 **Flexible Sorting**: Multi-column sorting with Ctrl+click, priority indicators, and nested field support
- 📄 **Pagination**: Client-side pagination with customizable page sizes
- 📤 **Data Export**: CSV export functionality with customizable fields
- 🎨 **Column Management**: Show/hide columns with visibility controls
- ⚡ **Bulk Actions**: Perform actions on multiple selected rows
- 🎯 **Row Actions**: Individual row actions with custom handlers
- 🌙 **Dark Mode**: Built-in dark mode support with Tailwind CSS
- 📱 **Responsive**: Mobile-first responsive design
- 🔧 **TypeScript**: Full TypeScript support with strict typing
- 🧪 **Well Tested**: Comprehensive test suite with Vitest

## Installation

### Prerequisites

- Node.js (compatible with Next.js 15.4.4)
- npm or pnpm package manager

### Setup

1. **Clone or download the project**
```bash
git clone <repository-url>
cd advanced-data-table
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Start development server**
```bash
npm run dev
# or
pnpm dev
```

4. **Build for production**
```bash
npm run build
npm run start
```

## Quick Start

### Basic Usage

```tsx
import { DataTable } from "@/components/data-table/data-table"
import type { ColumnConfig } from "@/lib/types"

// Define your data structure
interface User {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  createdAt: string
}

// Define column configuration
const columns: ColumnConfig[] = [
  { key: "id", label: "ID", variant: "text", sortable: true },
  { key: "name", label: "Name", variant: "text", sortable: true },
  { key: "email", label: "Email", variant: "text", sortable: true },
  { key: "status", label: "Status", variant: "select", sortable: true },
  { key: "createdAt", label: "Created", variant: "date", sortable: true },
]

// Define searchable fields
const searchFields = ["name", "email"]

function UsersTable() {
  const users: User[] = [
    // your data here
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      searchFields={searchFields}
      title="Users"
      exportFilename="users"
    />
  )
}
```

### With Data Fetching

```tsx
import { DataTable } from "@/components/data-table/data-table"
import { useAllReports } from "@/lib/graphql-client"

function ReportsTable() {
  const { data: reports = [], isLoading, error } = useAllReports()

  if (error) {
    return <div>Error loading reports: {error.message}</div>
  }

  return (
    <DataTable
      data={reports}
      columns={REPORTS_COLUMNS}
      searchFields={REPORTS_SEARCH_FIELDS}
      title="Reports"
      loading={isLoading}
      exportFilename="reports"
    />
  )
}
```

## Advanced Features

### Multi-Column Sorting

The data table supports advanced multi-column sorting with priority-based ordering:

```tsx
// Single-column sorting (default behavior)
// Click on any sortable column header to sort by that column

// Multi-column sorting
// Hold Ctrl and click on column headers to add them to the sort order
// Each column shows a priority number indicating sort precedence
// Click again while holding Ctrl to toggle between ascending/descending
// Click a third time while holding Ctrl to remove the column from sort order
```

**Visual Indicators:**
- **Single sort**: Shows up/down arrow for the sorted column
- **Multi sort**: Shows up/down arrow with priority number (1, 2, 3, etc.)
- **No sort**: Shows up/down arrow icon

**Usage Example:**
1. Click "Name" column → sorts by name ascending
2. Ctrl+click "Date" column → sorts by name ascending, then date ascending (Date shows priority "2")
3. Ctrl+click "Name" column → toggles name to descending, date remains secondary sort
4. Ctrl+click "Status" column → adds status as tertiary sort (shows priority "3")

### Custom Cell Rendering

```tsx
const renderCell = useCallback((value: any, column: ColumnConfig, row: any) => {
  switch (column.key) {
    case "status":
      return (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
      )
    case "createdAt":
      return format(new Date(value), "MMM dd, yyyy")
    default:
      return value || "-"
  }
}, [])

<DataTable
  data={data}
  columns={columns}
  searchFields={searchFields}
  renderCell={renderCell}
/>
```

### Row Actions

```tsx
import { Edit, Trash2, Eye } from "lucide-react"

const actions: ActionItem[] = [
  {
    id: "view",
    label: "View Details",
    icon: Eye,
    onClick: (row) => console.log("View:", row.id),
  },
  {
    id: "edit",
    label: "Edit",
    icon: Edit,
    onClick: (row) => console.log("Edit:", row.id),
  },
  {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    variant: "destructive",
    onClick: (row) => console.log("Delete:", row.id),
    disabled: (row) => row.status === "protected",
  },
]

<DataTable
  data={data}
  columns={columns}
  searchFields={searchFields}
  actions={actions}
/>
```

### Bulk Actions

```tsx
import { Download, Archive, Trash2 } from "lucide-react"

const bulkActions: BulkActionItem[] = [
  {
    id: "export",
    label: "Export Selected",
    icon: Download,
    onClick: (selectedRows) => exportData(selectedRows),
  },
  {
    id: "archive",
    label: "Archive Selected",
    icon: Archive,
    onClick: (selectedRows) => archiveItems(selectedRows),
  },
  {
    id: "delete",
    label: "Delete Selected",
    icon: Trash2,
    variant: "destructive",
    onClick: (selectedRows) => deleteItems(selectedRows),
  },
]

<DataTable
  data={data}
  columns={columns}
  searchFields={searchFields}
  enableSelection={true}
  bulkActions={bulkActions}
/>
```

## API Reference

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of data objects to display |
| `columns` | `ColumnConfig[]` | Required | Column configuration array |
| `searchFields` | `string[]` | Required | Fields to search across |
| `title` | `string` | `"Data Table"` | Table title |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string \| null` | `null` | Error message |
| `loadingMessage` | `string` | `"Loading data..."` | Loading message |
| `emptyMessage` | `string` | `"No data available"` | Empty state message |
| `noResultsMessage` | `string` | `"No data matches your filters"` | No results message |
| `exportFilename` | `string` | `"data"` | CSV export filename |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `renderCell` | `function` | `undefined` | Custom cell renderer |
| `actions` | `ActionItem[]` | `[]` | Row actions |
| `bulkActions` | `BulkActionItem[]` | `[]` | Bulk actions |
| `enableSelection` | `boolean` | `false` | Enable row selection |
| `onCreateNew` | `function` | `undefined` | Create new item handler |
| `createButtonLabel` | `string` | `"Create New"` | Create button label |

### ColumnConfig

```typescript
interface ColumnConfig {
  key: string                    // Field key (supports nested: "user.name")
  label: string                  // Display label
  variant: FilterVariant         // Data type for filtering
  sortable?: boolean            // Enable sorting (default: false)
  exportable?: boolean          // Include in CSV export (default: false)
  visible?: boolean             // Column visibility (default: true)
  options?: { label: string; value: string }[]  // Options for select variant
}
```

### Filter Variants

- `"text"` - Text input with contains, equals, empty operators
- `"number"` - Numeric input with comparison operators
- `"range"` - Numeric range input
- `"date"` - Date picker with date comparison operators
- `"dateRange"` - Date range picker
- `"boolean"` - Boolean toggle
- `"select"` - Single select dropdown
- `"multiSelect"` - Multiple select dropdown

### ActionItem

```typescript
interface ActionItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: any) => void
  disabled?: (row: any) => boolean
  variant?: "default" | "destructive"
}
```

### BulkActionItem

```typescript
interface BulkActionItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (selectedRows: any[]) => void
  disabled?: (selectedRows: any[]) => boolean
  variant?: "default" | "destructive"
}
```

## Data Fetching Integration

### With TanStack Query

```tsx
import { useQuery } from '@tanstack/react-query'

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

function UsersTable() {
  const { data: users = [], isLoading, error } = useUsers()

  return (
    <DataTable
      data={users}
      columns={columns}
      searchFields={searchFields}
      loading={isLoading}
      error={error?.message}
    />
  )
}
```

### With Apollo GraphQL

```tsx
import { useQuery } from '@apollo/client'
import { GET_REPORTS } from '@/lib/graphql-queries'

function ReportsTable() {
  const { data, loading, error } = useQuery(GET_REPORTS)

  return (
    <DataTable
      data={data?.reports || []}
      columns={columns}
      searchFields={searchFields}
      loading={loading}
      error={error?.message}
    />
  )
}
```

## Styling and Theming

The component uses Tailwind CSS with CSS variables for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variables */
}
```

### Custom Styling

```tsx
// Custom table wrapper
<div className="custom-table-container">
  <DataTable
    data={data}
    columns={columns}
    searchFields={searchFields}
  />
</div>
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Structure

The project includes comprehensive tests for:

- **Client Filters** (`client-filters.test.ts`) - Data processing utilities
- **Filter Utils** (`filter-utils.test.ts`) - Filter utilities
- **GraphQL Client** (`graphql-client.test.ts`) - Data fetching
- **Integration** (`integration.test.ts`) - End-to-end scenarios

### Writing Tests

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DataTable } from "@/components/data-table/data-table"

describe("DataTable", () => {
  const mockData = [
    { id: "1", name: "John", email: "john@example.com" }
  ]
  
  const mockColumns = [
    { key: "name", label: "Name", variant: "text" as const }
  ]

  it("should render data correctly", () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        searchFields={["name"]}
      />
    )
    
    expect(screen.getByText("John")).toBeInTheDocument()
  })
})
```

## Performance Optimization

### Memoization

The component uses React's optimization hooks:

```tsx
// Memoized column configuration
const columns = useMemo(() => [
  { key: "name", label: "Name", variant: "text" }
], [dependencies])

// Memoized cell renderer
const renderCell = useCallback((value, column, row) => {
  // rendering logic
}, [dependencies])
```

### Large Datasets

For large datasets, consider:

1. **Server-side pagination** instead of client-side
2. **Virtual scrolling** for very large lists
3. **Debounced search** (already implemented)
4. **Lazy loading** of data

## Development Workflow

### Project Structure

```
components/
├── ui/                     # Reusable UI components (shadcn/ui)
├── data-table/            # Data table components
│   ├── data-table.tsx     # Main generic table component
│   ├── reports-table.tsx  # Domain-specific implementation
│   ├── advanced-filters.tsx # Filter components
│   ├── data-table-header.tsx
│   ├── data-table-search.tsx
│   ├── data-table-pagination.tsx
│   └── column-visibility-toggle.tsx
lib/
├── graphql-client.ts      # GraphQL queries and hooks
├── client-filters.ts      # Data processing utilities
├── data-table-config.ts   # Filter configurations
├── data-table-utils.ts    # Utility functions
├── types.ts              # TypeScript type definitions
└── utils.ts              # General utilities
__tests__/                # Test files
├── client-filters.test.ts
├── filter-utils.test.ts
├── graphql-client.test.ts
└── integration.test.ts
```

### Adding New Features

1. **Define TypeScript interfaces** in `lib/types.ts`
2. **Implement data processing** in `lib/client-filters.ts`
3. **Create reusable components** with proper generics
4. **Add comprehensive tests** covering all scenarios
5. **Update documentation** as needed

### Code Quality Checklist

- [ ] TypeScript strict mode compliance
- [ ] Proper error handling implemented
- [ ] Tests written and passing
- [ ] Components are reusable and generic
- [ ] Performance optimizations applied
- [ ] Documentation updated

## Troubleshooting

### Common Issues

**1. TypeScript errors with column keys**
```typescript
// Use string literals for nested keys
const columns: ColumnConfig[] = [
  { key: "user.profile.name", label: "Name", variant: "text" }
]
```

**2. Custom cell rendering not working**
```typescript
// Ensure renderCell function is memoized
const renderCell = useCallback((value, column, row) => {
  // Your rendering logic
}, [dependencies])
```

**3. Filters not working with nested data**
```typescript
// Use dot notation for nested fields
const searchFields = ["user.name", "user.email", "profile.bio"]
```

**4. Performance issues with large datasets**
```typescript
// Implement server-side pagination
const { data, loading } = useQuery(GET_PAGINATED_DATA, {
  variables: { page, limit, filters }
})
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing tests for usage examples
3. Create an issue with a minimal reproduction case

---

*Last updated: August 5, 2025*