"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import type { BulkActionItem } from "@/lib/types"

interface FloatingActionBarProps {
  selectedCount: number
  bulkActions: BulkActionItem[]
  selectedRows: any[]
  onClearSelection: () => void
}

export function FloatingActionBar({
  selectedCount,
  bulkActions,
  selectedRows,
  onClearSelection,
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="px-4 py-3 shadow-lg border-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => {
              const isDisabled = action.disabled?.(selectedRows) ?? false
              const Icon = action.icon
              
              return (
                <Button
                  key={action.id}
                  variant={action.variant === "destructive" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => action.onClick(selectedRows)}
                  disabled={isDisabled}
                  className="h-8"
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}