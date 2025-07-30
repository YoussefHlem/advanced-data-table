import type { FilterVariant, Operator, JoinOperator } from "./data-table-config"

export interface FilterCondition {
  id: string
  field: string
  operator: Operator
  value: any
  variant: FilterVariant
}

export interface FilterGroup {
  id: string
  conditions: FilterCondition[]
  joinOperator: JoinOperator
}

export interface SortConfig {
  field: string
  order: "asc" | "desc"
}

export interface ColumnConfig {
  key: string
  label: string
  variant: FilterVariant
  sortable?: boolean
  exportable?: boolean
  visible?: boolean
  options?: { label: string; value: string }[]
}

export interface ActionItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: any) => void
  disabled?: (row: any) => boolean
  variant?: "default" | "destructive"
}

export interface BulkActionItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (selectedRows: any[]) => void
  disabled?: (selectedRows: any[]) => boolean
  variant?: "default" | "destructive"
}
