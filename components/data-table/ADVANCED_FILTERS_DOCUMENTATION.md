# AdvancedFilters Component Documentation

## Overview

The `AdvancedFilters` component is a sophisticated filtering system for data tables that allows users to create complex filter conditions organized into groups. It provides a flexible and intuitive interface for building advanced queries with support for multiple data types, operators, and logical groupings.

## Features

- **Filter Groups**: Organize filter conditions into logical groups with AND/OR operators
- **Multiple Data Types**: Support for text, number, date, boolean, select, and multi-select filters
- **Dynamic Management**: Add, remove, and modify filter groups and conditions dynamically
- **Collapsible Interface**: Toggle visibility of the filter configuration panel
- **Active Filter Indicator**: Visual badge showing the number of active filters
- **Clear All Functionality**: Quick action to remove all filters at once

## Props

### AdvancedFiltersProps

```typescript
interface AdvancedFiltersProps {
  columns: ColumnConfig[]
  filterGroups: FilterGroup[]
  onFiltersChange: (groups: FilterGroup[]) => void
}
```

#### `columns: ColumnConfig[]`
Array of column configurations that define the available fields for filtering.

```typescript
interface ColumnConfig {
  key: string                                    // Unique identifier for the column
  label: string                                  // Display name for the column
  variant: FilterVariant                         // Type of filter (text, number, date, etc.)
  sortable?: boolean                            // Whether the column is sortable
  exportable?: boolean                          // Whether the column can be exported
  options?: { label: string; value: string }[]  // Options for select/multiSelect variants
}
```

**Supported FilterVariants:**
- `"text"` - Text-based filtering with contains, equals, etc.
- `"number"` - Numeric filtering with comparison operators
- `"range"` - Numeric range filtering with min/max values
- `"date"` - Date filtering with before/after/between operators
- `"dateRange"` - Date range filtering
- `"boolean"` - Boolean true/false filtering
- `"select"` - Single selection from predefined options
- `"multiSelect"` - Multiple selection from predefined options

#### `filterGroups: FilterGroup[]`
Array of filter groups containing the current filter state.

```typescript
interface FilterGroup {
  id: string                    // Unique identifier for the group
  conditions: FilterCondition[] // Array of filter conditions in this group
  joinOperator: JoinOperator    // How conditions are joined ("and" | "or")
}

interface FilterCondition {
  id: string           // Unique identifier for the condition
  field: string        // Column key being filtered
  operator: Operator   // Comparison operator
  value: any          // Filter value (type depends on variant)
  variant: FilterVariant // Type of filter matching the column variant
}
```

**Available Operators by Variant:**

| Variant | Operators |
|---------|-----------|
| text | `iLike`, `notILike`, `eq`, `ne`, `isEmpty`, `isNotEmpty` |
| number/range | `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `isBetween`, `isEmpty`, `isNotEmpty` |
| date/dateRange | `eq`, `ne`, `lt`, `gt`, `lte`, `gte`, `isBetween`, `isEmpty`, `isNotEmpty` |
| select | `eq`, `ne`, `isEmpty`, `isNotEmpty` |
| multiSelect | `inArray`, `notInArray`, `isEmpty`, `isNotEmpty` |
| boolean | `eq`, `ne` |

#### `onFiltersChange: (groups: FilterGroup[]) => void`
Callback function called whenever the filter configuration changes. Receives the updated array of filter groups.

## Usage Examples

### Basic Usage

```tsx
import { AdvancedFilters } from "@/components/data-table/advanced-filters"
import { useState } from "react"

function DataTableExample() {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  
  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", variant: "text" },
    { key: "age", label: "Age", variant: "number" },
    { key: "email", label: "Email", variant: "text" },
    { key: "status", label: "Status", variant: "select", options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" }
    ]},
    { key: "isVerified", label: "Verified", variant: "boolean" }
  ]

  return (
    <AdvancedFilters
      columns={columns}
      filterGroups={filterGroups}
      onFiltersChange={setFilterGroups}
    />
  )
}
```

### With Initial Filters

```tsx
const initialFilters: FilterGroup[] = [
  {
    id: "group-1",
    joinOperator: "and",
    conditions: [
      {
        id: "condition-1",
        field: "name",
        operator: "iLike",
        value: "John",
        variant: "text"
      },
      {
        id: "condition-2",
        field: "age",
        operator: "gte",
        value: "18",
        variant: "number"
      }
    ]
  }
]

<AdvancedFilters
  columns={columns}
  filterGroups={initialFilters}
  onFiltersChange={setFilterGroups}
