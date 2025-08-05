import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  evaluateCondition,
  applyFilters,
  applySearch,
  applySorting,
  applyMultiSorting,
  applyPagination,
  getNestedValue,
} from "@/lib/client-filters"
import type { FilterGroup, MultiSortConfig } from "@/lib/types"

// Mock console.warn to test unsupported operators
const mockConsoleWarn = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  global.console.warn = mockConsoleWarn
})

describe("Client-Side Filtering", () => {
  const sampleData = [
    {
      id: "1",
      title: "Fix water leak",
      description: "Emergency water leak in kitchen",
      status: "pending",
      client_phone: "+1234567890",
      created_at: "2024-01-15T10:00:00Z",
      neighbourhood: { id: "1", name: "Downtown" },
      team: { id: "1", name: "Plumbing Team" },
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: "2",
      title: "Electrical repair",
      description: "Power outage in office building",
      status: "in_progress",
      client_phone: "+1234567891",
      created_at: "2024-01-20T14:30:00Z",
      neighbourhood: { id: "2", name: "Midtown" },
      team: { id: "2", name: "Electrical Team" },
      latitude: 40.7589,
      longitude: -73.9851,
    },
    {
      id: "3",
      title: "HVAC maintenance",
      description: "Regular maintenance check",
      status: "completed",
      client_phone: "+1234567892",
      created_at: "2024-01-25T09:15:00Z",
      neighbourhood: { id: "1", name: "Downtown" },
      team: { id: "3", name: "HVAC Team" },
      latitude: 40.7505,
      longitude: -73.9934,
    },
  ]

  describe("evaluateCondition", () => {
    it("should handle all text operators correctly", () => {
      expect(evaluateCondition("hello", "eq", "hello")).toBe(true)
      expect(evaluateCondition("hello", "ne", "world")).toBe(true)
      expect(evaluateCondition("Hello World", "iLike", "hello")).toBe(true)
      expect(evaluateCondition("Hello World", "notILike", "xyz")).toBe(true)
      expect(evaluateCondition("", "isEmpty", null)).toBe(true)
      expect(evaluateCondition("hello", "isNotEmpty", null)).toBe(true)
    })

    it("should handle numeric operators correctly", () => {
      expect(evaluateCondition(10, "lt", 20)).toBe(true)
      expect(evaluateCondition(20, "gt", 10)).toBe(true)
      expect(evaluateCondition(15, "isBetween", { min: 10, max: 20 })).toBe(true)
    })

    it("should handle array operators correctly", () => {
      expect(evaluateCondition("apple", "inArray", ["apple", "banana"])).toBe(true)
      expect(evaluateCondition("grape", "notInArray", ["apple", "banana"])).toBe(true)
    })

    it("should warn about unsupported operators", () => {
      evaluateCondition("2024-01-15", "isRelativeToToday", "today")
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Operator "isRelativeToToday" is not supported in client-side filtering',
      )
    })
  })

  describe("applyFilters", () => {
    it("should filter data based on single condition", () => {
      const filterGroups: FilterGroup[] = [
        {
          id: "group1",
          joinOperator: "and",
          conditions: [{ id: "cond1", field: "status", operator: "eq", value: "pending", variant: "select" }],
        },
      ]

      const result = applyFilters(sampleData, filterGroups)
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe("pending")
    })

    it("should handle multiple conditions with AND operator", () => {
      const filterGroups: FilterGroup[] = [
        {
          id: "group1",
          joinOperator: "and",
          conditions: [
            { id: "cond1", field: "neighbourhood.name", operator: "eq", value: "Downtown", variant: "text" },
            { id: "cond2", field: "status", operator: "ne", value: "completed", variant: "select" },
          ],
        },
      ]

      const result = applyFilters(sampleData, filterGroups)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("1")
    })

    it("should handle multiple conditions with OR operator", () => {
      const filterGroups: FilterGroup[] = [
        {
          id: "group1",
          joinOperator: "or",
          conditions: [
            { id: "cond1", field: "status", operator: "eq", value: "pending", variant: "select" },
            { id: "cond2", field: "status", operator: "eq", value: "completed", variant: "select" },
          ],
        },
      ]

      const result = applyFilters(sampleData, filterGroups)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.status).sort()).toEqual(["completed", "pending"])
    })

    it("should return all data when no filter groups provided", () => {
      const result = applyFilters(sampleData, [])
      expect(result).toEqual(sampleData)
    })
  })

  describe("applySearch", () => {
    const searchFields = ["title", "description", "neighbourhood.name"]

    it("should search across multiple fields", () => {
      const result = applySearch(sampleData, "water", searchFields)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe("Fix water leak")
    })

    it("should be case insensitive", () => {
      const result = applySearch(sampleData, "ELECTRICAL", searchFields)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe("Electrical repair")
    })

    it("should search in nested fields", () => {
      const result = applySearch(sampleData, "downtown", searchFields)
      expect(result).toHaveLength(2)
    })

    it("should return all data when search term is empty", () => {
      const result = applySearch(sampleData, "", searchFields)
      expect(result).toEqual(sampleData)
    })

    it("should return empty array when no matches found", () => {
      const result = applySearch(sampleData, "nonexistent", searchFields)
      expect(result).toHaveLength(0)
    })
  })


  describe("applySorting", () => {
    it("should sort by string field ascending", () => {
      const result = applySorting(sampleData, { field: "title", order: "asc" })
      expect(result[0].title).toBe("Electrical repair")
      expect(result[2].title).toBe("HVAC maintenance")
    })

    it("should sort by string field descending", () => {
      const result = applySorting(sampleData, { field: "title", order: "desc" })
      expect(result[0].title).toBe("HVAC maintenance")
      expect(result[2].title).toBe("Electrical repair")
    })

    it("should sort by date field", () => {
      const result = applySorting(sampleData, { field: "created_at", order: "asc" })
      expect(result[0].id).toBe("1") // 2024-01-15
      expect(result[2].id).toBe("3") // 2024-01-25
    })

    it("should sort by numeric field", () => {
      const result = applySorting(sampleData, { field: "latitude", order: "desc" })
      expect(result[0].latitude).toBe(40.7589)
      expect(result[2].latitude).toBe(40.7128)
    })

    it("should handle nested field sorting", () => {
      const result = applySorting(sampleData, { field: "neighbourhood.name", order: "asc" })
      expect(result[0].neighbourhood.name).toBe("Downtown")
      expect(result[2].neighbourhood.name).toBe("Midtown")
    })

    it("should handle null values by placing them at the end", () => {
      const dataWithNulls = [...sampleData, { ...sampleData[0], neighbourhood: null }]
      const result = applySorting(dataWithNulls, { field: "neighbourhood.name", order: "asc" })
      expect(result[result.length - 1].neighbourhood).toBeNull()
    })

    it("should return original data when no sort field provided", () => {
      const result = applySorting(sampleData, { field: "", order: "asc" })
      expect(result).toEqual(sampleData)
    })
  })

  describe("applyMultiSorting", () => {
    it("should sort by multiple columns with priority", () => {
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "status", order: "asc", priority: 1 },
          { field: "title", order: "desc", priority: 2 }
        ]
      }
      const result = applyMultiSorting(sampleData, multiSortConfig)
      
      // First should be "completed" status (alphabetically first), then "in_progress", then "pending"
      expect(result[0].status).toBe("completed")
      expect(result[1].status).toBe("in_progress")
      expect(result[2].status).toBe("pending")
    })

    it("should handle single column multi-sort", () => {
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "title", order: "asc", priority: 1 }
        ]
      }
      const result = applyMultiSorting(sampleData, multiSortConfig)
      expect(result[0].title).toBe("Electrical repair")
      expect(result[2].title).toBe("HVAC maintenance")
    })

    it("should sort by three columns with different priorities", () => {
      const extendedData = [
        ...sampleData,
        {
          id: "4",
          title: "Fix water leak",
          status: "pending",
          created_at: "2024-01-10T08:00:00Z",
          latitude: 40.7000,
          longitude: -74.0000,
          neighbourhood: { name: "Downtown" },
          team: { name: "Plumbing Team" }
        }
      ]

      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "status", order: "asc", priority: 1 },
          { field: "title", order: "asc", priority: 2 },
          { field: "created_at", order: "desc", priority: 3 }
        ]
      }
      
      const result = applyMultiSorting(extendedData, multiSortConfig)
      
      // Should be sorted by status first (completed, in_progress, pending), then title, then created_at desc
      expect(result[0].status).toBe("completed")
      expect(result[1].status).toBe("in_progress")
      expect(result[2].status).toBe("pending")
      expect(result[2].title).toBe("Fix water leak")
      // Between the two "Fix water leak" entries, newer one should come first (desc order)
      expect(result[2].created_at).toBe("2024-01-15T10:00:00Z")
      expect(result[3].created_at).toBe("2024-01-10T08:00:00Z")
    })

    it("should handle nested field sorting in multi-column", () => {
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "neighbourhood.name", order: "asc", priority: 1 },
          { field: "team.name", order: "desc", priority: 2 }
        ]
      }
      const result = applyMultiSorting(sampleData, multiSortConfig)
      
      expect(result[0].neighbourhood.name).toBe("Downtown")
      expect(result[2].neighbourhood.name).toBe("Midtown")
    })

    it("should handle null values in multi-column sorting", () => {
      const dataWithNulls = [
        ...sampleData,
        { 
          ...sampleData[0], 
          id: "4",
          neighbourhood: null,
          status: "pending"
        }
      ]
      
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "status", order: "asc", priority: 1 },
          { field: "neighbourhood.name", order: "asc", priority: 2 }
        ]
      }
      
      const result = applyMultiSorting(dataWithNulls, multiSortConfig)
      
      // Null values should be placed at the end within their status group
      const pendingItems = result.filter(item => item.status === "pending")
      const lastPendingItem = pendingItems[pendingItems.length - 1]
      expect(lastPendingItem.neighbourhood).toBeNull()
    })

    it("should handle different data types in multi-column sorting", () => {
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "latitude", order: "desc", priority: 1 },
          { field: "created_at", order: "asc", priority: 2 }
        ]
      }
      
      const result = applyMultiSorting(sampleData, multiSortConfig)
      
      // Should be sorted by latitude desc first
      expect(result[0].latitude).toBe(40.7589)
      expect(result[2].latitude).toBe(40.7128)
    })

    it("should return original data when no columns provided", () => {
      const multiSortConfig: MultiSortConfig = { columns: [] }
      const result = applyMultiSorting(sampleData, multiSortConfig)
      expect(result).toEqual(sampleData)
    })

    it("should handle priority ordering correctly", () => {
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "title", order: "asc", priority: 2 },
          { field: "status", order: "desc", priority: 1 }
        ]
      }
      
      const result = applyMultiSorting(sampleData, multiSortConfig)
      
      // Priority 1 (status desc) should take precedence over priority 2 (title asc)
      // Status desc order: "pending", "in_progress", "completed"
      expect(result[0].status).toBe("pending")
      expect(result[2].status).toBe("completed")
    })

    it("should handle equal values across all sort columns", () => {
      const identicalData = [
        { id: "1", title: "Same", status: "same", created_at: "2024-01-15T10:00:00Z" },
        { id: "2", title: "Same", status: "same", created_at: "2024-01-15T10:00:00Z" },
        { id: "3", title: "Same", status: "same", created_at: "2024-01-15T10:00:00Z" }
      ]
      
      const multiSortConfig: MultiSortConfig = {
        columns: [
          { field: "status", order: "asc", priority: 1 },
          { field: "title", order: "asc", priority: 2 }
        ]
      }
      
      const result = applyMultiSorting(identicalData, multiSortConfig)
      
      // Should maintain original order when all values are equal
      expect(result).toEqual(identicalData)
    })
  })

  describe("applyPagination", () => {
    it("should paginate data correctly", () => {
      const result = applyPagination(sampleData, 1, 2)
      expect(result.data).toHaveLength(2)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.totalPages).toBe(2)
      expect(result.pagination.totalItems).toBe(3)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it("should handle last page correctly", () => {
      const result = applyPagination(sampleData, 2, 2)
      expect(result.data).toHaveLength(1)
      expect(result.pagination.currentPage).toBe(2)
      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPrevPage).toBe(true)
    })

    it("should handle page size larger than data", () => {
      const result = applyPagination(sampleData, 1, 10)
      expect(result.data).toHaveLength(3)
      expect(result.pagination.totalPages).toBe(1)
      expect(result.pagination.hasNextPage).toBe(false)
    })

    it("should calculate indices correctly", () => {
      const result = applyPagination(sampleData, 2, 2)
      expect(result.pagination.startIndex).toBe(3)
      expect(result.pagination.endIndex).toBe(3)
    })
  })

  describe("getNestedValue", () => {
    it("should access nested properties", () => {
      const obj = { a: { b: { c: "value" } } }
      expect(getNestedValue(obj, "a.b.c")).toBe("value")
    })

    it("should return undefined for non-existent paths", () => {
      const obj = { a: { b: { c: "value" } } }
      expect(getNestedValue(obj, "a.b.d")).toBeUndefined()
    })

    it("should handle null intermediate values", () => {
      const obj = { a: { b: null } }
      expect(getNestedValue(obj, "a.b.c")).toBeUndefined()
    })
  })
})

