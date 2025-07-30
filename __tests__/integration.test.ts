import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchReports, apolloClient, GET_REPORTS_QUERY } from "@/lib/graphql-client"

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
    
    mockQuery.mockResolvedValueOnce(mockResponse)

    const variables = {
      first: 20,
      page: 1,
      status: "active",
      title: "test report",
      created_after: "2024-01-01T00:00:00Z",
      created_before: "2024-12-31T23:59:59Z",
    }

    await fetchReports(variables)

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.stringContaining("query GetReports"),
      variables: variables,
      fetchPolicy: 'cache-first',
    })
  })

  it("should handle GraphQL errors", async () => {
    const mockErrorResponse = {
      errors: [{ message: "GraphQL error occurred" }],
      data: null,
    }
    
    mockQuery.mockResolvedValueOnce(mockErrorResponse)

    await expect(fetchReports()).rejects.toThrow("GraphQL error occurred")
  })

  it("should handle network errors", async () => {
    const networkError = new Error("Network error")
    
    mockQuery.mockRejectedValueOnce(networkError)

    await expect(fetchReports()).rejects.toThrow("Failed to fetch reports: Network error")
  })
})
