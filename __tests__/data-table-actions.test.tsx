import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DataTable } from "@/components/data-table/data-table"
import type { ColumnConfig, ActionItem, BulkActionItem } from "@/lib/types"

// Mock data for testing
const mockData = [
  { id: 1, name: "Item 1", status: "active" },
  { id: 2, name: "Item 2", status: "inactive" },
  { id: 3, name: "Item 3", status: "active" },
]

const mockColumns: ColumnConfig[] = [
  { key: "id", label: "ID", variant: "text", sortable: true },
  { key: "name", label: "Name", variant: "text", sortable: true },
  { key: "status", label: "Status", variant: "text", sortable: true },
]

const mockActions: ActionItem[] = [
  {
    id: "edit",
    label: "Edit",
    onClick: vi.fn(),
  },
  {
    id: "delete",
    label: "Delete",
    onClick: vi.fn(),
    variant: "destructive",
  },
]

const mockBulkActions: BulkActionItem[] = [
  {
    id: "export",
    label: "Export Selected",
    onClick: vi.fn(),
  },
  {
    id: "delete-bulk",
    label: "Delete Selected",
    onClick: vi.fn(),
    variant: "destructive",
  },
]

describe("DataTable with Actions and Selection", () => {
  describe("multiselect functionality", () => {
    it("should render checkboxes when enableSelection is true", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={true}
        />
      )

      // Should have select all checkbox in header
      expect(screen.getByLabelText("Select all")).toBeInTheDocument()
      
      // Should have individual checkboxes for each row
      expect(screen.getByLabelText("Select row 1")).toBeInTheDocument()
      expect(screen.getByLabelText("Select row 2")).toBeInTheDocument()
      expect(screen.getByLabelText("Select row 3")).toBeInTheDocument()
    })

    it("should not render checkboxes when enableSelection is false", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={false}
        />
      )

      // Should not have any checkboxes
      expect(screen.queryByLabelText("Select all")).not.toBeInTheDocument()
      expect(screen.queryByLabelText("Select row 1")).not.toBeInTheDocument()
    })

    it("should handle individual row selection", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={true}
          bulkActions={mockBulkActions}
        />
      )

      const firstRowCheckbox = screen.getByLabelText("Select row 1")
      fireEvent.click(firstRowCheckbox)

      // Should show floating action bar when items are selected
      expect(screen.getByText("1 item selected")).toBeInTheDocument()
    })
  })

  describe("actions column", () => {
    it("should render actions column when actions are provided", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          actions={mockActions}
        />
      )

      // Should have action buttons for each row
      const actionButtons = screen.getAllByRole("button", { name: /open menu/i })
      expect(actionButtons).toHaveLength(mockData.length)
    })

    it("should not render actions column when no actions are provided", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
        />
      )

      // Should not have any action buttons
      expect(screen.queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument()
    })
  })

  describe("floating action bar", () => {
    it("should show floating action bar when items are selected and bulk actions exist", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={true}
          bulkActions={mockBulkActions}
        />
      )

      const firstRowCheckbox = screen.getByLabelText("Select row 1")
      fireEvent.click(firstRowCheckbox)

      // Should show floating action bar
      expect(screen.getByText("1 item selected")).toBeInTheDocument()
      expect(screen.getByText("Export Selected")).toBeInTheDocument()
      expect(screen.getByText("Delete Selected")).toBeInTheDocument()
    })

    it("should not show floating action bar when no items are selected", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={true}
          bulkActions={mockBulkActions}
        />
      )

      // Should not show floating action bar
      expect(screen.queryByText("Export Selected")).not.toBeInTheDocument()
    })

    it("should clear selection when clear button is clicked", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          searchFields={["name"]}
          enableSelection={true}
          bulkActions={mockBulkActions}
        />
      )

      const firstRowCheckbox = screen.getByLabelText("Select row 1")
      fireEvent.click(firstRowCheckbox)

      // Should show floating action bar
      expect(screen.getByText("1 item selected")).toBeInTheDocument()

      // Click clear selection button
      const clearButton = screen.getByRole("button", { name: "" }) // X button
      fireEvent.click(clearButton)

      // Should hide floating action bar
      expect(screen.queryByText("1 item selected")).not.toBeInTheDocument()
    })
  })
})