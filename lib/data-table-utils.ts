import { format } from "date-fns"
import type { ColumnConfig } from "./types"

/**
 * Utility functions for data table operations
 */

/**
 * Gets a nested value from an object using dot notation
 * @param obj - The object to get the value from
 * @param path - The dot-separated path to the value
 * @returns The nested value or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

/**
 * Formats a cell value based on the column variant
 * @param value - The value to format
 * @param column - The column configuration
 * @returns The formatted value as a string
 */
export function formatCellValue(value: any, column: ColumnConfig): string {
  if (value === null || value === undefined) return "-"

  switch (column.variant) {
    case "date":
      try {
        return format(new Date(value), "MMM dd, yyyy HH:mm")
      } catch {
        return String(value)
      }
    case "boolean":
      return value ? "Yes" : "No"
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value)
    default:
      return String(value)
  }
}

/**
 * Formats a value for CSV export
 * @param value - The value to format
 * @param column - The column configuration
 * @returns The formatted value for CSV
 */
export function formatCsvValue(value: any, column: ColumnConfig): string {
  if (value === null || value === undefined) return ""

  if (column.variant === "date" && value) {
    try {
      return format(new Date(value), "yyyy-MM-dd HH:mm:ss")
    } catch {
      return String(value)
    }
  }

  // Escape quotes and wrap in quotes for CSV
  return `"${String(value || "").replace(/"/g, '""')}"`
}

/**
 * Generates and downloads a CSV file from data
 * @param data - The data to export
 * @param columns - The column configurations
 * @param filename - The filename for the export
 */
export function exportDataToCSV<T>(
  data: T[],
  columns: ColumnConfig[],
  filename: string = "data"
): void {
  const exportableColumns = columns.filter((col) => col.exportable)
  const headers = exportableColumns.map((col) => col.label).join(",")

  const rows = data.map((item) =>
    exportableColumns
      .map((col) => {
        const value = getNestedValue(item, col.key)
        return formatCsvValue(value, col)
      })
      .join(",")
  )

  const csv = [headers, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`
  link.style.display = "none"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Page size options for pagination
 */
export const PAGE_SIZE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
] as const

/**
 * Default page size for data tables
 */
export const DEFAULT_PAGE_SIZE = 20