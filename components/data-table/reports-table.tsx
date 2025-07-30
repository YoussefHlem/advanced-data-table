"use client"

import { useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable} from "./data-table"
import { type QuickFilterConfig } from "./data-table-search"
import { useAllReports, type Report } from "@/lib/graphql-client"
import type { ColumnConfig, ActionItem, BulkActionItem } from "@/lib/types"
import { format } from "date-fns"
import { Edit, Trash2, Eye, Download, Archive } from "lucide-react"

const REPORTS_SEARCH_FIELDS = ["title", "description", "client_phone", "neighbourhood.name", "team.name"]

// Helper function to extract unique options from reports data
function extractUniqueOptions<T>(data: T[], accessor: (item: T) => string | undefined): string[] {
  return [...new Set(data.map(accessor))].filter(Boolean) as string[]
}

export function ReportsTable() {
  // Use React Query hook for data fetching
  const { data: allReports = [], isLoading: loading, error } = useAllReports()

  // Extract status options for use in both quickFilters and columns
  const statusOptions = useMemo(() => {
    return extractUniqueOptions(allReports, (r) => r.status)
  }, [allReports])

  // Generate quick filter options from data
  const quickFilters: QuickFilterConfig[] = useMemo(() => {
    const teamOptions = extractUniqueOptions(allReports, (r) => r.team?.name)
    const neighbourhoodOptions = extractUniqueOptions(allReports, (r) => r.neighbourhood?.name)

    const createFilterConfig = (field: string, label: string, options: string[]): QuickFilterConfig => ({
      field,
      label,
      placeholder: `Filter by ${label.toLowerCase().slice(0, -1)}`,
      options: options.map((option) => ({ label: option, value: option })),
    })

    return [
      createFilterConfig("status", "Statuses", statusOptions),
      createFilterConfig("team.name", "Teams", teamOptions),
      createFilterConfig("neighbourhood.name", "Neighbourhoods", neighbourhoodOptions),
    ]
  }, [allReports, statusOptions])

  const REPORTS_COLUMNS: ColumnConfig[] = useMemo(() => [
    { key: "id", label: "ID", variant: "text", sortable: true, exportable: true },
    { key: "title", label: "Title", variant: "text", sortable: true, exportable: true },
    { key: "description", label: "Description", variant: "text", sortable: true, exportable: true },
    {
      key: "status",
      label: "Status",
      variant: "select",
      sortable: true,
      exportable: true,
      options: statusOptions.map((status) => ({ label: status, value: status })),
    },
    { key: "client_phone", label: "Client Phone", variant: "text", sortable: true, exportable: true },
    { key: "created_at", label: "Created At", variant: "date", sortable: true, exportable: true },
    { key: "neighbourhood.name", label: "Neighbourhood", variant: "text", sortable: true, exportable: true },
    { key: "team.name", label: "Team", variant: "text", sortable: true, exportable: true },
    { key: "latitude", label: "Latitude", variant: "number", sortable: true, exportable: true },
    { key: "longitude", label: "Longitude", variant: "number", sortable: true, exportable: true },
  ], [statusOptions])

  // Helper functions for cell rendering
  const renderIdCell = useCallback((value: any) => (
    <span className="font-mono text-sm">{value}</span>
  ), [])

  const renderTitleCell = useCallback((value: any) => (
    <span className="font-medium">{value}</span>
  ), [])

  const renderDescriptionCell = useCallback((value: any) => (
    <span className="max-w-xs truncate">{value}</span>
  ), [])

  const renderStatusCell = useCallback((value: string) => {
    const getStatusVariant = (status: string) => {
      switch (status) {
        case "completed":
          return "default"
        case "in_progress":
          return "secondary"
        case "cancelled":
          return "destructive"
        default:
          return "outline"
      }
    }

    return (
      <Badge variant={getStatusVariant(value)}>
        {value}
      </Badge>
    )
  }, [])

  const renderDateCell = useCallback((value: any) => {
    if (!value) return "-"
    try {
      return format(new Date(value), "MMM dd, yyyy HH:mm")
    } catch {
      return "-"
    }
  }, [])

  const renderDefaultCell = useCallback((value: any) => value || "-", [])

  // Define row actions
  const actions: ActionItem[] = useMemo(() => [
    {
      id: "view",
      label: "View Details",
      icon: Eye,
      onClick: (row: Report) => {
        console.log("View report:", row.id)
        // Add your view logic here
      },
    },
    {
      id: "edit",
      label: "Edit Report",
      icon: Edit,
      onClick: (row: Report) => {
        console.log("Edit report:", row.id)
        // Add your edit logic here
      },
      disabled: (row: Report) => row.status === "completed",
    },
    {
      id: "delete",
      label: "Delete Report",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: (row: Report) => {
        console.log("Delete report:", row.id)
        // Add your delete logic here
      },
      disabled: (row: Report) => row.status === "completed",
    },
  ], [])

  // Define bulk actions
  const bulkActions: BulkActionItem[] = useMemo(() => [
    {
      id: "export",
      label: "Export Selected",
      icon: Download,
      onClick: (selectedRows: Report[]) => {
        console.log("Export reports:", selectedRows.map(r => r.id))
        // Add your export logic here
      },
    },
    {
      id: "archive",
      label: "Archive Selected",
      icon: Archive,
      onClick: (selectedRows: Report[]) => {
        console.log("Archive reports:", selectedRows.map(r => r.id))
        // Add your archive logic here
      },
      disabled: (selectedRows: Report[]) => selectedRows.some(r => r.status === "completed"),
    },
    {
      id: "delete-bulk",
      label: "Delete Selected",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: (selectedRows: Report[]) => {
        console.log("Delete reports:", selectedRows.map(r => r.id))
        // Add your bulk delete logic here
      },
      disabled: (selectedRows: Report[]) => selectedRows.some(r => r.status === "completed"),
    },
  ], [])

  // Custom cell renderer for reports-specific styling
  const renderCell = useCallback((value: any, column: ColumnConfig, row: Report) => {
    const cellRenderers: Record<string, () => React.ReactNode> = {
      id: () => renderIdCell(value),
      title: () => renderTitleCell(value),
      description: () => renderDescriptionCell(value),
      status: () => renderStatusCell(value),
      created_at: () => renderDateCell(value),
      "neighbourhood.name": () => renderDefaultCell(value),
      "team.name": () => renderDefaultCell(value),
    }

    const renderer = cellRenderers[column.key]
    return renderer ? renderer() : renderDefaultCell(value)
  }, [renderIdCell, renderTitleCell, renderDescriptionCell, renderStatusCell, renderDateCell, renderDefaultCell])

  return (
      <DataTable<Report>
          data={allReports}
          columns={REPORTS_COLUMNS}
          searchFields={REPORTS_SEARCH_FIELDS}
          quickFilters={quickFilters}
          title="Reports Data Table"
          loadingMessage="Loading reports..."
          emptyMessage="No reports available"
          noResultsMessage="No reports match your filters"
          exportFilename="reports"
          loading={loading}
          error={error?.message || null}
          renderCell={renderCell}
          searchPlaceholder="Search by title, description, phone, neighbourhood, or team..."
          actions={actions}
          bulkActions={bulkActions}
          enableSelection={true}
      />
  )
}