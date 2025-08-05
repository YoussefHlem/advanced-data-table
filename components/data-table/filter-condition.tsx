"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { dataTableConfig } from "@/lib/data-table-config"
import type { FilterCondition, ColumnConfig } from "@/lib/types"

interface FilterConditionProps {
  condition: FilterCondition
  columns: ColumnConfig[]
  onUpdate: (condition: FilterCondition) => void
  onRemove: () => void
}

export function FilterConditionComponent({ condition, columns, onUpdate, onRemove }: FilterConditionProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const selectedColumn = columns.find((col) => col.key === condition.field)
  const operators = selectedColumn ? getOperatorsForVariant(selectedColumn.variant) : []

  function getOperatorsForVariant(variant: string) {
    switch (variant) {
      case "text":
        return dataTableConfig.textOperators
      case "number":
      case "range":
        return dataTableConfig.numericOperators
      case "date":
      case "dateRange":
        return dataTableConfig.dateOperators
      case "select":
        return dataTableConfig.selectOperators
      case "multiSelect":
        return dataTableConfig.multiSelectOperators
      case "boolean":
        return dataTableConfig.booleanOperators
      default:
        return dataTableConfig.textOperators
    }
  }

  // Helper functions for rendering different input types
  const renderTextInput = () => (
    <Input
      placeholder="Enter value"
      value={condition.value || ""}
      onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
    />
  )

  const renderNumberInput = () => (
    <Input
      type="number"
      placeholder="Enter number"
      value={condition.value || ""}
      onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
    />
  )

  const renderRangeInput = () => {
    if (condition.operator === "isBetween") {
      return (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={condition.value?.min || ""}
            onChange={(e) =>
              onUpdate({
                ...condition,
                value: { ...condition.value, min: e.target.value },
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={condition.value?.max || ""}
            onChange={(e) =>
              onUpdate({
                ...condition,
                value: { ...condition.value, max: e.target.value },
              })
            }
          />
        </div>
      )
    }
    return renderNumberInput()
  }

  const renderDateInput = () => {
    // Handle date range for "isBetween" operator
    if (condition.operator === "isBetween") {
      const startDate = condition.value?.start ? new Date(condition.value.start) : undefined
      const endDate = condition.value?.end ? new Date(condition.value.end) : undefined
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !startDate && !endDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate && endDate 
                ? `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
                : startDate 
                ? `${format(startDate, "PPP")} - End date`
                : endDate
                ? `Start date - ${format(endDate, "PPP")}`
                : "Pick date range"
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                onUpdate({
                  ...condition,
                  value: {
                    start: range?.from?.toISOString(),
                    end: range?.to?.toISOString(),
                  },
                })
              }}
            />
          </PopoverContent>
        </Popover>
      )
    }

    // Handle single date selection for other operators
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start text-left font-normal", !condition.value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {condition.value ? format(new Date(condition.value), "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={condition.value ? new Date(condition.value) : undefined}
            onSelect={(date) => onUpdate({ ...condition, value: date?.toISOString() })}
          />
        </PopoverContent>
      </Popover>
    )
  }

  const renderDateRangeInput = () => {
    if (condition.operator === "isBetween") {
      return (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date)
                  onUpdate({
                    ...condition,
                    value: {
                      ...condition.value,
                      start: date?.toISOString(),
                    },
                  })
                }}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date)
                  onUpdate({
                    ...condition,
                    value: {
                      ...condition.value,
                      end: date?.toISOString(),
                    },
                  })
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )
    }
    return renderDateInput()
  }

  const renderSelectInput = () => (
    <Select value={condition.value || ""} onValueChange={(value) => onUpdate({ ...condition, value })}>
      <SelectTrigger>
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        {selectedColumn?.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderMultiSelectInput = () => (
    <div className="space-y-2">
      {selectedColumn?.options?.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={option.value}
            checked={condition.value?.includes(option.value) || false}
            onCheckedChange={(checked) => {
              const currentValues = condition.value || []
              const newValues = checked
                ? [...currentValues, option.value]
                : currentValues.filter((v: string) => v !== option.value)
              onUpdate({ ...condition, value: newValues })
            }}
          />
          <Label htmlFor={option.value}>{option.label}</Label>
        </div>
      ))}
    </div>
  )

  const renderBooleanInput = () => (
    <Select
      value={condition.value?.toString() || ""}
      onValueChange={(value) => onUpdate({ ...condition, value: value === "true" })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select value" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">True</SelectItem>
        <SelectItem value="false">False</SelectItem>
      </SelectContent>
    </Select>
  )

  function renderValueInput() {
    if (!selectedColumn) return null

    const { variant } = selectedColumn

    switch (variant) {
      case "text":
        return renderTextInput()

      case "number":
        return renderNumberInput()

      case "range":
        return renderRangeInput()

      case "date":
        return renderDateInput()

      case "dateRange":
        return renderDateRangeInput()

      case "select":
        return renderSelectInput()

      case "multiSelect":
        return renderMultiSelectInput()

      case "boolean":
        return renderBooleanInput()

      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <Select
        value={condition.field}
        onValueChange={(field) => {
          const column = columns.find((col) => col.key === field)
          onUpdate({
            ...condition,
            field,
            variant: column?.variant || "text",
            operator: getOperatorsForVariant(column?.variant || "text")[0]?.value || "eq",
            value: null,
          })
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {columns.map((column) => (
            <SelectItem key={column.key} value={column.key}>
              {column.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(operator) => onUpdate({ ...condition, operator: operator as any })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem
              key={operator.value}
              value={operator.value}
            >
              {operator.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1">{!["isEmpty", "isNotEmpty"].includes(condition.operator) && renderValueInput()}</div>

      <Button variant="ghost" size="sm" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
