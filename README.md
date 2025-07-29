# Data Table Components

This directory contains advanced data table components for building sophisticated data filtering and display interfaces.

## Components

### AdvancedFilters
A comprehensive filtering system that allows users to create complex filter conditions organized into groups with support for multiple data types and logical operators.

**📖 [View Complete Documentation](components/data-table/ADVANCED_FILTERS_DOCUMENTATION.md)**

**Key Features:**
- Filter groups with AND/OR operators
- Support for text, number, date, boolean, select, and multi-select filters
- Dynamic add/remove functionality
- Collapsible interface with active filter indicators
- TypeScript support with full type safety

**Quick Start:**
```tsx
import { AdvancedFilters } from "@/components/data-table/advanced-filters"

function MyComponent() {
  return (
    <AdvancedFilters
      columns={columnConfig}
      filterGroups={filterGroups}
      onFiltersChange={setFilterGroups}
    />
  )
}
```

### FilterCondition
Individual filter condition component used within AdvancedFilters to handle specific field filtering with appropriate input types based on data variants.

### DataTable
Main data table component that integrates with the filtering system to display and manage tabular data.

## Usage

These components work together to provide a complete data table solution:

1. **AdvancedFilters** - Handles complex filtering logic
2. **FilterCondition** - Manages individual filter inputs
3. **DataTable** - Displays filtered and sorted data

## Documentation

- [AdvancedFilters Complete Documentation](components/data-table/ADVANCED_FILTERS_DOCUMENTATION.md) - Comprehensive guide with examples, API reference, and best practices

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- date-fns (date handling)
- Custom UI components (Button, Card, Select, etc.)

## Support

For questions or issues related to these components, please refer to the detailed documentation or check the implementation examples in the codebase.