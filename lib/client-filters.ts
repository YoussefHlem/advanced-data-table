import type { FilterGroup, SortConfig } from "./types"

export function getNestedValue(obj: any, path: string) {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

export function evaluateCondition(value: any, operator: string, filterValue: any): boolean {
  switch (operator) {
    case "eq":
      return value === filterValue
    case "ne":
      return value !== filterValue
    case "iLike":
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
    case "notILike":
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())
    case "lt":
      return value < filterValue
    case "lte":
      return value <= filterValue
    case "gt":
      return value > filterValue
    case "gte":
      return value >= filterValue
    case "isEmpty":
      return !value || value === "" || value === null || value === undefined
    case "isNotEmpty":
      return value && value !== "" && value !== null && value !== undefined
    case "inArray":
      return Array.isArray(filterValue) && filterValue.includes(value)
    case "notInArray":
      return Array.isArray(filterValue) && !filterValue.includes(value)
    case "isBetween":
      if (filterValue?.min !== undefined && filterValue?.max !== undefined) {
        return filterValue.min <= value && value <= filterValue.max
      }
      if (filterValue?.start && filterValue?.end) {
        const startDate = new Date(filterValue.start).getTime()
        const endDate = new Date(filterValue.end).getTime()
        const valueDate = new Date(value).getTime()
        return startDate <= valueDate && valueDate <= endDate
      }
      return false
    case "isRelativeToToday":
      console.warn(`Operator "${operator}" is not supported in client-side filtering`)
      return true
    default:
      console.warn(`Unknown operator: ${operator}`)
      return true
  }
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

export function applySearch(data: any[], searchTerm: string, searchFields: string[]): any[] {
  if (!searchTerm.trim()) return data

  const lowerSearchTerm = searchTerm.toLowerCase()

  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = getNestedValue(item, field)
      return String(value || "")
        .toLowerCase()
        .includes(lowerSearchTerm)
    })
  })
}

export function applyQuickFilters(data: any[], quickFilters: Record<string, string>): any[] {
  return data.filter((item) => {
    return Object.entries(quickFilters).every(([field, value]) => {
      if (!value || value === "all") return true

      const itemValue = getNestedValue(item, field)
      return itemValue === value
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
