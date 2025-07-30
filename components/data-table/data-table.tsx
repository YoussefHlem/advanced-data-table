"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { applyFilters, applySearch, applyQuickFilters, applySorting, applyPagination } from "@/lib/client-filters"
import type { FilterGroup, SortConfig, ColumnConfig } from "@/lib/types"
import { format } from "date-fns"
import {QueryObserverResult} from "@tanstack/react-query";

export interface QuickFilterConfig {
  field: string
  label: string
  placeholder: string
  options: { label: string; value: string }[]
}

export interface DataTableProps<T = any> {
  data: T[]
  columns: ColumnConfig[]
  searchFields: string[]
  quickFilters?: QuickFilterConfig[]
  title?: string
  loadingMessage?: string
  emptyMessage?: string
  noResultsMessage?: string
  exportFilename?: string
  onRefresh?: () => Promise<QueryObserverResult<T[], Error>>
  loading?: boolean
  error?: string | null
  renderCell?: (value: any, column: ColumnConfig, row: T) => React.ReactNode
  searchPlaceholder?: string
}

export function DataTable<T = any>({
  data,
  columns,
  searchFields,
  quickFilters = [],
  title = "Data Table",
  loadingMessage = "Loading data...",
  emptyMessage = "No data available",
  noResultsMessage = "No data matches your filters",
  exportFilename = "data",
  onRefresh,
  loading = false,
  error = null,
  renderCell,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  // Filter and search state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string>>({})

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "", order: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Initialize quick filter values
  useEffect(() => {
    const initialValues: Record<string, string> = {}
    quickFilters.forEach((filter) => {
      initialValues[filter.field] = ""
    })
    setQuickFilterValues(initialValues)
  }, [quickFilters])

  // Apply all client-side processing
  const processedData = useMemo(() => {
    let filteredData = data

    // Apply search
    filteredData = applySearch(filteredData, searchTerm, searchFields)

    // Apply quick filters
    filteredData = applyQuickFilters(filteredData, quickFilterValues)

    // Apply advanced filters
    filteredData = applyFilters(filteredData, filterGroups)

    // Apply sorting
    filteredData = applySorting(filteredData, sortConfig)

    // Apply pagination
    return applyPagination(filteredData, currentPage, pageSize)
  }, [data, searchTerm, quickFilterValues, filterGroups, sortConfig, currentPage, pageSize])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, quickFilterValues, filterGroups])

  function handleSort(field: string) {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }))
  }

  function handleQuickFilterChange(field: string, value: string) {
    setQuickFilterValues((prev) => ({
      ...prev,
      [field]: value === "all" ? "" : value,
    }))
  }

  function exportToCSV() {
    const exportableColumns = columns.filter((col) => col.exportable)
    const headers = exportableColumns.map((col) => col.label).join(",")

    // Export all filtered data (not just current page)
    let exportData = data
    exportData = applySearch(exportData, searchTerm, searchFields)
    exportData = applyQuickFilters(exportData, quickFilterValues)
    exportData = applyFilters(exportData, filterGroups)
    exportData = applySorting(exportData, sortConfig)

    const rows = exportData.map((item) =>
      exportableColumns
        .map((col) => {
          const value = getNestedValue(item, col.key)
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
    a.download = `${exportFilename}-${format(new Date(), "yyyy-MM-dd")}.csv`
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

  function clearAllFilters() {
    setSearchTerm("")
    const clearedQuickFilters: Record<string, string> = {}
    quickFilters.forEach((filter) => {
      clearedQuickFilters[filter.field] = ""
    })
    setQuickFilterValues(clearedQuickFilters)
    setFilterGroups([])
  }

  const hasActiveFilters = searchTerm || Object.values(quickFilterValues).some(Boolean) || filterGroups.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{processedData.pagination.totalItems} total records</span>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
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
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {quickFilters.map((filter) => (
              <Select
                key={filter.field}
                value={quickFilterValues[filter.field] || "all"}
                onValueChange={(value) => handleQuickFilterChange(filter.field, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          {/* Advanced Filters */}
          <AdvancedFilters columns={columns} filterGroups={filterGroups} onFiltersChange={setFilterGroups} />

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Showing {processedData.pagination.totalItems} of {data.length} records
              </span>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
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
                  {columns.map((column) => (
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
                    <TableCell colSpan={columns.length} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      {loadingMessage}
                    </TableCell>
                  </TableRow>
                ) : processedData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      {data.length === 0 ? emptyMessage : noResultsMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  processedData.data.map((item, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => {
                        const value = getNestedValue(item, column.key)
                        return (
                          <TableCell key={column.key}>
                            {renderCell ? renderCell(value, column, item) : formatCellValue(value, column)}
                          </TableCell>
                        )
                      })}
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