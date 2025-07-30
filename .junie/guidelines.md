# Advanced Data Table - Development Guidelines

## Build & Configuration Instructions

### Prerequisites
- Node.js (version compatible with Next.js 15.4.4)
- npm or pnpm package manager

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Key Configuration Notes
- **Next.js Config**: ESLint and TypeScript errors are ignored during builds (`ignoreDuringBuilds: true`)
- **Images**: Unoptimized images are enabled for development flexibility
- **Path Aliases**: `@/*` maps to project root for clean imports
- **Tailwind**: Uses CSS variables for theming with dark mode support
- **TypeScript**: Strict mode enabled with modern ES6+ target

## Testing Information

### Test Configuration
- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library with jest-dom matchers
- **Setup**: Automatic cleanup after each test via `vitest.setup.ts`

### Running Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Structure Example
```typescript
import { describe, it, expect } from "vitest"

describe("Component/Function Name", () => {
  describe("specific functionality", () => {
    it("should handle expected behavior", () => {
      // Test implementation
      expect(result).toBe(expected)
    })

    it("should handle edge cases", () => {
      // Edge case testing
      expect(edgeCase).toBe(expectedEdgeResult)
    })
  })
})
```

### Adding New Tests
1. Create test files in `__tests__/` directory with `.test.ts` or `.test.tsx` extension
2. Use descriptive `describe` blocks for grouping related tests
3. Write clear test names that describe the expected behavior
4. Test both positive and negative scenarios
5. Mock external dependencies when necessary

## Architecture & Development Patterns

### Component Architecture
- **Generic Components**: Use TypeScript generics for reusable components (e.g., `DataTable<T>`)
- **Props Interface**: Define comprehensive TypeScript interfaces for all component props
- **Custom Hooks**: Separate data fetching logic into custom hooks
- **Client-Side Processing**: Use utility functions for data manipulation (filtering, sorting, pagination)

### Data Fetching Pattern
```typescript
// Combine Apollo Client with TanStack Query
export function useAllReports(): UseQueryResult<Report[], Error> {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: fetchAllReports,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

### GraphQL Integration
- **Apollo Client**: Configured with error policy 'all' for comprehensive error handling
- **Cache Strategy**: Uses 'cache-first' fetch policy for performance
- **Query Structure**: Separate queries for filtered vs. unfiltered data
- **Error Handling**: Proper error propagation with meaningful messages

### Component Organization
```
components/
├── ui/                 # Reusable UI components (shadcn/ui)
├── data-table/         # Data table specific components
│   ├── data-table.tsx  # Main generic table component
│   ├── reports-table.tsx # Domain-specific implementation
│   └── advanced-filters.tsx # Filter components
lib/
├── graphql-client.ts   # GraphQL queries and hooks
├── client-filters.ts   # Data processing utilities
└── types.ts           # TypeScript type definitions
```

### State Management Patterns
- **Local State**: Use `useState` for component-specific state
- **Server State**: TanStack Query for server state management
- **Derived State**: `useMemo` for computed values and data processing
- **Effect Management**: `useEffect` for side effects and cleanup

### Styling Approach
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Theme-based styling with HSL color values
- **Component Variants**: Use `class-variance-authority` for component variations
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Clean Code Principles Applied

### Naming Conventions
- **Components**: PascalCase (e.g., `DataTable`, `ReportsTable`)
- **Functions**: camelCase with descriptive verbs (e.g., `fetchAllReports`, `applyFilters`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `REPORTS_SEARCH_FIELDS`)
- **Interfaces**: PascalCase with descriptive names (e.g., `QuickFilterConfig`)

### Function Design
- **Single Responsibility**: Each function has one clear purpose
- **Pure Functions**: Utility functions are pure and predictable
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Type Safety**: Full TypeScript coverage with strict typing

### Code Organization
- **Separation of Concerns**: UI, data fetching, and business logic are separated
- **Reusability**: Generic components that can be reused across different domains
- **Modularity**: Small, focused modules with clear interfaces
- **Documentation**: Self-documenting code with minimal but meaningful comments

### Testing Best Practices
- **Comprehensive Coverage**: Test both happy paths and edge cases
- **Clear Test Names**: Descriptive test names that explain expected behavior
- **Isolated Tests**: Each test is independent and doesn't rely on others
- **Mock Strategy**: Mock external dependencies appropriately

## Development Workflow

### Adding New Features
1. Create TypeScript interfaces for new data types
2. Implement data fetching hooks following the established pattern
3. Build reusable components with proper TypeScript generics
4. Add comprehensive tests covering all scenarios
5. Update documentation as needed

### Code Quality Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling implemented
- [ ] Tests written and passing
- [ ] Components are reusable and generic where appropriate
- [ ] Proper separation of concerns maintained
- [ ] Performance optimizations applied (memoization, proper dependencies)

### Performance Considerations
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Query Optimization**: Implement proper caching strategies with TanStack Query
- **Bundle Size**: Import only necessary components from libraries
- **Client-Side Processing**: Efficient algorithms for filtering and sorting large datasets

---

*Last updated: July 30, 2025*