"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3, Eye, EyeOff } from "lucide-react"
import type { ColumnConfig } from "@/lib/types"

interface ColumnVisibilityToggleProps {
  columns: ColumnConfig[]
  onColumnVisibilityChange: (columnKey: string, visible: boolean) => void
  onShowAll: () => void
  onHideAll: () => void
}

export function ColumnVisibilityToggle({
  columns,
  onColumnVisibilityChange,
  onShowAll,
  onHideAll,
}: ColumnVisibilityToggleProps) {
  const visibleCount = columns.filter(col => col.visible !== false).length
  const totalCount = columns.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
          <span className="ml-1 text-xs text-muted-foreground">
            ({visibleCount}/{totalCount})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Toggle Columns</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAll}
              className="h-6 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onHideAll}
              className="h-6 px-2 text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              None
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuItem
            key={column.key}
            className="flex items-center space-x-2 cursor-pointer"
            onSelect={(e) => e.preventDefault()}
          >
            <Checkbox
              id={`column-${column.key}`}
              checked={column.visible !== false}
              onCheckedChange={(checked) =>
                onColumnVisibilityChange(column.key, !!checked)
              }
            />
            <label
              htmlFor={`column-${column.key}`}
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              {column.label}
            </label>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}