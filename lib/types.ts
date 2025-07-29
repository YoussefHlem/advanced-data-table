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
  options?: { label: string; value: string }[]
}