describe("Integration Tests", () => {
  const sampleData = [
    {
      id: "1",
      title: "Fix water leak",
      status: "pending",
      created_at: "2024-01-15T10:00:00Z",
      neighbourhood: { name: "Downtown" },
      team: { name: "Plumbing Team" },
    },
    {
      id: "2",
      title: "Electrical repair",
      status: "in_progress",
      created_at: "2024-01-20T14:30:00Z",
      neighbourhood: { name: "Midtown" },
      team: { name: "Electrical Team" },
    },
    {
      id: "3",
      title: "HVAC maintenance",
      status: "completed",
      created_at: "2024-01-25T09:15:00Z",
      neighbourhood: { name: "Downtown" },
      team: { name: "HVAC Team" },
    },
  ]

  it("should apply all filters in correct order", () => {
    // Search -> Advanced Filters -> Sort -> Paginate
    let result = sampleData

    // Apply search
    result = applySearch(result, "repair", ["title", "description"])
    expect(result).toHaveLength(1)

    // Apply advanced filters
    const filterGroups: FilterGroup[] = [
      {
        id: "group1",
        joinOperator: "and",
        conditions: [{ id: "cond1", field: "neighbourhood.name", operator: "eq", value: "Midtown", variant: "text" }],
      },
    ]
    result = applyFilters(result, filterGroups)
    expect(result).toHaveLength(1)

    // Apply sorting
    result = applySorting(result, { field: "created_at", order: "desc" })
    expect(result[0].id).toBe("2")

    // Apply pagination
    const paginatedResult = applyPagination(result, 1, 10)
    expect(paginatedResult.data).toHaveLength(1)
    expect(paginatedResult.pagination.totalItems).toBe(1)
  })
})
