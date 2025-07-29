import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchAllReports, GET_ALL_REPORTS_QUERY } from "@/lib/graphql-client"

// Mock fetch
global.fetch = vi.fn()

describe("GraphQL Client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch all reports successfully", async () => {
    const mockResponse = {
      data: {
        reports: {
          data: [
            {
              id: "1",
              title: "Test Report",
              description: "Test Description",
              status: "pending",
              latitude: 40.7128,
              longitude: -74.006,
              client_phone: "+1234567890",
              created_at: "2024-01-15T10:00:00Z",
              neighbourhood: { id: "1", name: "Downtown" },
              team: { id: "1", name: "Test Team" },
            },
          ],
          paginatorInfo: { total: 1 },
        },
      },
    }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await fetchAllReports()

    expect(fetch).toHaveBeenCalledWith("https://unstage.bitech.com.sa/api/v1/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_ALL_REPORTS_QUERY,
        variables: { first: 1000 },
      }),
    })

    expect(result).toEqual(mockResponse.data.reports.data)
  })

  it("should handle GraphQL errors", async () => {
    const mockErrorResponse = {
      errors: [{ message: "GraphQL error occurred" }],
    }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    })

    await expect(fetchAllReports()).rejects.toThrow("GraphQL error occurred")
  })

  it("should handle network errors", async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(fetchAllReports()).rejects.toThrow("Failed to fetch reports")
  })

  it("should use correct query structure", () => {
    expect(GET_ALL_REPORTS_QUERY).toContain("query GetAllReports")
    expect(GET_ALL_REPORTS_QUERY).toContain("$first: Int = 1000")
    expect(GET_ALL_REPORTS_QUERY).toContain("reports(first: $first)")
    expect(GET_ALL_REPORTS_QUERY).not.toContain("$status")
    expect(GET_ALL_REPORTS_QUERY).not.toContain("$team_id")
    expect(GET_ALL_REPORTS_QUERY).not.toContain("$created_after")
  })
})
