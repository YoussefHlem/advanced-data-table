import { describe, it, expect, vi } from "vitest"
import { fetchReports } from "@/lib/graphql-client"

// Mock fetch for integration tests
global.fetch = vi.fn()

describe("GraphQL Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should build correct GraphQL variables from filters", async () => {
    const mockResponse = {
      data: {
        reports: {
          data: [],
          paginatorInfo: {
            count: 0,
            currentPage: 1,
            firstItem: 0,
            hasMorePages: false,
            lastItem: 0,
            lastPage: 1,
            perPage: 20,
            total: 0,
          },
        },
      },
    }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const variables = {
      first: 20,
      page: 1,
      status: "active",
      title: "test report",
      created_after: "2024-01-01T00:00:00Z",
      created_before: "2024-12-31T23:59:59Z",
    }

    await fetchReports(variables)

    expect(fetch).toHaveBeenCalledWith("https://unstage.bitech.com.sa/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.stringContaining("query GetReports"),
    })
    
    // Also verify that the variables are included in the request
    const fetchCall = (fetch as any).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1].body)
    expect(requestBody.variables).toEqual(variables)
  })

  it("should handle GraphQL errors", async () => {
    const mockErrorResponse = {
      errors: [{ message: "GraphQL error occurred" }],
    }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    })

    await expect(fetchReports()).rejects.toThrow("GraphQL error occurred")
  })

  it("should handle network errors", async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(fetchReports()).rejects.toThrow("Failed to fetch reports")
  })
})
