import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchAllReports, GET_ALL_REPORTS_QUERY, apolloClient } from "@/lib/graphql-client"

// Mock Apollo Client
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual('@apollo/client')
  return {
    ...actual,
    ApolloClient: vi.fn(),
    InMemoryCache: vi.fn(),
    createHttpLink: vi.fn(),
    gql: vi.fn((query) => query),
  }
})

// Mock the apolloClient.query method
const mockQuery = vi.fn()
vi.mocked(apolloClient).query = mockQuery

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
    
    mockQuery.mockResolvedValueOnce(mockResponse)

    const result = await fetchAllReports()

    expect(mockQuery).toHaveBeenCalledWith({
      query: GET_ALL_REPORTS_QUERY,
      variables: { first: 10000 },
      fetchPolicy: 'cache-first',
    })

    expect(result).toEqual(mockResponse.data.reports.data)
  })

  it("should handle GraphQL errors", async () => {
    const mockErrorResponse = {
      errors: [{ message: "GraphQL error occurred" }],
      data: null,
    }
    
    mockQuery.mockResolvedValueOnce(mockErrorResponse)

    await expect(fetchAllReports()).rejects.toThrow("GraphQL error occurred")
  })

  it("should handle network errors", async () => {
    const networkError = new Error("Network error")
    
    mockQuery.mockRejectedValueOnce(networkError)

    await expect(fetchAllReports()).rejects.toThrow("Failed to fetch reports: Network error")
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
