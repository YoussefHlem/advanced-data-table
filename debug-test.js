// Debug script to understand the test failure
import { fetchReports } from "./lib/graphql-client.js"

// Mock fetch
global.fetch = function(url, options) {
  console.log("Fetch called with:")
  console.log("URL:", url)
  console.log("Options:", JSON.stringify(options, null, 2))
  
  // Parse the body to see what's actually being sent
  const body = JSON.parse(options.body)
  console.log("Parsed body:")
  console.log("Query type:", typeof body.query)
  console.log("Query contains 'query GetReports':", body.query.includes("query GetReports"))
  console.log("Variables:", body.variables)
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
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
    })
  })
}

const variables = {
  first: 20,
  page: 1,
  status: "active",
  title: "test report",
  created_after: "2024-01-01T00:00:00Z",
  created_before: "2024-12-31T23:59:59Z",
}

fetchReports(variables).then(() => {
  console.log("fetchReports completed successfully")
}).catch(err => {
  console.error("Error:", err)
})