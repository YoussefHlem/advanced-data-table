import React from "react"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnConfig, ActionItem } from "@/lib/types"

interface TableSkeletonProps {
  columns: ColumnConfig[]
  enableSelection?: boolean
  actions?: ActionItem[]
  rows: number
}

export function TableSkeleton({ 
  columns, 
  enableSelection = false, 
  actions = [], 
  rows 
}: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {/* Selection column skeleton */}
          {enableSelection && (
            <TableCell>
              <Skeleton className="h-4 w-4 rounded" />
            </TableCell>
          )}
          
          {/* Data columns skeleton */}
          {columns.map((column) => (
            <TableCell key={`skeleton-${index}-${column.key}`}>
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </TableCell>
          ))}
          
          {/* Actions column skeleton */}
          {actions.length > 0 && (
            <TableCell>
              <div className="flex items-center gap-2">
                {actions.map((_, actionIndex) => (
                  <Skeleton 
                    key={`skeleton-${index}-action-${actionIndex}`} 
                    className="h-8 w-8 rounded" 
                  />
                ))}
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  )
}