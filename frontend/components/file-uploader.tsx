"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import * as ExcelJS from "exceljs"
import {
  FileIcon,
  UploadCloudIcon,
  XIcon,
  DownloadIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  FileSpreadsheetIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  DatabaseIcon,
  SaveIcon,
  BarChartIcon,
  FileCog
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataPreview } from "./data-preview"
import { DatabaseView } from "./database-view"
import { sendFileDataToAPI } from "./api-service"

type FileWithPreview = {
  file: File
  preview: string
}

type FileValidationError = {
  fileName: string
  errors: {
    type: "missing_column" | "extra_column" | "invalid_format"
    column?: string
    message: string
  }[]
}

// Structure attendue des colonnes dans l'ordre
const EXPECTED_COLUMNS = [
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
]

// Fonction utilitaire pour formater les grands nombres
const formatLargeNumber = (value: any): string => {
  if (typeof value === "number") {
    return value.toLocaleString("fullwide", { useGrouping: false })
  }
  return value?.toString() || ""
}

// Fonction utilitaire pour formater les dates de manière uniforme
const formatDate = (value: any, timeValue?: string): string => {
  if (!value) return ""

  try {
    // Si c'est déjà au format DD/MM/YYYY HH:mm:ss
    if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return value.includes(":") ? value : `${value}:00`
    }

    let date: Date

    // Gérer le cas des dates au format GMT
    if (typeof value === "string" && value.includes("GMT")) {
      date = new Date(value)
    }
    // Gérer le cas des dates au format "jour X mois YYYY"
    else if (typeof value === "string" && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(value)) {
      const parts = value.split(" ")
      const day = parts[1]
      const month = getMonthNumber(parts[2])
      const year = parts[3]

      if (timeValue) {
        // Si nous avons une valeur de temps séparée
        const timeParts = timeValue.split(":")
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`
      }

      date = new Date(`${year}-${month}-${day}`)
    }
    // Gérer le cas des dates au format YYYY-MM-DD HH:mm:ss
    else if (typeof value === "string" && value.includes("-")) {
      date = new Date(value)
    }
    // Pour tout autre format, essayer de créer une date
    else {
      date = new Date(value)
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return value?.toString() || ""
    }

    // Formater la date au format désiré
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    console.warn("Erreur de conversion de date:", e)
    return value?.toString() || ""
  }
}

// Fonction utilitaire pour convertir le nom du mois en numéro
const getMonthNumber = (monthName: string): string => {
  const months: { [key: string]: string } = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  }
  return months[monthName.substring(0, 3).toLowerCase()] || "01"
}

// Fonction utilitaire pour extraire la valeur d'une cellule Excel
const getCellValue = (cell: ExcelJS.Cell): any => {
  if (!cell) return ""

  if (cell.type === ExcelJS.ValueType.Date) {
    return cell.value
  }

  if (cell.type === ExcelJS.ValueType.Number) {
    return cell.value
  }

  if (cell.type === ExcelJS.ValueType.String) {
    return cell.text.trim()
  }

  if (cell.type === ExcelJS.ValueType.Boolean) {
    return cell.value ? "Oui" : "Non"
  }

  if (cell.type === ExcelJS.ValueType.Formula) {
    return cell.result
  }

  return cell.value?.toString() || ""
}

// Fonction pour déterminer le type de fichier et sa couleur
const getFileTypeInfo = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()

  if (extension === "csv") {
    return {
      icon: FileTextIcon,
      color: "bg-amber-100 text-amber-600",
      label: "CSV",
    }
  } else if (["xlsx", "xls"].includes(extension || "")) {
    return {
      icon: FileSpreadsheetIcon,
      color: "bg-emerald-100 text-emerald-600",
      label: "Excel",
    }
  } else {
    return {
      icon: FileIcon,
      color: "bg-blue-100 text-blue-600",
      label: "Fichier",
    }
  }
}

export function FileUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [processedFiles, setProcessedFiles] = useState<Array<{ fileName: string; data: any[] }>>([])
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([])
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [savingToDb, setSavingToDb] = useState<{ [key: string]: boolean }>({})
  const [savedFiles, setSavedFiles] = useState<string[]>([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
      "application/csv": [".csv"],
    },
    onDrop: (acceptedFiles) => {
      setError(null)
      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setFiles((prev) => [...prev, ...newFiles])
    },
  })

  const removeFile = (index: number) => {
    setFiles((files) => {
      const newFiles = [...files]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const processFiles = async () => {
    if (files.length === 0) {
      setError("Veuillez sélectionner au moins un fichier Excel ou CSV")
      return
    }

    setProcessing(true)
    setProgress(0)
    setError(null)
    setValidationErrors([])

    try {
      const processedData = []
      const newValidationErrors: FileValidationError[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i].file
        setProcessingStatus(`Traitement du fichier ${i + 1}/${files.length}: ${file.name}`)

        try {
          const isCSV = file.name.toLowerCase().endsWith(".csv")
          const data = isCSV ? await readCSVFile(file) : await readExcelFile(file)

          processedData.push({
            fileName: file.name,
            data: data,
          })
        } catch (err) {
          console.error("Erreur lors du traitement du fichier:", err)
          newValidationErrors.push({
            fileName: file.name,
            errors: [
              {
                type: "invalid_format",
                message: `Erreur lors du traitement du fichier : ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
          })
        }

        setProgress(((i + 1) / files.length) * 100)
      }

      setValidationErrors(newValidationErrors)
      setProcessedFiles(processedData)
      setProcessingStatus("Traitement terminé")

      // Switch to results tab when processing is complete
      if (processedData.length > 0) {
        setActiveTab("results")
      }
    } catch (err) {
      setError(`Erreur lors du traitement des fichiers: ${err instanceof Error ? err.message : String(err)}`)
      setProcessingStatus("Une erreur est survenue")
    } finally {
      setProcessing(false)
    }
  }

  const readExcelFile = async (file: File): Promise<any[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(arrayBuffer)

        // Utiliser la première feuille
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          throw new Error("Aucune feuille de calcul trouvée dans le fichier Excel")
        }

        // Obtenir les en-têtes (première ligne)
        const headers: string[] = []
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = getCellValue(cell).toString().trim()
        })

        // Convertir les données en objets
        const data: Record<string, any>[] = []

        // Parcourir chaque ligne (à partir de la deuxième ligne)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return // Ignorer la ligne d'en-tête

          const rowData: Record<string, any> = {}

          // Initialiser toutes les colonnes attendues avec des valeurs vides
          EXPECTED_COLUMNS.forEach((col) => {
            rowData[col] = ""
          })

          // Parcourir chaque cellule de la ligne
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1]
            if (!header) return

            const value = getCellValue(cell)

            // Gérer le cas spécial de la colonne Création avec l'heure séparée
            if (header === "Création") {
              // Chercher une colonne d'heure potentielle
              let timeValue = ""
              row.eachCell((timeCell, timeColNumber) => {
                const timeHeader = headers[timeColNumber - 1]
                if (timeHeader && (timeHeader.includes("heure") || timeHeader.endsWith(":"))) {
                  timeValue = getCellValue(timeCell)
                }
              })
              rowData[header] = formatDate(value, timeValue)
            }
            // Gérer les autres colonnes
            else if (EXPECTED_COLUMNS.includes(header)) {
              if (header === "ID CCU") {
                rowData[header] = formatLargeNumber(value)
              } else if (header === "Mise à jour") {
                rowData[header] = formatDate(value?.toString())
              } else {
                rowData[header] = value?.toString() || ""
              }
            }
          })

          data.push(rowData)
        })

        resolve(data)
      } catch (error) {
        reject(error)
      }
    })
  }

  const readCSVFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const decoder = new TextDecoder("windows-1252")
          const arrayBuffer = e.target?.result as ArrayBuffer
          const csvText = decoder.decode(arrayBuffer)
          const lines = csvText.split(/\r?\n/)
          const headers = lines[0].split(";").map((header) => header.trim().replace(/^"?|"?$/g, ""))

          const result = []

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = []
            let currentValue = ""
            let insideQuotes = false

            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j]

              if (char === '"') {
                if (insideQuotes && lines[i][j + 1] === '"') {
                  currentValue += '"'
                  j++
                } else {
                  insideQuotes = !insideQuotes
                }
              } else if (char === ";" && !insideQuotes) {
                values.push(currentValue.trim())
                currentValue = ""
              } else {
                currentValue += char
              }
            }

            if (currentValue.trim()) {
              values.push(currentValue.trim())
            }

            const row: Record<string, string> = {}

            // Initialiser toutes les colonnes attendues avec des valeurs vides
            EXPECTED_COLUMNS.forEach((col) => {
              row[col] = ""
            })

            // Remplir les valeurs présentes
            headers.forEach((header, index) => {
              if (values[index] !== undefined) {
                const value = values[index].replace(/^"?|"?$/g, "")
                if (header === "ID CCU") {
                  row[header] = formatLargeNumber(value)
                } else if (header === "Création" || header === "Mise à jour") {
                  row[header] = formatDate(value)
                } else {
                  row[header] = value
                }
              }
            })

            result.push(row)
          }

          resolve(result)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = (err) => {
        reject(err)
      }

      reader.readAsArrayBuffer(file)
    })
  }

  const downloadCSV = (fileData: { fileName: string; data: any[] }) => {
    if (!fileData || fileData.data.length === 0) return

    try {
      // Utiliser l'ordre exact des colonnes attendues
      const csvContent =
        EXPECTED_COLUMNS.map((header) => `"${header}"`).join(";") +
        "\n" +
        fileData.data
          .map((row) =>
            EXPECTED_COLUMNS.map((header) => {
              const value = (row[header] ?? "").toString()
              return value.includes(";") || value.includes('"') || value.includes("\n")
                ? `"${value.replace(/"/g, '""')}"`
                : `"${value}"`
            }).join(";"),
          )
          .join("\n")

      const encoder = new TextEncoder()
      const blob = new Blob([encoder.encode(csvContent)], {
        type: "text/csv;charset=windows-1252",
      })

      const originalName = fileData.fileName
      const extension = originalName.lastIndexOf(".")
      const baseName = extension !== -1 ? originalName.substring(0, extension) : originalName
      const newFileName = `${baseName}_mapped.csv`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", newFileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors de la création du CSV:", error)
      setError(`Erreur lors de la création du fichier CSV: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const downloadAllCSV = () => {
    if (processedFiles.length === 0) return

    processedFiles.forEach((fileData) => {
      downloadCSV(fileData)
    })
  }

  const saveToDatabase = async (fileData: { fileName: string; data: any[] }) => {
    if (!fileData || fileData.data.length === 0) return

    setSavingToDb((prev) => ({ ...prev, [fileData.fileName]: true }))
    try {
      await sendFileDataToAPI(fileData)
      setSavedFiles((prev) => [...prev, fileData.fileName])
    } catch (error) {
      console.error("Erreur lors de l'enregistrement en base de données:", error)
      setError(
        `Erreur lors de l'enregistrement en base de données: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setSavingToDb((prev) => ({ ...prev, [fileData.fileName]: false }))
    }
  }

  const saveAllToDatabase = async () => {
    if (processedFiles.length === 0) return

    for (const fileData of processedFiles) {
      if (!savedFiles.includes(fileData.fileName)) {
        await saveToDatabase(fileData)
      }
    }
  }

  const clearAll = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
    setProcessedFiles([])
    setValidationErrors([])
    setError(null)
    setActiveTab("upload")
    setSavedFiles([])
  }

  const isFileSaved = (fileName: string) => {
    return savedFiles.includes(fileName)
  }

  return (
    <div>
      <div className="space-y-6 mx-auto">
        <Card className="border-t-4 border-t-indigo-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <FileCog className="h-6 w-6 text-indigo-500" />
              Transformation et chargement de données
            </CardTitle>
            <CardDescription className="text-indigo-500">
              Importez vos fichiers Excel ou CSV pour les convertir au format standardisé et les charger en base de données
            </CardDescription>

          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-indigo-50">
                <TabsTrigger
                  value="upload"
                  disabled={processing}
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <UploadCloudIcon className="h-4 w-4 mr-2" />
                  Importation
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  disabled={processedFiles.length === 0 && !processing}
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Résultats
                </TabsTrigger>
                <TabsTrigger
                  value="database"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Base de données
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloudIcon
                    className={`mx-auto h-16 w-16 mb-4 ${isDragActive ? "text-indigo-500" : "text-indigo-300"}`}
                  />
                  <h3 className="text-lg font-medium mb-2 text-indigo-700">
                    {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez vos fichiers Excel ou CSV"}
                  </h3>
                  <p className="text-sm text-indigo-500 mb-4">ou cliquez pour sélectionner des fichiers</p>
                  <Button
                    variant="outline"
                    type="button"
                    className="bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-300"
                  >
                    Sélectionner des fichiers
                  </Button>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-indigo-700">Fichiers sélectionnés</h3>
                      <Badge variant="outline" className="font-normal bg-indigo-100 text-indigo-700 border-indigo-200">
                        {files.length} {files.length > 1 ? "fichiers" : "fichier"}
                      </Badge>
                    </div>

                    <ScrollArea className="h-[200px] rounded-md border border-indigo-100">
                      <div className="p-4 grid gap-2">
                        {files.map((file, index) => {
                          const fileType = getFileTypeInfo(file.file.name)
                          const FileTypeIcon = fileType.icon

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white rounded-md hover:bg-indigo-50/50 transition-colors border border-indigo-100/50"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-md ${fileType.color}`}>
                                  <FileTypeIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium truncate max-w-[300px] block text-gray-800">
                                    {file.file.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{(file.file.size / 1024).toFixed(1)} KB</span>
                                    <Badge variant="outline" className={`text-xs py-0 h-5 ${fileType.color}`}>
                                      {fileType.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeFile(index)}
                                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Supprimer</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={clearAll}
                        disabled={processing}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XIcon className="h-4 w-4 mr-2" />
                        Tout effacer
                      </Button>
                      <Button
                        onClick={processFiles}
                        disabled={processing || files.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {processing ? (
                          <>
                            <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <ArrowRightIcon className="h-4 w-4 mr-2" />
                            Traiter les fichiers
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {processing && (
                  <div className="space-y-2 mt-4 p-4 border rounded-md bg-indigo-50 border-indigo-100">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <InfoIcon className="h-4 w-4 mr-2 text-indigo-500 animate-pulse" />
                        <span className="text-indigo-700">{processingStatus}</span>
                      </span>
                      <span className="font-medium text-indigo-700">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" indicatorclassname="bg-indigo-500" />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-700">
                    <AlertCircleIcon className="h-4 w-4 mr-2 text-red-500" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {processedFiles && processedFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-indigo-700">Fichiers traités</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="font-normal bg-green-100 text-green-700 border-green-200">
                          {processedFiles.length} {processedFiles.length > 1 ? "fichiers" : "fichier"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadAllCSV}
                          className="h-8 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                        >
                          <DownloadIcon className="h-3.5 w-3.5 mr-1" />
                          Tout télécharger
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveAllToDatabase}
                          className="h-8 bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                          <SaveIcon className="h-3.5 w-3.5 mr-1" />
                          Tout enregistrer en BDD
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {processedFiles.map((fileData, index) => {
                        const fileType = getFileTypeInfo(fileData.fileName)
                        const FileTypeIcon = fileType.icon
                        const isSaved = isFileSaved(fileData.fileName)
                        const isSaving = savingToDb[fileData.fileName]

                        return (
                          <Card key={index} className="overflow-hidden border-indigo-100 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-md ${fileType.color}`}>
                                    <FileTypeIcon className="h-4 w-4" />
                                  </div>
                                  <h4 className="font-medium text-sm text-indigo-700">{fileData.fileName}</h4>
                                  <Badge className="bg-green-100 text-green-700 border-none">
                                    {fileData.data.length} lignes
                                  </Badge>
                                  {isSaved && (
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none">
                                      <DatabaseIcon className="h-3 w-3 mr-1" />
                                      Enregistré en BDD
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => downloadCSV(fileData)}
                                          className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                                        >
                                          <DownloadIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          Télécharger {fileData.fileName.substring(0, fileData.fileName.lastIndexOf("."))}
                                          _mapped.csv
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  {!isSaved && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => saveToDatabase(fileData)}
                                            disabled={isSaving}
                                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                                          >
                                            {isSaving ? (
                                              <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <SaveIcon className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Enregistrer en base de données</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="p-4">
                                <DataPreview data={fileData.data.slice(0, 5)} />
                                <p className="text-xs text-indigo-500 mt-2 flex items-center">
                                  <InfoIcon className="h-3 w-3 mr-1" />
                                  Aperçu des 5 premières lignes sur {fileData.data.length} au total.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <CardFooter className="flex justify-end gap-2 mt-4 pt-4 border-t border-indigo-100">
                      <Button
                        variant="outline"
                        onClick={clearAll}
                        className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Nouvelle importation
                      </Button>
                    </CardFooter>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="mt-4">
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                      <AlertCircleIcon className="h-4 w-4 mr-2 text-red-500" />
                      <AlertDescription>
                        Des erreurs ont été détectées dans certains fichiers. Veuillez vérifier le format et réessayer.
                      </AlertDescription>
                    </Alert>

                    <div className="mt-2 space-y-2">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="p-3 border border-red-200 rounded-md bg-red-50">
                          <p className="font-medium text-sm text-red-700">{error.fileName}</p>
                          <ul className="mt-1 text-xs space-y-1">
                            {error.errors.map((err, i) => (
                              <li key={i} className="text-red-600">
                                • {err.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="database" className="space-y-6">
                <DatabaseView />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div
    className =
      "fixed bottom-8 right-8" >
      
        <TooltipProvider>
     
          <Tooltip>
            
            <TooltipTrigger asChild>
              <a
                href="/analyse"
                className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
              >
                <div className="relative">
                  <BarChartIcon className="h-6 w-6" />
                </div>
              </a>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Aller à l'analyse des données</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      
      </div>
    </div>
  )
}

