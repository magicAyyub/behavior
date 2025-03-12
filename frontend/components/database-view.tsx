"use client"

import { useState, useEffect } from "react"
import { type FileDataResponse, getFileDataFromAPI, getUniqueFilesFromAPI, deleteFileDataFromAPI } from "./api-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircleIcon, DatabaseIcon, SearchIcon, TrashIcon, RefreshCwIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DatabaseView() {
  const [data, setData] = useState<FileDataResponse[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  // Colonnes à afficher
  const columns = ["reference", "id_lin", "id_ccu", "etat", "creation", "mise_a_jour", "file_name", "import_date"]

  // Fonction pour charger les données
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFileDataFromAPI(searchTerm, selectedFile)
      setData(result)
    } catch (err) {
      setError("Erreur lors du chargement des données")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour charger la liste des fichiers
  const loadFiles = async () => {
    try {
      const files = await getUniqueFilesFromAPI()
      setFiles(files)
    } catch (err) {
      console.error("Erreur lors du chargement des fichiers:", err)
    }
  }

  // Fonction pour supprimer un fichier
  const deleteFile = async () => {
    if (!selectedFile) return

    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les données du fichier "${selectedFile}" ?`)) {
      return
    }

    setDeleteLoading(true)
    setError(null)
    try {
      await deleteFileDataFromAPI(selectedFile)
      // Recharger les données et la liste des fichiers
      await loadFiles()
      setSelectedFile("")
      await loadData()
    } catch (err) {
      setError("Erreur lors de la suppression du fichier")
      console.error(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Charger les données et les fichiers au chargement du composant
  useEffect(() => {
    loadFiles()
    loadData()
  }, [])

  // Recharger les données lorsque les filtres changent
  useEffect(() => {
    loadData()
  }, [selectedFile])

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card className="border-t-4 border-t-indigo-500 shadow-md">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <DatabaseIcon className="h-6 w-6 text-indigo-500" />
          Données en Base
        </CardTitle>
        <CardDescription className="text-indigo-500">
          Consultez et gérez les données importées dans la base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Filtres et actions */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-indigo-500" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-indigo-200 focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && loadData()}
              />
            </div>
          </div>

          <Select value={selectedFile} onValueChange={setSelectedFile}>
            <SelectTrigger className="w-[250px] border-indigo-200">
              <SelectValue placeholder="Sélectionner un fichier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les fichiers</SelectItem>
              {files.map((file) => (
                <SelectItem key={file} value={file}>
                  {file}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>

            {selectedFile && (
              <Button
                variant="outline"
                onClick={deleteFile}
                disabled={deleteLoading || !selectedFile}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <TrashIcon className={`h-4 w-4 mr-2 ${deleteLoading ? "animate-spin" : ""}`} />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
            <AlertCircleIcon className="h-4 w-4 mr-2 text-red-500" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tableau de données */}
        <div className="border rounded-md border-indigo-100">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-50">
                  {columns.map((column) => (
                    <TableHead key={column} className="px-4 py-3 text-xs font-medium text-indigo-700">
                      {column === "reference"
                        ? "Référence"
                        : column === "id_lin"
                          ? "ID LIN"
                          : column === "id_ccu"
                            ? "ID CCU"
                            : column === "etat"
                              ? "État"
                              : column === "creation"
                                ? "Création"
                                : column === "mise_a_jour"
                                  ? "Mise à jour"
                                  : column === "file_name"
                                    ? "Fichier"
                                    : column === "import_date"
                                      ? "Date d'import"
                                      : column}
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
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                      Aucune donnée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}>
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}-${column}`} className="px-4 py-3 text-sm">
                          {column === "import_date" ? (
                            formatDate(row[column as keyof FileDataResponse] as string)
                          ) : column === "file_name" ? (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                              {row[column as keyof FileDataResponse] || "-"}
                            </Badge>
                          ) : (
                            row[column as keyof FileDataResponse] || "-"
                          )}
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

        {/* Pagination et informations */}
        <div className="flex justify-between items-center text-sm text-indigo-600">
          <span>Total: {data.length} enregistrements</span>
        </div>
      </CardContent>
    </Card>
  )
}

