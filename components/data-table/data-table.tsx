"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react"
import { AdvancedFilters } from "./advanced-filters"
import { DataTableHeader } from "./data-table-header"
import { DataTableSearch, type QuickFilterConfig } from "./data-table-search"
import { DataTablePagination } from "./data-table-pagination"
import { applyFilters, applySearch, applyQuickFilters, applySorting, applyPagination } from "@/lib/client-filters"
import { getNestedValue, formatCellValue, exportDataToCSV, DEFAULT_PAGE_SIZE } from "@/lib/data-table-utils"
import type { FilterGroup, SortConfig, ColumnConfig, ActionItem, BulkActionItem } from "@/lib/types"
import { FloatingActionBar } from "./floating-action-bar"
import { ActionsColumn } from "./actions-column"
import { Checkbox } from "@/components/ui/checkbox"


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
  loading?: boolean
  error?: string | null
  renderCell?: (value: any, column: ColumnConfig, row: T) => React.ReactNode
  searchPlaceholder?: string
  actions?: ActionItem[]
  bulkActions?: BulkActionItem[]
  enableSelection?: boolean
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
  loading = false,
  error = null,
  renderCell,
  searchPlaceholder = "Search...",
  actions = [],
  bulkActions = [],
  enableSelection = false,
}: DataTableProps<T>) {
  // Filter and search state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string>>({})

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "", order: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

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

  const handleSort = useCallback((field: string) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }))
  }, [])

  const handleQuickFilterChange = useCallback((field: string, value: string) => {
    setQuickFilterValues((prev) => ({
      ...prev,
      [field]: value === "all" ? "" : value,
    }))
  }, [])

  const handleExportToCSV = useCallback(() => {
    // Export all filtered data (not just current page)
    let exportData = data
    exportData = applySearch(exportData, searchTerm, searchFields)
    exportData = applyQuickFilters(exportData, quickFilterValues)
    exportData = applyFilters(exportData, filterGroups)
    exportData = applySorting(exportData, sortConfig)

    exportDataToCSV(exportData, columns, exportFilename)
  }, [data, searchTerm, searchFields, quickFilterValues, filterGroups, sortConfig, columns, exportFilename])

  const renderSortIcon = useCallback((field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.order === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }, [sortConfig])

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    const clearedQuickFilters: Record<string, string> = {}
    quickFilters.forEach((filter) => {
      clearedQuickFilters[filter.field] = ""
    })
    setQuickFilterValues(clearedQuickFilters)
    setFilterGroups([])
  }, [quickFilters])

  const hasActiveFilters = searchTerm || Object.values(quickFilterValues).some(Boolean) || filterGroups.length > 0

  // Selection helper functions
  const handleRowSelection = useCallback((rowIndex: number) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(rowIndex)) {
        newSelection.delete(rowIndex)
      } else {
        newSelection.add(rowIndex)
      }
      return newSelection
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set())
      setSelectAll(false)
    } else {
      const allRowIndices = new Set(processedData.data.map((_, index) => index))
      setSelectedRows(allRowIndices)
      setSelectAll(true)
    }
  }, [selectAll, processedData.data])

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
    setSelectAll(false)
  }, [])

  // Get selected row data
  const selectedRowData = processedData.data.filter((_, index) => selectedRows.has(index))

  // Update selectAll state based on current selection
  useEffect(() => {
    const totalRows = processedData.data.length
    const selectedCount = selectedRows.size
    setSelectAll(totalRows > 0 && selectedCount === totalRows)
  }, [selectedRows, processedData.data.length])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <DataTableHeader
              title={title}
              totalRecords={processedData.pagination.totalItems}
              loading={loading}
              onExport={handleExportToCSV}
              canExport={processedData.data.length > 0}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Quick Filters */}
          <DataTableSearch
            searchTerm={searchTerm}
            searchPlaceholder={searchPlaceholder}
            quickFilters={quickFilters}
            quickFilterValues={quickFilterValues}
            onSearchChange={setSearchTerm}
            onQuickFilterChange={handleQuickFilterChange}
          />

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
                  {enableSelection && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
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
                  {actions.length > 0 && (
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      {loadingMessage}
                    </TableCell>
                  </TableRow>
                ) : processedData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                      {data.length === 0 ? emptyMessage : noResultsMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  processedData.data.map((item, index) => (
                    <TableRow key={index}>
                      {enableSelection && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(index)}
                            onCheckedChange={() => handleRowSelection(index)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = getNestedValue(item, column.key)
                        return (
                          <TableCell key={column.key}>
                            {renderCell ? renderCell(value, column, item) : formatCellValue(value, column)}
                          </TableCell>
                        )
                      })}
                      {actions.length > 0 && (
                        <TableCell>
                          <ActionsColumn row={item} actions={actions} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <DataTablePagination
            pagination={processedData.pagination}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
      
      {/* Floating Action Bar */}
      {enableSelection && bulkActions.length > 0 && (
        <FloatingActionBar
          selectedCount={selectedRows.size}
          bulkActions={bulkActions}
          selectedRows={selectedRowData}
          onClearSelection={clearSelection}
        />
      )}
    </div>
  )
}