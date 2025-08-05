import type { FilterGroup, SortConfig, MultiSortConfig } from "./types"

export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

// Helper functions for specific condition evaluations
function evaluateTextCondition(value: any, operator: string, filterValue: any): boolean {
  const stringValue = String(value).toLowerCase()
  const stringFilterValue = String(filterValue).toLowerCase()
  
  switch (operator) {
    case "iLike":
      return stringValue.includes(stringFilterValue)
    case "notILike":
      return !stringValue.includes(stringFilterValue)
    default:
      return false
  }
}

function evaluateComparisonCondition(value: any, operator: string, filterValue: any): boolean {
  switch (operator) {
    case "eq":
      return value === filterValue
    case "ne":
      return value !== filterValue
    case "lt":
      return value < filterValue
    case "lte":
      return value <= filterValue
    case "gt":
      return value > filterValue
    case "gte":
      return value >= filterValue
    default:
      return false
  }
}

function evaluateEmptyCondition(value: any, operator: string): boolean {
  const isEmpty = !value || value === "" || value === null || value === undefined
  
  switch (operator) {
    case "isEmpty":
      return isEmpty
    case "isNotEmpty":
      return !isEmpty
    default:
      return false
  }
}

function evaluateArrayCondition(value: any, operator: string, filterValue: any): boolean {
  if (!Array.isArray(filterValue)) return false
  
  switch (operator) {
    case "inArray":
      return filterValue.includes(value)
    case "notInArray":
      return !filterValue.includes(value)
    default:
      return false
  }
}

function evaluateBetweenCondition(value: any, filterValue: any): boolean {
  // Numeric range
  if (filterValue?.min !== undefined && filterValue?.max !== undefined) {
    return filterValue.min <= value && value <= filterValue.max
  }
  
  // Date range
  if (filterValue?.start && filterValue?.end) {
    try {
      const startDate = new Date(filterValue.start).getTime()
      const endDate = new Date(filterValue.end).getTime()
      const valueDate = new Date(value).getTime()
      
      if (isNaN(startDate) || isNaN(endDate) || isNaN(valueDate)) {
        return false
      }
      
      return startDate <= valueDate && valueDate <= endDate
    } catch {
      return false
    }
  }
  
  return false
}

export function evaluateCondition(value: any, operator: string, filterValue: any): boolean {
  // Handle text-based operators
  if (["iLike", "notILike"].includes(operator)) {
    return evaluateTextCondition(value, operator, filterValue)
  }
  
  // Handle comparison operators
  if (["eq", "ne", "lt", "lte", "gt", "gte"].includes(operator)) {
    return evaluateComparisonCondition(value, operator, filterValue)
  }
  
  // Handle empty/not empty operators
  if (["isEmpty", "isNotEmpty"].includes(operator)) {
    return evaluateEmptyCondition(value, operator)
  }
  
  // Handle array operators
  if (["inArray", "notInArray"].includes(operator)) {
    return evaluateArrayCondition(value, operator, filterValue)
  }
  
  // Handle between operator
  if (operator === "isBetween") {
    return evaluateBetweenCondition(value, filterValue)
  }
  
  // Handle unsupported operators
  if (operator === "isRelativeToToday") {
    console.warn(`Operator "${operator}" is not supported in client-side filtering`)
    return true
  }
  
  // Handle unknown operators
  console.warn(`Unknown operator: ${operator}`)
  return true
}

export function applyFilters(data: any[], filterGroups: FilterGroup[]): any[] {
  if (filterGroups.length === 0) return data

  return data.filter((item) => {
    return filterGroups.some((group) => {
      if (group.conditions.length === 0) return true

      const conditionResults = group.conditions.map((condition) => {
        const value = getNestedValue(item, condition.field)
        return evaluateCondition(value, condition.operator, condition.value)
      })

      return group.joinOperator === "and" ? conditionResults.every(Boolean) : conditionResults.some(Boolean)
    })
  })
}

export function applySearch<T>(data: T[], searchTerm: string, searchFields: string[]): T[] {
  if (!searchTerm?.trim() || searchFields.length === 0) return data

  const lowerSearchTerm = searchTerm.toLowerCase().trim()

  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = getNestedValue(item, field)
      if (value === null || value === undefined) return false
      
      return String(value)
        .toLowerCase()
        .includes(lowerSearchTerm)
    })
  })
}


export function applySorting(data: any[], sortConfig: SortConfig): any[] {
  if (!sortConfig.field) return data

  return [...data].sort((a, b) => {
    const aValue = getNestedValue(a, sortConfig.field)
    const bValue = getNestedValue(b, sortConfig.field)

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Handle different data types
    let comparison = 0

    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      // Fallback to string comparison
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return sortConfig.order === "desc" ? -comparison : comparison
  })
}

function compareValues(aValue: any, bValue: any): number {
  if (aValue === null || aValue === undefined) return 1
  if (bValue === null || bValue === undefined) return -1

  // Handle different data types
  if (typeof aValue === "string" && typeof bValue === "string") {
    return aValue.localeCompare(bValue)
  } else if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue
  } else if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime()
  } else {
    // Fallback to string comparison
    return String(aValue).localeCompare(String(bValue))
  }
}

export function applyMultiSorting(data: any[], multiSortConfig: MultiSortConfig): any[] {
  if (!multiSortConfig.columns || multiSortConfig.columns.length === 0) return data

  // Sort columns by priority (lower priority number = higher precedence)
  const sortedColumns = [...multiSortConfig.columns].sort((a, b) => a.priority - b.priority)

  return [...data].sort((a, b) => {
    // Compare each sort column in priority order
    for (const sortColumn of sortedColumns) {
      const aValue = getNestedValue(a, sortColumn.field)
      const bValue = getNestedValue(b, sortColumn.field)

      const comparison = compareValues(aValue, bValue)
      
      if (comparison !== 0) {
        return sortColumn.order === "desc" ? -comparison : comparison
      }
      // If values are equal, continue to next sort column
    }
    
    // All sort columns have equal values
    return 0
  })
}

export function applyPagination<T>(
  data: T[],
  page: number,
  pageSize: number,
): {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    startIndex: number
    endIndex: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
} {
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      startIndex: startIndex + 1,
      endIndex,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}
