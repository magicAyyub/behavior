"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataPreview } from "@/components/data-preview"

type FileWithPreview = {
  file: File
  preview: string
}

export function FileUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [combinedData, setCombinedData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
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
    setCombinedData(null)
  }

  const processFiles = async () => {
    if (files.length === 0) {
      setError("Veuillez sélectionner au moins un fichier Excel")
      return
    }

    setProcessing(true)
    setProgress(0)
    setCombinedData(null)
    setError(null)

    try {
      let allData: any[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i].file
        const data = await readExcelFile(file)
        allData = [...allData, ...data]
        setProgress(((i + 1) / files.length) * 100)
      }

      setCombinedData(allData)
    } catch (err) {
      setError(`Erreur lors du traitement des fichiers: ${err instanceof Error ? err.message : String(err)}`)
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
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          resolve(json)
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

  const downloadCSV = () => {
    if (!combinedData || combinedData.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(combinedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données Combinées")

    XLSX.writeFile(workbook, "donnees_combinees.csv", { bookType: "csv" })
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
          {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez vos fichiers Excel"}
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
            <span>Traitement en cours...</span>
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

      {combinedData && combinedData.length > 0 && (
        <div className="space-y-4">
          <DataPreview data={combinedData} />
          <div className="flex justify-end">
            <Button onClick={downloadCSV}>Télécharger le CSV</Button>
          </div>
        </div>
      )}
    </div>
  )
}

