import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

// Configuration constants
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://unstage.bitech.com.sa/api/v1/graphql"
export const DEFAULT_FETCH_LIMIT = 10000
const CACHE_STALE_TIME = 5 * 60 * 1000 // 5 minutes
const CACHE_GC_TIME = 10 * 60 * 1000 // 10 minutes

// Create HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

// GraphQL Queries
const REPORT_FRAGMENT = `
  fragment ReportFields on Report {
    id
    title
    description
    status
    latitude
    longitude
    client_phone
    created_at
    neighbourhood {
      id
      name
    }
    team {
      id
      name
    }
  }
`

export const GET_ALL_REPORTS_QUERY = `
  ${REPORT_FRAGMENT}
  query GetAllReports($first: Int = 1000) {
    reports(first: $first) {
      data {
        ...ReportFields
      }
      paginatorInfo {
        total
      }
    }
  }
`

// TypeScript Interfaces
export interface Neighbourhood {
  id: string
  name: string
}

export interface Team {
  id: string
  name: string
}

export interface Report {
  id: string
  title: string
  description: string
  status: string
  latitude: number
  longitude: number
  client_phone: string
  created_at: string
  neighbourhood: Neighbourhood | null
  team: Team | null
}

export interface PaginatorInfo {
  total: number
  count?: number
  currentPage?: number
  firstItem?: number
  hasMorePages?: boolean
  lastItem?: number
  lastPage?: number
  perPage?: number
}

export interface ReportsResponse {
  data: Report[]
  paginatorInfo: PaginatorInfo
}

export async function fetchAllReports(): Promise<Report[]> {
  try {
    const result = await apolloClient.query({
      query: gql(GET_ALL_REPORTS_QUERY),
      variables: {
        first: DEFAULT_FETCH_LIMIT,
      },
      fetchPolicy: 'cache-first',
    })

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || "GraphQL error occurred"
      throw new Error(errorMessage)
    }

    if (!result.data?.reports?.data) {
      throw new Error("Invalid response structure from GraphQL API")
    }

    return result.data.reports.data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to fetch reports: ${errorMessage}`)
  }
}

const GET_REPORTS_QUERY = `
  ${REPORT_FRAGMENT}
  query GetReports(
    $first: Int
    $page: Int
    $status: String
    $title: String
    $created_after: String
    $created_before: String
  ) {
    reports(
      first: $first
      page: $page
      status: $status
      title: $title
      created_after: $created_after
      created_before: $created_before
    ) {
      data {
        ...ReportFields
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`

interface FetchReportsVariables {
  first?: number
  page?: number
  status?: string
  title?: string
  created_after?: string
  created_before?: string
}

export async function fetchReports(variables: FetchReportsVariables = {}): Promise<ReportsResponse> {
  try {
    const result = await apolloClient.query({
      query: gql(GET_REPORTS_QUERY),
      variables,
      fetchPolicy: 'cache-first',
    })

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || "GraphQL error occurred"
      throw new Error(errorMessage)
    }

    if (!result.data?.reports) {
      throw new Error("Invalid response structure from GraphQL API")
    }

    return result.data.reports
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to fetch reports: ${errorMessage}`)
  }
}

// React Query hooks
export function useAllReports(): UseQueryResult<Report[], Error> {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: fetchAllReports,
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
  })
}

export function useReports(variables: FetchReportsVariables = {}): UseQueryResult<ReportsResponse, Error> {
  return useQuery({
    queryKey: ['reports', 'filtered', variables],
    queryFn: () => fetchReports(variables),
    staleTime: CACHE_STALE_TIME,
    gcTime: CACHE_GC_TIME,
    enabled: Object.keys(variables).length > 0, // Only run if variables are provided
  })
}
