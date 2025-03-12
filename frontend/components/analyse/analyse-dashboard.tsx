"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChartIcon, PieChartIcon, TableIcon, CalendarIcon, ArrowLeftIcon } from "lucide-react"
import { AnalyseFilters } from "./analyse-filters"
import { DataTable } from "./data-table"
import { TimeSeriesChart } from "./time-series-chart"
import { DistributionChart } from "./distribution-chart"
import { StatCards } from "./stat-cards"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  getFileDataFromAPI,
  getUniqueFilesFromAPI,
  getAggregatedData,
  getDistributionData,
  getStatsData,
  type FileDataResponse,
  type FilterParams,
} from "../api-service"

export function AnalyseDashboard() {
  const [data, setData] = useState<FileDataResponse[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("apercu")
  const router = useRouter()

  // Filtres
  const [selectedFile, setSelectedFile] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [groupBy, setGroupBy] = useState<string>("jour")

  // Données d'analyse
  const [aggregatedData, setAggregatedData] = useState<any[]>([])
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [statsData, setStatsData] = useState<any>(null)

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // Charger la liste des fichiers
        const filesData = await getUniqueFilesFromAPI()
        setFiles(filesData)

        // Charger un aperçu des données (juste la première page)
        const result = await getFileDataFromAPI("", undefined, 1, 10)
        setData(result.items)

        // Charger les données agrégées initiales
        await loadAnalysisData()
      } catch (err) {
        setError("Erreur lors du chargement des données")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Charger les données d'analyse
  const loadAnalysisData = async () => {
    setLoading(true)
    try {
      const params: FilterParams = {
        search: searchTerm,
        fileName: selectedFile === "all" ? undefined : selectedFile,
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        groupBy: groupBy as "jour" | "semaine" | "mois" | "annee",
      }

      // Charger les données agrégées
      const aggregated = await getAggregatedData(params)
      setAggregatedData(aggregated)

      // Charger les données de distribution
      const distribution = await getDistributionData("etat", params)
      setDistributionData(distribution)

      // Charger les statistiques
      const stats = await getStatsData(params)
      setStatsData(stats)
    } catch (err) {
      setError("Erreur lors du chargement des données d'analyse")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Appliquer les filtres
  const applyFilters = async () => {
    await loadAnalysisData()
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
        const result = await getFileDataFromAPI("", undefined, 1, 10)
        setData(result.items)
        await loadAnalysisData()
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <BarChartIcon className="h-6 w-6 text-indigo-500" />
                Analyse et Restitution des Données
              </CardTitle>
              <CardDescription className="text-indigo-500">
                Explorez, filtrez et analysez les données importées
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
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
          <StatCards data={data} loading={loading} statsData={statsData} />

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
              <DataTable
                data={data}
                loading={loading}
                searchTerm={searchTerm}
                selectedFile={selectedFile}
                dateRange={dateRange}
              />
            </TabsContent>

            <TabsContent value="evolution" className="space-y-4">
              <TimeSeriesChart data={aggregatedData} groupBy={groupBy} loading={loading} />
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <DistributionChart data={distributionData} loading={loading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

