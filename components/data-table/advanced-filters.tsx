"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter } from "lucide-react"
import { FilterConditionComponent } from "./filter-condition"
import type { FilterGroup, FilterCondition, ColumnConfig } from "@/lib/types"
import type { JoinOperator } from "@/lib/data-table-config"

interface AdvancedFiltersProps {
  columns: ColumnConfig[]
  filterGroups: FilterGroup[]
  onFiltersChange: (groups: FilterGroup[]) => void
}

export function AdvancedFilters({ columns, filterGroups, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  function addFilterGroup() {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      conditions: [],
      joinOperator: "and",
    }
    onFiltersChange([...filterGroups, newGroup])
  }

  function addCondition(groupId: string) {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: columns[0]?.key || "",
      operator: "eq",
      value: null,
      variant: columns[0]?.variant || "text",
    }

    const updatedGroups = filterGroups.map((group) =>
      group.id === groupId ? { ...group, conditions: [...group.conditions, newCondition] } : group,
    )
    onFiltersChange(updatedGroups)
  }

  function updateCondition(groupId: string, conditionId: string, updatedCondition: FilterCondition) {
    const updatedGroups = filterGroups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            conditions: group.conditions.map((condition) =>
              condition.id === conditionId ? updatedCondition : condition,
            ),
          }
        : group,
    )
    onFiltersChange(updatedGroups)
  }

  function removeCondition(groupId: string, conditionId: string) {
    const updatedGroups = filterGroups
      .map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((condition) => condition.id !== conditionId),
            }
          : group,
      )
      .filter((group) => group.conditions.length > 0)

    onFiltersChange(updatedGroups)
  }

  function updateGroupJoinOperator(groupId: string, joinOperator: JoinOperator) {
    const updatedGroups = filterGroups.map((group) => (group.id === groupId ? { ...group, joinOperator } : group))
    onFiltersChange(updatedGroups)
  }

  function removeFilterGroup(groupId: string) {
    onFiltersChange(filterGroups.filter((group) => group.id !== groupId))
  }

  function clearAllFilters() {
    onFiltersChange([])
  }

  const hasActiveFilters = filterGroups.some((group) => group.conditions.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
              {filterGroups.reduce((acc, group) => acc + group.conditions.length, 0)}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.id} className="space-y-4">
                {groupIndex > 0 && (
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">OR</span>
                  </div>
                )}

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Select
                      value={group.joinOperator}
                      onValueChange={(value) => updateGroupJoinOperator(group.id, value as JoinOperator)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND</SelectItem>
                        <SelectItem value="or">OR</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="ghost" size="sm" onClick={() => removeFilterGroup(group.id)}>
                      Remove Group
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {group.conditions.map((condition, conditionIndex) => (
                      <div key={condition.id}>
                        {conditionIndex > 0 && (
                          <div className="flex items-center justify-center py-2">
                            <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                              {group.joinOperator.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <FilterConditionComponent
                          condition={condition}
                          columns={columns}
                          onUpdate={(updatedCondition) => updateCondition(group.id, condition.id, updatedCondition)}
                          onRemove={() => removeCondition(group.id, condition.id)}
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCondition(group.id)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addFilterGroup} className="flex items-center gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Filter Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
