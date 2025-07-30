"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, type QuickFilterConfig } from "./data-table"
import { useAllReports, type Report } from "@/lib/graphql-client"
import type { ColumnConfig } from "@/lib/types"
import { format } from "date-fns"

const REPORTS_COLUMNS: ColumnConfig[] = [
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

const REPORTS_SEARCH_FIELDS = ["title", "description", "client_phone", "neighbourhood.name", "team.name"]

export function ReportsTable() {
  // Use React Query hook for data fetching
  const { data: allReports = [], isLoading: loading, error, refetch } = useAllReports()

  // Generate quick filter options from data
  const quickFilters: QuickFilterConfig[] = useMemo(() => {
    const statusOptions = [...new Set(allReports.map((r) => r.status))].filter(Boolean)
    const teamOptions = [...new Set(allReports.map((r) => r.team?.name))].filter(Boolean)
    const neighbourhoodOptions = [...new Set(allReports.map((r) => r.neighbourhood?.name))].filter(Boolean)

    return [
      {
        field: "status",
        label: "Statuses",
        placeholder: "Filter by status",
        options: statusOptions.map((status) => ({ label: status, value: status })),
      },
      {
        field: "team.name",
        label: "Teams",
        placeholder: "Filter by team",
        options: teamOptions.map((team) => ({ label: team, value: team })),
      },
      {
        field: "neighbourhood.name",
        label: "Neighbourhoods",
        placeholder: "Filter by neighbourhood",
        options: neighbourhoodOptions.map((neighbourhood) => ({ label: neighbourhood, value: neighbourhood })),
      },
    ]
  }, [allReports])

  // Custom cell renderer for reports-specific styling
  const renderCell = (value: any, column: ColumnConfig, row: Report) => {
    if (column.key === "id") {
      return <span className="font-mono text-sm">{value}</span>
    }

    if (column.key === "title") {
      return <span className="font-medium">{value}</span>
    }

    if (column.key === "description") {
      return <span className="max-w-xs truncate">{value}</span>
    }

    if (column.key === "status") {
      return (
        <Badge
          variant={
            value === "completed"
              ? "default"
              : value === "in_progress"
                ? "secondary"
                : value === "cancelled"
                  ? "destructive"
                  : "outline"
          }
        >
          {value}
        </Badge>
      )
    }

    if (column.key === "created_at" && value) {
      return format(new Date(value), "MMM dd, yyyy HH:mm")
    }

    if (column.key === "neighbourhood.name" || column.key === "team.name") {
      return value || "-"
    }

    return value || "-"
  }

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
      onRefresh={() => refetch()}
      loading={loading}
      error={error?.message || null}
      renderCell={renderCell}
      searchPlaceholder="Search by title, description, phone, neighbourhood, or team..."
    />
  )
}