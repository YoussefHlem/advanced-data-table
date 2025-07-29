"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { AdvancedFilters } from "./advanced-filters"
import { fetchAllReports, type Report } from "@/lib/graphql-client"
import { applyFilters, applySearch, applyQuickFilters, applySorting, applyPagination } from "@/lib/client-filters"
import type { FilterGroup, SortConfig, ColumnConfig } from "@/lib/types"
import { format } from "date-fns"

const COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", variant: "text", sortable: true, exportable: true },
  { key: "title", label: "Title", variant: "text", sortable: true, exportable: true },
  { key: "description", label: "Description", variant: "text", sortable: true, exportable: true },
  {
    key: "status",
    label: "Status",
    variant: "select",
    sortable: true,
    exportable: true,
    options: [
      { label: "Pending", value: "pending" },
      { label: "In Progress", value: "in_progress" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ],
  },
  { key: "client_phone", label: "Client Phone", variant: "text", sortable: true, exportable: true },
  { key: "created_at", label: "Created At", variant: "date", sortable: true, exportable: true },
  { key: "neighbourhood.name", label: "Neighbourhood", variant: "text", sortable: true, exportable: true },
  { key: "team.name", label: "Team", variant: "text", sortable: true, exportable: true },
  { key: "latitude", label: "Latitude", variant: "number", sortable: true, exportable: true },
  { key: "longitude", label: "Longitude", variant: "number", sortable: true, exportable: true },
]

const SEARCH_FIELDS = ["title", "description", "client_phone", "neighbourhood.name", "team.name"]

export function DataTable() {
  // Data state
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter and search state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [quickFilters, setQuickFilters] = useState({
    status: "",
    "team.name": "",
    "neighbourhood.name": "",
  })

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "created_at", order: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Load all data initially
  const loadAllReports = async () => {
    setLoading(true)
    setError(null)

    try {
      const reports = await fetchAllReports()
      setAllReports(reports)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllReports()
  }, [])

  // Apply all client-side processing
  const processedData = useMemo(() => {
    let filteredData = allReports

    // Apply search
    filteredData = applySearch(filteredData, searchTerm, SEARCH_FIELDS)

    // Apply quick filters
    filteredData = applyQuickFilters(filteredData, quickFilters)

    // Apply advanced filters
    filteredData = applyFilters(filteredData, filterGroups)

    // Apply sorting
    filteredData = applySorting(filteredData, sortConfig)

    // Apply pagination
    return applyPagination(filteredData, currentPage, pageSize)
  }, [allReports, searchTerm, quickFilters, filterGroups, sortConfig, currentPage, pageSize])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, quickFilters, filterGroups])

  function handleSort(field: string) {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }))
  }

  function handleQuickFilterChange(field: string, value: string) {
    setQuickFilters((prev) => ({
      ...prev,
      [field]: value === "all" ? "" : value,
    }))
  }

  function exportToCSV() {
    const exportableColumns = COLUMNS.filter((col) => col.exportable)
    const headers = exportableColumns.map((col) => col.label).join(",")

    // Export all filtered data (not just current page)
    let exportData = allReports
    exportData = applySearch(exportData, searchTerm, SEARCH_FIELDS)
    exportData = applyQuickFilters(exportData, quickFilters)
    exportData = applyFilters(exportData, filterGroups)
    exportData = applySorting(exportData, sortConfig)

    const rows = exportData.map((report) =>
      exportableColumns
        .map((col) => {
          const value = getNestedValue(report, col.key)
          if (col.variant === "date" && value) {
            return format(new Date(value), "yyyy-MM-dd HH:mm:ss")
          }
          return `"${String(value || "").replace(/"/g, '""')}"`
        })
        .join(","),
    )

    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `reports-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  function getNestedValue(obj: any, path: string) {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  function renderSortIcon(field: string) {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.order === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  function formatCellValue(value: any, column: ColumnConfig) {
    if (value === null || value === undefined) return "-"

    switch (column.variant) {
      case "date":
        return format(new Date(value), "MMM dd, yyyy HH:mm")
      case "boolean":
        return value ? "Yes" : "No"
      default:
        return String(value)
    }
  }

  // Get unique values for quick filter options
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(allReports.map((r) => r.status))].filter(Boolean)
    return statuses.map((status) => ({ label: status, value: status }))
  }, [allReports])

  const teamOptions = useMemo(() => {
    const teams = [...new Set(allReports.map((r) => r.team?.name))].filter(Boolean)
    return teams.map((team) => ({ label: team, value: team }))
  }, [allReports])

  const neighbourhoodOptions = useMemo(() => {
    const neighbourhoods = [...new Set(allReports.map((r) => r.neighbourhood?.name))].filter(Boolean)
    return neighbourhoods.map((neighbourhood) => ({ label: neighbourhood, value: neighbourhood }))
  }, [allReports])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reports Data Table</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{processedData.pagination.totalItems} total records</span>
              <Button variant="outline" size="sm" onClick={loadAllReports} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={processedData.data.length === 0}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, phone, neighbourhood, or team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={quickFilters.status || "all"}
              onValueChange={(value) => handleQuickFilterChange("status", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={quickFilters["team.name"] || "all"}
              onValueChange={(value) => handleQuickFilterChange("team.name", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teamOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={quickFilters["neighbourhood.name"] || "all"}
              onValueChange={(value) => handleQuickFilterChange("neighbourhood.name", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by neighbourhood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighbourhoods</SelectItem>
                {neighbourhoodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <AdvancedFilters columns={COLUMNS} filterGroups={filterGroups} onFiltersChange={setFilterGroups} />

          {/* Filter Summary */}
          {(searchTerm || Object.values(quickFilters).some(Boolean) || filterGroups.length > 0) && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Showing {processedData.pagination.totalItems} of {allReports.length} records
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setQuickFilters({ status: "", "team.name": "", "neighbourhood.name": "" })
                  setFilterGroups([])
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {/* Data Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableHead key={column.key}>
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          {column.label}
                          {renderSortIcon(column.key)}
                        </Button>
                      ) : (
                        <span className="font-semibold">{column.label}</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : processedData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                      {allReports.length === 0 ? "No reports available" : "No reports match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  processedData.data.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">{report.id}</TableCell>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === "completed"
                              ? "default"
                              : report.status === "in_progress"
                                ? "secondary"
                                : report.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.client_phone}</TableCell>
                      <TableCell>
                        {formatCellValue(report.created_at, COLUMNS.find((c) => c.key === "created_at")!)}
                      </TableCell>
                      <TableCell>{report.neighbourhood?.name || "-"}</TableCell>
                      <TableCell>{report.team?.name || "-"}</TableCell>
                      <TableCell>{report.latitude}</TableCell>
                      <TableCell>{report.longitude}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {processedData.pagination.totalItems > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {processedData.pagination.startIndex} to {processedData.pagination.endIndex} of{" "}
                  {processedData.pagination.totalItems} results
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={!processedData.pagination.hasPrevPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!processedData.pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm px-4">
                  Page {processedData.pagination.currentPage} of {processedData.pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!processedData.pagination.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(processedData.pagination.totalPages)}
                  disabled={!processedData.pagination.hasNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
