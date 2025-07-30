import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export interface QuickFilterConfig {
  field: string
  label: string
  placeholder: string
  options: { label: string; value: string }[]
}

interface DataTableSearchProps {
  searchTerm: string
  searchPlaceholder: string
  quickFilters: QuickFilterConfig[]
  quickFilterValues: Record<string, string>
  onSearchChange: (value: string) => void
  onQuickFilterChange: (field: string, value: string) => void
}

export const DataTableSearch = React.memo(function DataTableSearch({
  searchTerm,
  searchPlaceholder,
  quickFilters,
  quickFilterValues,
  onSearchChange,
  onQuickFilterChange,
}: DataTableSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {quickFilters.map((filter) => (
        <Select
          key={filter.field}
          value={quickFilterValues[filter.field] || "all"}
          onValueChange={(value) => onQuickFilterChange(filter.field, value)}
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
  )
})