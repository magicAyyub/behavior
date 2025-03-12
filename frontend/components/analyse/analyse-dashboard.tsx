"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartIcon, PieChartIcon, TableIcon, CalendarIcon } from "lucide-react"
import { AnalyseFilters } from "./analyse-filters"
import { DataTable } from "./data-table"
import { TimeSeriesChart } from "./time-series-chart"
import { DistributionChart } from "./distribution-chart"
import { StatCards } from "./stat-cards"
import { getFileDataFromAPI, getUniqueFilesFromAPI, type FileDataResponse } from "../api-service"

export function AnalyseDashboard() {
  const [data, setData] = useState<FileDataResponse[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("apercu")

  // Filtres
  const [selectedFile, setSelectedFile] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [groupBy, setGroupBy] = useState<string>("jour")

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // Charger la liste des fichiers
        const filesData = await getUniqueFilesFromAPI()
        setFiles(filesData)

        // Charger les données
        const result = await getFileDataFromAPI()
        setData(result)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Appliquer les filtres
  const applyFilters = async () => {
    setLoading(true)
    try {
      const result = await getFileDataFromAPI(searchTerm, selectedFile === "all" ? undefined : selectedFile)

      // Filtrer par date si nécessaire
      let filteredData = result
      if (dateRange.from || dateRange.to) {
        filteredData = result.filter((item) => {
          const itemDate = new Date(item.creation)

          if (dateRange.from && dateRange.to) {
            return itemDate >= dateRange.from && itemDate <= dateRange.to
          } else if (dateRange.from) {
            return itemDate >= dateRange.from
          } else if (dateRange.to) {
            return itemDate <= dateRange.to
          }

          return true
        })
      }

      setData(filteredData)
    } catch (err) {
      setError("Erreur lors de l'application des filtres")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedFile("all")
    setDateRange({})
    setSearchTerm("")
    setGroupBy("jour")

    // Recharger les données
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await getFileDataFromAPI()
        setData(result)
      } catch (err) {
        setError("Erreur lors du chargement des données")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-indigo-500 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <BarChartIcon className="h-6 w-6 text-indigo-500" />
            Analyse et Restitution des Données
          </CardTitle>
          <CardDescription className="text-indigo-500">
            Explorez, filtrez et analysez les données importées
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Filtres */}
          <AnalyseFilters
            files={files}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            dateRange={dateRange}
            setDateRange={setDateRange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            loading={loading}
          />

          {/* Statistiques générales */}
          <StatCards data={data} loading={loading} />

          {/* Onglets d'analyse */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-indigo-50">
              <TabsTrigger value="apercu" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <TableIcon className="h-4 w-4 mr-2" />
                Aperçu des données
              </TabsTrigger>
              <TabsTrigger
                value="evolution"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Évolution temporelle
              </TabsTrigger>
              <TabsTrigger
                value="distribution"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <PieChartIcon className="h-4 w-4 mr-2" />
                Distribution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apercu" className="space-y-4">
              <DataTable data={data} loading={loading} />
            </TabsContent>

            <TabsContent value="evolution" className="space-y-4">
              <TimeSeriesChart data={data} groupBy={groupBy} loading={loading} />
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <DistributionChart data={data} loading={loading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

