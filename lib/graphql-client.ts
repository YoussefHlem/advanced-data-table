import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

export const GRAPHQL_ENDPOINT = "https://unstage.bitech.com.sa/api/v1/graphql"

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

// Simplified query - fetch all data without any filtering parameters
export const GET_ALL_REPORTS_QUERY = `
  query GetAllReports($first: Int = 1000) {
    reports(first: $first) {
      data {
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
      paginatorInfo {
        total
      }
    }
  }
`

export interface Report {
  id: string
  title: string
  description: string
  status: string
  latitude: number
  longitude: number
  client_phone: string
  created_at: string
  neighbourhood: {
    id: string
    name: string
  }
  team: {
    id: string
    name: string
  }
}

export async function fetchAllReports(): Promise<Report[]> {
  try {
    const result = await apolloClient.query({
      query: gql(GET_ALL_REPORTS_QUERY),
      variables: {
        first: 10000, // Maximum value of rows
      },
      fetchPolicy: 'cache-first',
    })

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error")
    }

    return result.data.reports.data
  } catch (error) {
    throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const GET_REPORTS_QUERY = `
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

export async function fetchReports(variables: FetchReportsVariables = {}) {
  try {
    const result = await apolloClient.query({
      query: gql(GET_REPORTS_QUERY),
      variables: variables,
      fetchPolicy: 'cache-first',
    })

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error")
    }

    return result.data.reports
  } catch (error) {
    throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// React Query hooks
export function useAllReports(): UseQueryResult<Report[], Error> {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: fetchAllReports,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useReports(variables: FetchReportsVariables = {}): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['reports', 'filtered', variables],
    queryFn: () => fetchReports(variables),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Object.keys(variables).length > 0, // Only run if variables are provided
  })
}