/>
```

### Complex Multi-Group Example

```tsx
const complexFilters: FilterGroup[] = [
  {
    id: "group-1",
    joinOperator: "and",
    conditions: [
      {
        id: "condition-1",
        field: "department",
        operator: "eq",
        value: "Engineering",
        variant: "select"
      },
      {
        id: "condition-2",
        field: "salary",
        operator: "isBetween",
        value: { min: "50000", max: "100000" },
        variant: "range"
      }
    ]
  },
  {
    id: "group-2",
    joinOperator: "or",
    conditions: [
      {
        id: "condition-3",
        field: "skills",
        operator: "inArray",
        value: ["React", "TypeScript"],
        variant: "multiSelect"
      }
    ]
  }
]
```

## Key Methods and Functionality

### Internal Methods

The component provides several internal methods for managing filter state:

#### `addFilterGroup()`
Creates a new empty filter group and adds it to the filter groups array.

#### `addCondition(groupId: string)`
Adds a new filter condition to the specified group with default values based on the first available column.

#### `updateCondition(groupId: string, conditionId: string, updatedCondition: FilterCondition)`
Updates a specific filter condition within a group.

#### `removeCondition(groupId: string, conditionId: string)`
Removes a filter condition from a group. If the group becomes empty, the entire group is removed.

#### `updateGroupJoinOperator(groupId: string, joinOperator: JoinOperator)`
Changes the join operator (AND/OR) for a specific filter group.

#### `removeFilterGroup(groupId: string)`
Removes an entire filter group and all its conditions.

#### `clearAllFilters()`
Removes all filter groups and conditions, resetting the filter state.

## UI Components and Behavior

### Filter Toggle Button
- Displays "Advanced Filters" with a filter icon
- Shows a badge with the total number of active filter conditions
- Toggles the visibility of the filter configuration panel

### Filter Groups
- Each group is visually separated and contains:
  - Join operator selector (AND/OR) for conditions within the group
  - Individual filter conditions
  - "Add Condition" button
  - "Remove Group" button
- Groups are connected with "OR" labels between them

### Filter Conditions
- Each condition displays:
  - Column selector dropdown
  - Operator selector (context-sensitive based on column variant)
  - Value input(s) appropriate for the data type
  - Remove condition button

### Clear All Button
- Only visible when there are active filters
- Provides quick way to reset all filters

## Implementation Notes

### State Management
- The component is controlled - all state is managed by the parent component
- Filter changes are communicated through the `onFiltersChange` callback
- The component generates unique IDs using timestamps for new groups and conditions

### Data Flow
1. User interacts with filter controls
2. Component calls appropriate internal method
3. Updated filter groups are passed to `onFiltersChange`
4. Parent component updates its state
5. Component re-renders with new filter configuration

### Type Safety
- Full TypeScript support with strict typing
- Variant-specific operator validation
- Type-safe value handling based on column variants

### Performance Considerations
- Uses React's built-in state management for UI state (open/closed)
- Efficient re-rendering through proper key props
- Minimal re-computation of derived values

## Best Practices

### Column Configuration
```tsx
// Provide clear, user-friendly labels
const columns: ColumnConfig[] = [
  { key: "firstName", label: "First Name", variant: "text" },
  { key: "birthDate", label: "Date of Birth", variant: "date" },
  { key: "salary", label: "Annual Salary", variant: "range" }
]
```

### Filter State Management
```tsx
// Use a reducer for complex filter state management
const [filterGroups, dispatch] = useReducer(filterReducer, initialFilters)

// Or use a custom hook for reusable filter logic
const { filters, updateFilters, clearFilters } = useAdvancedFilters(initialFilters)
```

### Validation
```tsx
// Validate filter values before applying
function handleFiltersChange(groups: FilterGroup[]) {
  const validatedGroups = groups.map(group => ({
    ...group,
    conditions: group.conditions.filter(condition => 
      condition.value !== null && condition.value !== ""
    )
  })).filter(group => group.conditions.length > 0)
  
  setFilterGroups(validatedGroups)
}
```

## Dependencies

- React 18+
- Lucide React (for icons)
- date-fns (for date formatting)
- Custom UI components:
  - Button
  - Card, CardContent, CardHeader, CardTitle
  - Select, SelectContent, SelectItem, SelectTrigger, SelectValue
  - Plus, Filter icons from lucide-react

## Related Components

- `FilterConditionComponent` - Handles individual filter condition rendering and logic
- Data table components that consume the filter groups
- UI components from the design system

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly structure
- Focus management for dynamic content

## Browser Support

Compatible with all modern browsers that support:
- ES2020+ features
- React 18+
- CSS Grid and Flexbox