"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFileDataFromAPI, exportAllDataToCSV, type FileDataResponse, type FilterParams } from "../api-service"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchX, FilterX } from "lucide-react"

interface DataTableProps {
  data: FileDataResponse[]
  initialLoading: boolean
  searchTerm?: string
  selectedFile?: string
  dateRange?: { from?: Date; to?: Date }
}

export function DataTable({
  data: initialData,
  // initialLoading: initialLoading,
  searchTerm,
  selectedFile,
  dateRange,
}: DataTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [data, setData] = useState<FileDataResponse[]>(initialData)
  const [loading, setLoading] = useState<boolean>(false)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [pageLoading, setPageLoading] = useState<boolean>(false)
  const [exportLoading, setExportLoading] = useState<boolean>(false)

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

  // Charger les données paginées depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true)
      try {
        const response = await getFileDataFromAPI(
          searchTerm,
          selectedFile === "all" ? undefined : selectedFile,
          page,
          pageSize,
          dateRange?.from?.toISOString(),
          dateRange?.to?.toISOString(),
        )
        setData(response.items)
        setTotalItems(response.total)
        setTotalPages(response.pages)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setPageLoading(false)
      }
    }

    fetchData()
  }, [page, pageSize, searchTerm, selectedFile, dateRange])

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
  const exportToCSV = async () => {
    try {
      setExportLoading(true)

      // Préparer les paramètres de filtrage
      const params: FilterParams = {
        search: searchTerm,
        fileName: selectedFile === "all" ? undefined : selectedFile,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
      }

      // Récupérer toutes les données pour l'export
      const allData = await exportAllDataToCSV(params)

      if (allData.length === 0) {
        alert("Aucune donnée à exporter")
        return
      }

      // Définir les en-têtes pour le CSV (toutes les colonnes)
      const headers = [
        "Référence",
        "ID LIN",
        "ID CCU",
        "Etat",
        "Création",
        "Mise à jour",
        "IDRH",
        "Device Id",
        "Retour métier",
        "Commentaires cloture",
        "Nom bureau de poste",
        "Regate",
        "Source",
        "Solution scan",
        "RG",
        "RUO",
        "Fichier",
      ]

      // Mapper les données pour le CSV
      const csvRows = allData.map((row) => {
        return [
          row.reference || "",
          row.id_lin || "",
          row.id_ccu || "",
          row.etat || "",
          row.creation || "",
          row.mise_a_jour || "",
          row.idrh || "",
          row.device_id || "",
          row.retour_metier || "",
          row.commentaires_cloture || "",
          row.nom_bureau_poste || "",
          row.regate || "",
          row.source || "",
          row.solution_scan || "",
          row.rg || "",
          row.ruo || "",
          row.file_name || "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      })

      // Créer le contenu CSV
      const csvContent = `${headers.map((h) => `"${h}"`).join(";")}
${csvRows.join("\n")}`

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `export-donnees-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erreur lors de l'export des données:", error)
      alert("Erreur lors de l'export des données")
    } finally {
      setExportLoading(false)
    }
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
            onChange={(e) => {
              const newSize = Number(e.target.value)
              setPageSize(newSize)
              setPage(1) // Réinitialiser à la première page lors du changement de taille
            }}
            className="w-20 border-indigo-200"
            min={1}
            max={100}
          />
          <span className="text-sm text-indigo-600">lignes par page</span>
        </div>

        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={totalItems === 0 || exportLoading}
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          {exportLoading ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exporter CSV
            </>
          )}
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
              {loading || pageLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                      <p className="mt-2 text-indigo-500 flex items-center">
                        Chargement des données
                        <span className="ml-1 inline-flex">
                          <span className="animate-bounce mx-0.5 delay-100">.</span>
                          <span className="animate-bounce mx-0.5 delay-200">.</span>
                          <span className="animate-bounce mx-0.5 delay-300">.</span>
                        </span>
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <SearchX className="h-16 w-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Aucune donnée trouvée</p>
                      <div className="flex items-center mt-2 text-sm">
                        <FilterX className="h-4 w-4 mr-1" />
                        <span>Essayez d'élargir vos critères de recherche</span>
                      </div>

                      {(searchTerm || selectedFile !== "all" || dateRange?.from || dateRange?.to) && (
                        <div className="mt-4 text-sm">
                          <p>Filtres actifs :</p>
                          <ul className="list-disc list-inside mt-1">
                            {searchTerm && <li>Recherche : "{searchTerm}"</li>}
                            {selectedFile !== "all" && <li>Fichier : {selectedFile}</li>}
                            {dateRange?.from && <li>Date début : {dateRange.from.toLocaleDateString('fr-FR')}</li>}
                            {dateRange?.to && <li>Date fin : {dateRange.to.toLocaleDateString('fr-FR')}</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={`row-${rowIndex}-${row.id}`}
                    className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50/30"} transition-opacity duration-150 ease-in-out`}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column.id}-${row.id}`} className="px-4 py-3 text-sm">
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
      {totalItems > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-indigo-600">
            Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, totalItems)} sur {totalItems} entrées
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || pageLoading}
              className="border-indigo-200 flex items-center"
            >
              {pageLoading ? (
                <RefreshCwIcon className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
              <span>Précédent</span>
            </Button>

            <span className="text-sm text-indigo-600 flex items-center">
              Page {page} sur {totalPages || 1}
              {pageLoading && <RefreshCwIcon className="h-3 w-3 ml-2 animate-spin text-indigo-400" />}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || pageLoading}
              className="border-indigo-200 flex items-center"
            >
              <span>Suivant</span>
              {pageLoading ? (
                <RefreshCwIcon className="h-3 w-3 ml-1 animate-spin" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}