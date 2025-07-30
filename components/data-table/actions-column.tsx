"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { ActionItem } from "@/lib/types"

interface ActionsColumnProps {
  row: any
  actions: ActionItem[]
}

export function ActionsColumn({ row, actions }: ActionsColumnProps) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const isDisabled = action.disabled?.(row) ?? false
          const Icon = action.icon

          return (
            <DropdownMenuItem
              key={action.id}
              onClick={() => !isDisabled && action.onClick(row)}
              disabled={isDisabled}
              className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}