"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface DataPreviewProps {
  data: any[]
}

export function DataPreview({ data }: DataPreviewProps) {
  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-muted-foreground">Aucune donnée à afficher</div>
  }

  const columns = Object.keys(data[0])

  return (
    <div className="border rounded-md border-indigo-100">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-indigo-50">
              {columns.map((column) => (
                <TableHead key={column} className="px-2 py-2 text-xs font-medium text-indigo-700">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}>
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`} className="px-2 py-2 text-xs truncate max-w-[200px]">
                    {row[column] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}