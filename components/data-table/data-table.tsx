"use client"

import React, { useState, useEffect, useMemo, useCallback, useTransition } from "react"
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
import { DataTableSearch } from "./data-table-search"
import { DataTablePagination } from "./data-table-pagination"
import { ColumnVisibilityToggle } from "./column-visibility-toggle"
import { applyFilters, applySearch, applySorting, applyPagination } from "@/lib/client-filters"
import { getNestedValue, formatCellValue, exportDataToCSV, DEFAULT_PAGE_SIZE } from "@/lib/data-table-utils"
import type { FilterGroup, SortConfig, ColumnConfig, ActionItem, BulkActionItem } from "@/lib/types"
import { FloatingActionBar } from "./floating-action-bar"
import { ActionsColumn } from "./actions-column"
import { Checkbox } from "@/components/ui/checkbox"
import { useDebounce } from "@/lib/use-debounce"


export interface DataTableProps<T = any> {
  data: T[]
  columns: ColumnConfig[]
  searchFields: string[]
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
  onCreateNew?: () => void
  createButtonLabel?: string
}

export function DataTable<T = any>({
  data,
  columns,
  searchFields,
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
  onCreateNew,
  createButtonLabel = "Create New",
}: DataTableProps<T>) {
  // Filter and search state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    // Initialize all columns as visible by default
    return columns.reduce((acc, column) => {
      acc[column.key] = column.visible !== false
      return acc
    }, {} as Record<string, boolean>)
  })

  // Debounced values for performance optimization
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms delay for search
  const debouncedFilterGroups = useDebounce(filterGroups, 500) // 500ms delay for advanced filters

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "", order: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Transition state for non-urgent updates
  const [isPending, startTransition] = useTransition()

  // Compute visible columns
  const visibleColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      visible: columnVisibility[column.key] !== false
    })).filter(column => column.visible)
  }, [columns, columnVisibility])


  // Apply all client-side processing
  const processedData = useMemo(() => {
    let filteredData = data

    // Apply search (using debounced value)
    filteredData = applySearch(filteredData, debouncedSearchTerm, searchFields)

    // Apply advanced filters (using debounced value)
    filteredData = applyFilters(filteredData, debouncedFilterGroups)

    // Apply sorting
    filteredData = applySorting(filteredData, sortConfig)

    // Apply pagination
    return applyPagination(filteredData, currentPage, pageSize)
  }, [data, debouncedSearchTerm, debouncedFilterGroups, sortConfig, currentPage, pageSize, searchFields])

  // Reset to first page when filters change (using debounced values)
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, debouncedFilterGroups])

  const handleSort = useCallback((field: string) => {
    startTransition(() => {
      setSortConfig((prev) => ({
        field,
        order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
      }))
    })
  }, [startTransition])


  const handleExportToCSV = useCallback(() => {
    // Export all filtered data (not just current page) using debounced values
    let exportData = data
    exportData = applySearch(exportData, debouncedSearchTerm, searchFields)
    exportData = applyFilters(exportData, debouncedFilterGroups)
    exportData = applySorting(exportData, sortConfig)
    exportDataToCSV(exportData, columns, exportFilename)
  }, [data, debouncedSearchTerm, searchFields, debouncedFilterGroups, sortConfig, columns, exportFilename])

  const renderSortIcon = useCallback((field: string) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.order === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }, [sortConfig])

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      setSearchTerm("")
      setFilterGroups([])
    })
  }, [startTransition])

  // Wrapped state setters for non-urgent updates
  const handleSearchChange = useCallback((value: string) => {
    startTransition(() => {
      setSearchTerm(value)
    })
  }, [startTransition])

  const handleFiltersChange = useCallback((filters: FilterGroup[]) => {
    startTransition(() => {
      setFilterGroups(filters)
    })
  }, [startTransition])

  const hasActiveFilters = debouncedSearchTerm || debouncedFilterGroups.length > 0

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

  // Column visibility handlers
  const handleColumnVisibilityChange = useCallback((columnKey: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: visible
    }))
  }, [])

  const handleShowAllColumns = useCallback(() => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev }
      columns.forEach(column => {
        newVisibility[column.key] = true
      })
      return newVisibility
    })
  }, [columns])

  const handleHideAllColumns = useCallback(() => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev }
      columns.forEach(column => {
        newVisibility[column.key] = false
      })
      return newVisibility
    })
  }, [columns])

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
              onExport={handleExportToCSV}
              canExport={processedData.data.length > 0}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 2: Controls Layout */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Left side: Advanced Filters, Column Visibility, Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <AdvancedFilters columns={columns} filterGroups={filterGroups} onFiltersChange={handleFiltersChange} />
              <ColumnVisibilityToggle
                columns={columns.map(col => ({ ...col, visible: columnVisibility[col.key] !== false }))}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onShowAll={handleShowAllColumns}
                onHideAll={handleHideAllColumns}
              />
              <div className="flex-1 min-w-[200px]">
                <DataTableSearch
                  searchTerm={searchTerm}
                  searchPlaceholder={searchPlaceholder}
                  onSearchChange={handleSearchChange}
                />
              </div>
            </div>
            
            {/* Right side: Create Report CTA */}
            {onCreateNew && (
              <div className="flex-shrink-0">
                <Button onClick={onCreateNew} className="flex items-center gap-2">
                  {createButtonLabel}
                </Button>
              </div>
            )}
          </div>

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
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  {enableSelection && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  {visibleColumns.map((column) => (
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
                    <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      {loading ? loadingMessage : "Processing data..."}
                    </TableCell>
                  </TableRow>
                ) : processedData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-muted-foreground">
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
                      {visibleColumns.map((column) => {
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