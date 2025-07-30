import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DataTableHeaderProps {
  title: string
  totalRecords: number
  onExport: () => void
  canExport: boolean
}

export const DataTableHeader = React.memo(function DataTableHeader({
  title,
  totalRecords,
  onExport,
  canExport,
}: DataTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span>{title}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalRecords} total records
        </span>
        <Button variant="outline" size="sm" onClick={onExport} disabled={!canExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
})