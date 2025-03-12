"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FileDataResponse } from "../api-service"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react"

interface DataTableProps {
  data: FileDataResponse[]
  loading: boolean
}

export function DataTable({ data, loading }: DataTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Colonnes à afficher
  const columns = [
    { id: "reference", label: "Référence" },
    { id: "id_lin", label: "ID LIN" },
    { id: "id_ccu", label: "ID CCU" },
    { id: "etat", label: "État" },
    { id: "creation", label: "Création" },
    { id: "mise_a_jour", label: "Mise à jour" },
    { id: "file_name", label: "Fichier" },
  ]

  // Pagination
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Tri
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0

    const fieldA = a[sortField as keyof FileDataResponse]
    const fieldB = b[sortField as keyof FileDataResponse]

    if (fieldA === fieldB) return 0

    if (sortDirection === "asc") {
      return fieldA < fieldB ? -1 : 1
    } else {
      return fieldA > fieldB ? -1 : 1
    }
  })

  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Fonction pour changer le tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Fonction pour exporter les données
  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = columns.map((col) => col.label).join(";")
    const rows = data
      .map((row) =>
        columns
          .map((col) => {
            const value = row[col.id as keyof FileDataResponse]
            return value ? `"${value}"` : '""'
          })
          .join(";"),
      )
      .join("\n")

    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `export-donnees-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Formater la date pour l'affichage
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-20 border-indigo-200"
            min={1}
          />
          <span className="text-sm text-indigo-600">lignes par page</span>
        </div>

        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={data.length === 0 || loading}
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="border rounded-md border-indigo-100">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-50">
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className="px-4 py-3 text-xs font-medium text-indigo-700 cursor-pointer hover:bg-indigo-100"
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {sortField === column.id && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                    <p className="mt-2 text-indigo-500">Chargement des données...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                    Aucune donnée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column.id}`} className="px-4 py-3 text-sm">
                        {column.id === "creation" || column.id === "mise_a_jour"
                          ? formatDate(row[column.id as keyof FileDataResponse] as string)
                          : row[column.id as keyof FileDataResponse] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-indigo-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, data.length)} sur {data.length} entrées
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-indigo-200"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="text-sm text-indigo-600">
              Page {page} sur {totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="border-indigo-200"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

