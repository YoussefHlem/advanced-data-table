export const GRAPHQL_ENDPOINT = "https://unstage.bitech.com.sa/api/v1/graphql"

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
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_ALL_REPORTS_QUERY,
      variables: {
        first: 10000, // Maximum value of rows
      },
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch reports")
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }

  return result.data.reports.data
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
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_REPORTS_QUERY,
      variables: variables,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch reports")
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }

  return result.data.reports
}
