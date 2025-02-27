"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { FileIcon, UploadCloudIcon, XIcon, DownloadIcon, AlertTriangleIcon } from "lucide-react"
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

// Structure attendue des colonnes
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

// Fonction pour valider le format des données
const validateDataFormat = (data: any[]): FileValidationError["errors"] => {
  const errors: FileValidationError["errors"] = []

  if (data.length === 0) return errors

  const columns = Object.keys(data[0])

  // Vérifier uniquement les colonnes supplémentaires
  columns.forEach((col) => {
    if (!EXPECTED_COLUMNS.includes(col)) {
      errors.push({
        type: "extra_column",
        column: col,
        message: `Colonne supplémentaire détectée : "${col}"`,
      })
    }
  })

  return errors
}

// Fonction utilitaire pour formater les grands nombres
const formatLargeNumber = (value: any): string => {
  if (typeof value === "number") {
    // Convertir en chaîne sans notation scientifique
    return value.toLocaleString("fullwide", { useGrouping: false })
  }
  return value?.toString() || ""
}

// Fonction utilitaire pour formater les dates de manière uniforme
const formatDate = (value: any): string => {
  if (!value) return ""

  try {
    // Si c'est déjà au bon format (DD/MM/YYYY HH:mm:ss), on le garde
    if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return value
    }

    // Créer un objet Date à partir de la valeur
    const date = new Date(value)

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

// Fonction utilitaire pour formater les dates Excel
const formatExcelDate = (value: any): string => {
  // Si c'est déjà une chaîne de caractères au bon format, on la retourne
  if (typeof value === "string") {
    return formatDate(value)
  }

  // Si c'est un nombre (timestamp Excel), on le convertit
  if (typeof value === "number") {
    try {
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        const year = date.y
        const month = String(date.m).padStart(2, "0")
        const day = String(date.d).padStart(2, "0")
        const hours = String(date.H).padStart(2, "0")
        const minutes = String(date.M).padStart(2, "0")
        const seconds = String(date.S).padStart(2, "0")

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
      }
    } catch (e) {
      console.warn("Erreur de conversion de date Excel:", e)
    }
  }

  // Si la conversion Excel échoue, on essaie le formatage standard
  return formatDate(value)
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
          // Traiter le fichier selon son type
          const isCSV = file.name.toLowerCase().endsWith(".csv")
          const data = isCSV ? await readCSVFile(file) : await readExcelFile(file)

          // Validation simplifiée
          const errors = validateDataFormat(data)
          if (errors.length > 0) {
            newValidationErrors.push({
              fileName: file.name,
              errors: errors,
            })
          }

          processedData.push({
            fileName: file.name,
            data: data,
          })

          // Mettre à jour la progression
          setProgress(((i + 1) / files.length) * 100)
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
      }

      setValidationErrors(newValidationErrors)
      setProcessedFiles(processedData)
      setProcessingStatus("Traitement terminé")
      setProcessing(false)
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

          // Convertir en JSON avec des options spécifiques
          const json = XLSX.utils.sheet_to_json(worksheet, {
            raw: true, // Obtenir les valeurs brutes
            dateNF: "dd/mm/yyyy hh:mm:ss",
          })

          // Nettoyer et formater les données
          const cleanedData = json.map((row) => {
            const cleanedRow: Record<string, any> = {}

            Object.entries(row).forEach(([key, value]) => {
              // Remplacer __EMPTY par "ID LIN" si nécessaire
              const cleanKey = key === "__EMPTY" ? "ID LIN" : key

              // Appliquer le formatage approprié selon la colonne
              if (key === "Création" || key === "Mise à jour") {
                cleanedRow[cleanKey] = formatDate(value)
              } else if (key === "ID CCU") {
                cleanedRow[cleanKey] = formatLargeNumber(value)
              } else {
                cleanedRow[cleanKey] = value?.toString() || ""
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
          // Utiliser l'encodage Windows-1252 pour les caractères spéciaux
          const decoder = new TextDecoder("windows-1252")
          const arrayBuffer = e.target?.result as ArrayBuffer
          const csvText = decoder.decode(arrayBuffer)

          // Diviser par lignes en tenant compte des possibles retours à la ligne dans les champs
          const lines = csvText.split(/\r?\n/)

          // Traiter l'en-tête - enlever les guillemets et nettoyer
          const headers = lines[0].split(";").map((header) => header.trim().replace(/^"?|"?$/g, ""))

          const result = []

          // Traiter chaque ligne
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = []
            let currentValue = ""
            let insideQuotes = false

            // Parser la ligne caractère par caractère
            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j]

              if (char === '"') {
                if (insideQuotes && lines[i][j + 1] === '"') {
                  // Double guillemet à l'intérieur d'un champ entre guillemets
                  currentValue += '"'
                  j++ // Sauter le prochain guillemet
                } else {
                  // Basculer l'état "entre guillemets"
                  insideQuotes = !insideQuotes
                }
              } else if (char === ";" && !insideQuotes) {
                // Fin du champ si point-virgule hors guillemets
                values.push(currentValue.trim())
                currentValue = ""
              } else {
                currentValue += char
              }
            }

            // Ajouter le dernier champ
            if (currentValue.trim()) {
              values.push(currentValue.trim())
            }

            // Créer l'objet avec les en-têtes
            const row: Record<string, string> = {}
            headers.forEach((header, index) => {
              if (values[index] !== undefined) {
                // Nettoyer la valeur des guillemets externes
                const value = values[index].replace(/^"?|"?$/g, "")
                row[header] = value
              } else {
                row[header] = ""
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

      // Lire le fichier comme un ArrayBuffer pour gérer l'encodage
      reader.readAsArrayBuffer(file)
    })
  }

  const downloadCSV = (fileData: { fileName: string; data: any[] }) => {
    if (!fileData || fileData.data.length === 0) return

    try {
      // Obtenir les en-têtes
      const headers = Object.keys(fileData.data[0])

      // Créer le contenu CSV
      let csvContent = headers.map((header) => `"${header}"`).join(";") + "\n"

      // Ajouter chaque ligne
      fileData.data.forEach((row) => {
        const line = headers
          .map((header) => {
            // Convertir la valeur en chaîne de caractères
            const value = (row[header] ?? "").toString()
            // Entourer de guillemets si nécessaire
            return value.includes(";") || value.includes('"') || value.includes("\n")
              ? `"${value.replace(/"/g, '""')}"`
              : `"${value}"`
          })
          .join(";")
        csvContent += line + "\n"
      })

      // Créer le blob avec l'encodage Windows-1252
      const encoder = new TextEncoder()
      const blob = new Blob([encoder.encode(csvContent)], {
        type: "text/csv;charset=windows-1252",
      })

      // Créer le nom du fichier
      const originalName = fileData.fileName
      const extension = originalName.lastIndexOf(".")
      const baseName = extension !== -1 ? originalName.substring(0, extension) : originalName
      const newFileName = `${baseName}_mapped.csv`

      // Télécharger le fichier
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

      {validationErrors.length > 0 && (
        <div className="space-y-4">
          {validationErrors.map((fileError, index) => (
            <Alert key={index} variant="destructive" className="flex items-start gap-4">
              <AlertTriangleIcon className="h-5 w-5 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="font-medium">Problèmes détectés dans {fileError.fileName}</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {fileError.errors.map((error, errorIndex) => (
                    <li key={errorIndex} className="text-sm">
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          ))}
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

