"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { FileIcon, UploadCloudIcon, XIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataPreview } from "@/components/data-preview"

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
    const dateStr = value
    const timeStr = timeValue || ""

    // Si la date est au format "YYYY-MM-DD HH:mm:ss"
    if (typeof value === "string" && value.includes("-")) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
      }
    }

    // Si la date est au format "jour X mois YYYY"
    if (typeof value === "string" && value.toLowerCase().includes("mardi")) {
      const parts = value.split(" ")
      const day = parts[1]
      const month = getMonthNumber(parts[2])
      const year = parts[3]

      if (timeStr) {
        // Si nous avons une valeur de temps séparée, l'utiliser
        const timeParts = timeStr.split(":")
        if (timeParts.length >= 2) {
          return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${timeParts[2] || "00"}`
        }
      }

      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} 00:00:00`
    }

    // Si c'est déjà au format DD/MM/YYYY HH:mm:ss
    if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return value.includes(":") ? value : `${value}:00`
    }

    return value?.toString() || ""
  } catch (e) {
    console.warn("Erreur de conversion de date:", e)
    return value?.toString() || ""
  }
}

// Fonction utilitaire pour convertir le nom du mois en numéro
const getMonthNumber = (monthName: string): string => {
  const months: { [key: string]: string } = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  }
  return months[monthName.toLowerCase()] || "01"
}

export function FileUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [processedFiles, setProcessedFiles] = useState<Array<{ fileName: string; data: any[] }>>([])
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([])

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
    } catch (err) {
      setError(`Erreur lors du traitement des fichiers: ${err instanceof Error ? err.message : String(err)}`)
      setProcessingStatus("Une erreur est survenue")
    } finally {
      setProcessing(false)
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary", cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Obtenir toutes les colonnes présentes dans le fichier
          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
          const actualColumns: string[] = []

          // Lire l'en-tête pour obtenir les noms réels des colonnes
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })]
            if (cell && cell.v) {
              actualColumns.push(cell.v.toString().trim())
            }
          }

          // Convertir en JSON avec des options spécifiques
          const json = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            defval: "", // Valeur par défaut pour les cellules vides
          })

          // Nettoyer et formater les données
          const cleanedData = json.map((row: any) => {
            const cleanedRow: Record<string, any> = {}

            // Initialiser toutes les colonnes attendues avec des valeurs vides
            EXPECTED_COLUMNS.forEach((col) => {
              cleanedRow[col] = ""
            })

            // Traiter les données présentes
            Object.entries(row).forEach(([key, value]) => {
              const cleanKey = key.trim()

              // Gérer le cas spécial de la colonne Création avec l'heure séparée
              if (cleanKey === "Création" && typeof value === "string") {
                // Chercher une colonne d'heure potentielle
                const timeValue = row[Object.keys(row).find((k) => k.includes("heure") || k.endsWith(":")) || ""]
                cleanedRow[cleanKey] = formatDate(value, timeValue)
              }
              // Gérer les autres colonnes
              else if (EXPECTED_COLUMNS.includes(cleanKey)) {
                if (cleanKey === "ID CCU") {
                  cleanedRow[cleanKey] = formatLargeNumber(value)
                } else if (cleanKey === "Mise à jour") {
                  cleanedRow[cleanKey] = formatDate(value)
                } else {
                  cleanedRow[cleanKey] = value?.toString() || ""
                }
              }
            })

            return cleanedRow
          })

          resolve(cleanedData)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = (err) => {
        reject(err)
      }

      reader.readAsBinaryString(file)
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

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez vos fichiers Excel ou CSV"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner des fichiers</p>
        <Button variant="outline" type="button">
          Sélectionner des fichiers
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Fichiers sélectionnés ({files.length})</h3>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[300px]">{file.file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.file.size / 1024).toFixed(1)} KB</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8">
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={processFiles} disabled={processing || files.length === 0}>
              {processing ? "Traitement en cours..." : "Traiter les fichiers"}
            </Button>
          </div>
        </div>
      )}

      {processing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{processingStatus}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {processedFiles && processedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Fichiers traités ({processedFiles.length})</h3>
          <div className="grid gap-4">
            {processedFiles.map((fileData, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{fileData.fileName}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadCSV(fileData)}
                    title={`Télécharger ${fileData.fileName.substring(0, fileData.fileName.lastIndexOf("."))}_mapped.csv`}
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </div>
                <DataPreview data={fileData.data.slice(0, 5)} />
                <p className="text-sm text-muted-foreground mt-2">
                  {fileData.data.length} lignes au total. Aperçu des 5 premières lignes.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

