import { DataTable } from "@/components/data-table/data-table"

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Advanced Data Table</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive data table with advanced filtering, sorting, and export capabilities
        </p>
      </div>
      <DataTable />
    </div>
  )
}
