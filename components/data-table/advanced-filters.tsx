"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Filter, X, Trash2, Copy, Settings2, ChevronDown, AlertCircle } from "lucide-react"
import { FilterConditionComponent } from "./filter-condition"
import type { FilterGroup, FilterCondition, ColumnConfig } from "@/lib/types"
import type { JoinOperator } from "@/lib/data-table-config"

interface AdvancedFiltersProps {
  columns: ColumnConfig[]
  filterGroups: FilterGroup[]
  onFiltersChange: (groups: FilterGroup[]) => void
}

// Helper functions for creating new filter elements
function createNewFilterGroup(): FilterGroup {
  return {
    id: `group-${Date.now()}`,
    conditions: [],
    joinOperator: "and",
  }
}

function createNewCondition(columns: ColumnConfig[]): FilterCondition {
  const firstColumn = columns[0]
  if (!firstColumn) {
    throw new Error("No columns available for creating filter condition")
  }

  return {
    id: `condition-${Date.now()}`,
    field: firstColumn.key,
    operator: "eq",
    value: null,
    variant: firstColumn.variant,
  }
}

export const AdvancedFilters = React.memo(function AdvancedFilters({ columns, filterGroups, onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  function addFilterGroup() {
    const newGroup = createNewFilterGroup()
    onFiltersChange([...filterGroups, newGroup])
  }

  function addCondition(groupId: string) {
    try {
      const newCondition = createNewCondition(columns)
      const updatedGroups = filterGroups.map((group) =>
          group.id === groupId ? { ...group, conditions: [...group.conditions, newCondition] } : group,
      )
      onFiltersChange(updatedGroups)
    } catch (error) {
      console.error("Failed to add condition:", error)
    }
  }

  function duplicateGroup(groupId: string) {
    const groupToDuplicate = filterGroups.find(g => g.id === groupId)
    if (!groupToDuplicate) return

    const duplicatedGroup: FilterGroup = {
      ...groupToDuplicate,
      id: `group-${Date.now()}`,
      conditions: groupToDuplicate.conditions.map(condition => ({
        ...condition,
        id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }

    const groupIndex = filterGroups.findIndex(g => g.id === groupId)
    const newGroups = [...filterGroups]
    newGroups.splice(groupIndex + 1, 0, duplicatedGroup)
    onFiltersChange(newGroups)
  }

  function toggleGroupCollapse(groupId: string) {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  // Helper function to update groups immutably
  function updateFilterGroups(updater: (groups: FilterGroup[]) => FilterGroup[]) {
    const updatedGroups = updater(filterGroups)
    onFiltersChange(updatedGroups)
  }

  function updateCondition(groupId: string, conditionId: string, updatedCondition: FilterCondition) {
    updateFilterGroups((groups) =>
        groups.map((group) =>
            group.id === groupId
                ? {
                  ...group,
                  conditions: group.conditions.map((condition) =>
                      condition.id === conditionId ? updatedCondition : condition,
                  ),
                }
                : group,
        )
    )
  }

  function removeCondition(groupId: string, conditionId: string) {
    updateFilterGroups((groups) =>
        groups
            .map((group) =>
                group.id === groupId
                    ? {
                      ...group,
                      conditions: group.conditions.filter((condition) => condition.id !== conditionId),
                    }
                    : group,
            )
            .filter((group) => group.conditions.length > 0)
    )
  }

  function updateGroupJoinOperator(groupId: string, joinOperator: JoinOperator) {
    updateFilterGroups((groups) =>
        groups.map((group) => (group.id === groupId ? { ...group, joinOperator } : group))
    )
  }

  function removeFilterGroup(groupId: string) {
    updateFilterGroups((groups) => groups.filter((group) => group.id !== groupId))
  }

  function clearAllFilters() {
    updateFilterGroups(() => [])
    setCollapsedGroups(new Set())
  }

  const hasActiveFilters = filterGroups.some((group) => group.conditions.length > 0)
  const totalConditionsCount = filterGroups.reduce((acc, group) => acc + group.conditions.length, 0)

  return (
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
                variant={hasActiveFilters ? "default" : "outline"}
                className="flex items-center gap-2 relative transition-all duration-200"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <span className="sm:hidden">Filters</span>
              {hasActiveFilters && (
                  <Badge
                      variant="secondary"
                      className="ml-1 px-2 py-0.5 text-xs bg-background/20 text-current border-current/20"
                  >
                    {totalConditionsCount}
                  </Badge>
              )}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[900px] max-w-[95vw] p-0 shadow-xl border-0 bg-background" align="start">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Filter Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters
                          ? `${totalConditionsCount} active condition${totalConditionsCount !== 1 ? 's' : ''} across ${filterGroups.length} group${filterGroups.length !== 1 ? 's' : ''}`
                          : "Create advanced filters to refine your data"
                      }
                    </p>
                  </div>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                )}
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {filterGroups.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">No filters configured</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get started by creating your first filter group
                      </p>
                      <Button onClick={addFilterGroup} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Filter Group
                      </Button>
                    </div>
                  </div>
              ) : (
                  <div className="space-y-6">
                    {filterGroups.map((group, groupIndex) => {
                      const isCollapsed = collapsedGroups.has(group.id)

                      return (
                          <div key={group.id} className="space-y-4">
                            {groupIndex > 0 && (
                                <div className="relative">
                                  <Separator className="my-4" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Badge variant="secondary" className="bg-background px-4 py-1 shadow-sm">
                                      <span className="text-xs font-semibold">OR</span>
                                    </Badge>
                                  </div>
                                </div>
                            )}

                            <div className="border rounded-xl bg-card/50 backdrop-blur-sm transition-all duration-200">
                              <div className="p-4 border-b bg-muted/20 rounded-t-xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleGroupCollapse(group.id)}
                                        className="p-1 h-auto hover:bg-background/50"
                                    >
                                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                                    </Button>

                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-muted-foreground">Join with:</span>
                                      <Select
                                          value={group.joinOperator}
                                          onValueChange={(value) => updateGroupJoinOperator(group.id, value as JoinOperator)}
                                      >
                                        <SelectTrigger className="w-[100px] h-8 bg-background">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="and">AND</SelectItem>
                                          <SelectItem value="or">OR</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <Badge variant="outline" className="text-xs">
                                      {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => duplicateGroup(group.id)}
                                        title="Duplicate Group"
                                        className="h-8 w-8 p-0 hover:bg-background/50"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFilterGroup(group.id)}
                                        title="Remove Group"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {!isCollapsed && (
                                  <div className="p-4 space-y-4">
                                    <div className="">
                                      {group.conditions.map((condition, conditionIndex) => (
                                          <div key={condition.id}>
                                            {conditionIndex > 0 && (
                                                <div className="flex items-center justify-center py-2">
                                                  <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                                                    {group.joinOperator.toUpperCase()}
                                                  </Badge>
                                                </div>
                                            )}
                                            <div className="rounded-lg bg-background/50 transition-all duration-200 hover:bg-background/80">
                                              <FilterConditionComponent
                                                  condition={condition}
                                                  columns={columns}
                                                  onUpdate={(updatedCondition) => updateCondition(group.id, condition.id, updatedCondition)}
                                                  onRemove={() => removeCondition(group.id, condition.id)}
                                              />
                                            </div>
                                          </div>
                                      ))}
                                    </div>

                                    <Button
                                        variant="dashed"
                                        size="sm"
                                        onClick={() => addCondition(group.id)}
                                        className="w-full flex items-center gap-2 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-all duration-200"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add Condition
                                    </Button>
                                  </div>
                              )}
                            </div>
                          </div>
                      )
                    })}

                    <div className="pt-4 border-t">
                      <Button
                          variant="outline"
                          onClick={addFilterGroup}
                          className="w-full flex items-center gap-2 h-12 border-2 border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Add Filter Group
                      </Button>
                    </div>
                  </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
  )
})