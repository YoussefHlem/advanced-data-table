import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { PAGE_SIZE_OPTIONS } from "@/lib/data-table-utils"

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface DataTablePaginationProps {
  pagination: PaginationInfo
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const DataTablePagination = React.memo(function DataTablePagination({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  if (pagination.totalItems === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Showing {pagination.startIndex} to {pagination.endIndex} of{" "}
          {pagination.totalItems} results
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
            onPageChange(1) // Reset to first page when changing page size
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!pagination.hasPrevPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
          disabled={!pagination.hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm px-4">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.totalPages)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})