import React from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface DataTableSearchProps {
  searchTerm: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
}

export const DataTableSearch = React.memo(function DataTableSearch({
  searchTerm,
  searchPlaceholder,
  onSearchChange,
}: DataTableSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 max-w-[220px]"
      />
    </div>
  )
})