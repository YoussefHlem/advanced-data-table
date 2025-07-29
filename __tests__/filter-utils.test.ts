import { describe, it, expect, vi, beforeEach } from "vitest"
import type { FilterGroup } from "@/lib/types"

// Mock console.warn to test unsupported operators
const mockConsoleWarn = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  global.console.warn = mockConsoleWarn
})

// Helper function to evaluate a single condition (extracted from data-table.tsx)
function evaluateCondition(value: any, operator: string, filterValue: any): boolean {
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
      return !(!value || value === "" || value === null || value === undefined)
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

// Helper function to evaluate filter groups
function evaluateFilterGroups(data: any[], filterGroups: FilterGroup[]): any[] {
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

function getNestedValue(obj: any, path: string) {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

describe("Filter Evaluation", () => {
  describe("Text Operators", () => {
    it('should handle "eq" operator correctly', () => {
      expect(evaluateCondition("hello", "eq", "hello")).toBe(true)
      expect(evaluateCondition("hello", "eq", "world")).toBe(false)
      expect(evaluateCondition("", "eq", "")).toBe(true)
    })

    it('should handle "ne" operator correctly', () => {
      expect(evaluateCondition("hello", "ne", "world")).toBe(true)
      expect(evaluateCondition("hello", "ne", "hello")).toBe(false)
    })

    it('should handle "iLike" operator correctly (case insensitive contains)', () => {
      expect(evaluateCondition("Hello World", "iLike", "hello")).toBe(true)
      expect(evaluateCondition("Hello World", "iLike", "WORLD")).toBe(true)
      expect(evaluateCondition("Hello World", "iLike", "xyz")).toBe(false)
      expect(evaluateCondition("", "iLike", "test")).toBe(false)
    })

    it('should handle "notILike" operator correctly', () => {
      expect(evaluateCondition("Hello World", "notILike", "xyz")).toBe(true)
      expect(evaluateCondition("Hello World", "notILike", "hello")).toBe(false)
      expect(evaluateCondition("Hello World", "notILike", "WORLD")).toBe(false)
    })

    it('should handle "isEmpty" operator correctly', () => {
      expect(evaluateCondition("", "isEmpty", null)).toBe(true)
      expect(evaluateCondition(null, "isEmpty", null)).toBe(true)
      expect(evaluateCondition(undefined, "isEmpty", null)).toBe(true)
      expect(evaluateCondition("hello", "isEmpty", null)).toBe(false)
      expect(evaluateCondition(0, "isEmpty", null)).toBe(true) // 0 is falsy
    })

    it('should handle "isNotEmpty" operator correctly', () => {
      expect(evaluateCondition("hello", "isNotEmpty", null)).toBe(true)
      expect(evaluateCondition("", "isNotEmpty", null)).toBe(false)
      expect(evaluateCondition(null, "isNotEmpty", null)).toBe(false)
      expect(evaluateCondition(undefined, "isNotEmpty", null)).toBe(false)
    })
  })

  describe("Numeric Operators", () => {
    it("should handle numeric comparison operators", () => {
      expect(evaluateCondition(10, "lt", 20)).toBe(true)
      expect(evaluateCondition(20, "lt", 10)).toBe(false)

      expect(evaluateCondition(10, "lte", 10)).toBe(true)
      expect(evaluateCondition(10, "lte", 20)).toBe(true)
      expect(evaluateCondition(20, "lte", 10)).toBe(false)

      expect(evaluateCondition(20, "gt", 10)).toBe(true)
      expect(evaluateCondition(10, "gt", 20)).toBe(false)

      expect(evaluateCondition(10, "gte", 10)).toBe(true)
      expect(evaluateCondition(20, "gte", 10)).toBe(true)
      expect(evaluateCondition(10, "gte", 20)).toBe(false)
    })

    it('should handle "isBetween" operator for numbers', () => {
      expect(evaluateCondition(15, "isBetween", { min: 10, max: 20 })).toBe(true)
      expect(evaluateCondition(10, "isBetween", { min: 10, max: 20 })).toBe(true)
      expect(evaluateCondition(20, "isBetween", { min: 10, max: 20 })).toBe(true)
      expect(evaluateCondition(5, "isBetween", { min: 10, max: 20 })).toBe(false)
      expect(evaluateCondition(25, "isBetween", { min: 10, max: 20 })).toBe(false)
    })

    it('should handle invalid "isBetween" values', () => {
      expect(evaluateCondition(15, "isBetween", {})).toBe(false)
      expect(evaluateCondition(15, "isBetween", { min: 10 })).toBe(false)
      expect(evaluateCondition(15, "isBetween", { max: 20 })).toBe(false)
    })
  })

  describe("Date Operators", () => {
    const date1 = "2024-01-15T10:00:00Z"
    const date2 = "2024-01-20T10:00:00Z"
    const date3 = "2024-01-25T10:00:00Z"

    it("should handle date comparison operators", () => {
      expect(evaluateCondition(date1, "lt", date2)).toBe(true)
      expect(evaluateCondition(date2, "lt", date1)).toBe(false)

      expect(evaluateCondition(date1, "gt", date2)).toBe(false)
      expect(evaluateCondition(date2, "gt", date1)).toBe(true)
    })

    it('should handle "isBetween" operator for dates', () => {
      expect(evaluateCondition(date2, "isBetween", { start: date1, end: date3 })).toBe(true)
      expect(evaluateCondition(date1, "isBetween", { start: date1, end: date3 })).toBe(true)
      expect(evaluateCondition(date3, "isBetween", { start: date1, end: date3 })).toBe(true)
      expect(evaluateCondition("2023-12-01T10:00:00Z", "isBetween", { start: date1, end: date3 })).toBe(false)
    })

    it("should handle invalid date ranges", () => {
      expect(evaluateCondition(date2, "isBetween", { start: date1 })).toBe(false)
      expect(evaluateCondition(date2, "isBetween", { end: date3 })).toBe(false)
    })
  })

  describe("Array Operators", () => {
    it('should handle "inArray" operator', () => {
      expect(evaluateCondition("apple", "inArray", ["apple", "banana", "orange"])).toBe(true)
      expect(evaluateCondition("grape", "inArray", ["apple", "banana", "orange"])).toBe(false)
      expect(evaluateCondition("apple", "inArray", [])).toBe(false)
    })

    it('should handle "notInArray" operator', () => {
      expect(evaluateCondition("grape", "notInArray", ["apple", "banana", "orange"])).toBe(true)
      expect(evaluateCondition("apple", "notInArray", ["apple", "banana", "orange"])).toBe(false)
    })

    it("should handle invalid array values", () => {
      expect(evaluateCondition("apple", "inArray", "not-an-array")).toBe(false)
      expect(evaluateCondition("apple", "notInArray", "not-an-array")).toBe(false)
    })
  })

  describe("Unsupported Operators", () => {
    it('should warn about unsupported "isRelativeToToday" operator', () => {
      const result = evaluateCondition("2024-01-15", "isRelativeToToday", "today")
      expect(result).toBe(true) // Returns true as fallback
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Operator "isRelativeToToday" is not supported in client-side filtering',
      )
    })

    it("should warn about unknown operators", () => {
      const result = evaluateCondition("test", "unknownOperator", "value")
      expect(result).toBe(true) // Returns true as fallback
      expect(mockConsoleWarn).toHaveBeenCalledWith("Unknown operator: unknownOperator")
    })
  })

  describe("Edge Cases", () => {
    it("should handle null and undefined values", () => {
      expect(evaluateCondition(null, "eq", null)).toBe(true)
      expect(evaluateCondition(undefined, "eq", undefined)).toBe(true)
      expect(evaluateCondition(null, "eq", "test")).toBe(false)
      expect(evaluateCondition("test", "eq", null)).toBe(false)
    })

    it("should handle type coercion in string operations", () => {
      expect(evaluateCondition(123, "iLike", "12")).toBe(true)
      expect(evaluateCondition(true, "iLike", "true")).toBe(true)
      expect(evaluateCondition(false, "iLike", "false")).toBe(true)
    })

    it("should handle boolean values", () => {
      expect(evaluateCondition(true, "eq", true)).toBe(true)
      expect(evaluateCondition(false, "eq", false)).toBe(true)
      expect(evaluateCondition(true, "eq", false)).toBe(false)
      expect(evaluateCondition(false, "ne", true)).toBe(true)
    })
  })
})

describe("Filter Groups", () => {
  const sampleData = [
    { id: 1, name: "John", age: 25, status: "active", team: { name: "Alpha" } },
    { id: 2, name: "Jane", age: 30, status: "inactive", team: { name: "Beta" } },
    { id: 3, name: "Bob", age: 35, status: "active", team: { name: "Alpha" } },
    { id: 4, name: "Alice", age: 28, status: "pending", team: { name: "Gamma" } },
  ]

  it("should handle single condition with AND operator", () => {
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [{ id: "cond1", field: "status", operator: "eq", value: "active", variant: "select" }],
      },
    ]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name)).toEqual(["John", "Bob"])
  })

  it("should handle multiple conditions with AND operator", () => {
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [
          { id: "cond1", field: "status", operator: "eq", value: "active", variant: "select" },
          { id: "cond2", field: "age", operator: "gte", value: 30, variant: "number" },
        ],
      },
    ]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Bob")
  })

  it("should handle multiple conditions with OR operator", () => {
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "or",
        conditions: [
          { id: "cond1", field: "age", operator: "lt", value: 27, variant: "number" },
          { id: "cond2", field: "status", operator: "eq", value: "pending", variant: "select" },
        ],
      },
    ]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name).sort()).toEqual(["Alice", "John"])
  })

  it("should handle multiple filter groups (OR between groups)", () => {
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [
          { id: "cond1", field: "status", operator: "eq", value: "active", variant: "select" },
          { id: "cond2", field: "age", operator: "lt", value: 30, variant: "number" },
        ],
      },
      {
        id: "group2",
        joinOperator: "and",
        conditions: [{ id: "cond3", field: "team.name", operator: "eq", value: "Gamma", variant: "text" }],
      },
    ]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name).sort()).toEqual(["Alice", "John"])
  })

  it("should handle nested object field access", () => {
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [{ id: "cond1", field: "team.name", operator: "eq", value: "Alpha", variant: "text" }],
      },
    ]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name).sort()).toEqual(["Bob", "John"])
  })

  it("should return all data when no filter groups are provided", () => {
    const result = evaluateFilterGroups(sampleData, [])
    expect(result).toHaveLength(4)
    expect(result).toEqual(sampleData)
  })

  it("should return all data when filter groups have no conditions", () => {
    const filterGroups: FilterGroup[] = [{ id: "group1", joinOperator: "and", conditions: [] }]

    const result = evaluateFilterGroups(sampleData, filterGroups)
    expect(result).toHaveLength(4)
    expect(result).toEqual(sampleData)
  })

  it("should handle complex nested field paths", () => {
    const complexData = [
      { user: { profile: { settings: { theme: "dark" } } } },
      { user: { profile: { settings: { theme: "light" } } } },
      { user: { profile: { settings: null } } },
      { user: { profile: null } },
      { user: null },
    ]

    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [
          { id: "cond1", field: "user.profile.settings.theme", operator: "eq", value: "dark", variant: "text" },
        ],
      },
    ]

    const result = evaluateFilterGroups(complexData, filterGroups)
    expect(result).toHaveLength(1)
    expect(result[0].user.profile.settings.theme).toBe("dark")
  })
})

describe("getNestedValue", () => {
  it("should access nested object properties", () => {
    const obj = { a: { b: { c: "value" } } }
    expect(getNestedValue(obj, "a.b.c")).toBe("value")
  })

  it("should return undefined for non-existent paths", () => {
    const obj = { a: { b: { c: "value" } } }
    expect(getNestedValue(obj, "a.b.d")).toBeUndefined()
    expect(getNestedValue(obj, "x.y.z")).toBeUndefined()
  })

  it("should handle null/undefined intermediate values", () => {
    const obj = { a: { b: null } }
    expect(getNestedValue(obj, "a.b.c")).toBeUndefined()
  })

  it("should handle simple property access", () => {
    const obj = { name: "test" }
    expect(getNestedValue(obj, "name")).toBe("test")
  })
})
