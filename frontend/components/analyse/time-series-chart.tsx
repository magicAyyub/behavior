"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FileDataResponse } from "../api-service"
import { RefreshCwIcon } from "lucide-react"
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns"
import { fr } from "date-fns/locale"

interface TimeSeriesChartProps {
  data: FileDataResponse[]
  groupBy: string
  loading: boolean
}

export function TimeSeriesChart({ data, groupBy, loading }: TimeSeriesChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [metric, setMetric] = useState<string>("count")

  useEffect(() => {
    if (loading || data.length === 0) return

    // Préparer les données pour le graphique
    const groupedData = groupDataByTime(data, groupBy)
    setChartData(groupedData)
  }, [data, groupBy, loading])

  // Fonction pour grouper les données par période
  const groupDataByTime = (data: FileDataResponse[], groupBy: string) => {
    const grouped: Record<string, { count: number; date: Date }> = {}

    data.forEach((item) => {
      if (!item.creation) return

      let date: Date
      try {
        date = typeof item.creation === "string" ? new Date(item.creation) : item.creation
      } catch (e) {
        return
      }

      if (isNaN(date.getTime())) return

      let periodStart: Date
      let periodKey: string

      switch (groupBy) {
        case "jour":
          periodStart = startOfDay(date)
          periodKey = format(periodStart, "yyyy-MM-dd")
          break
        case "semaine":
          periodStart = startOfWeek(date, { weekStartsOn: 1 })
          periodKey = format(periodStart, "yyyy-MM-dd")
          break
        case "mois":
          periodStart = startOfMonth(date)
          periodKey = format(periodStart, "yyyy-MM")
          break
        case "annee":
          periodStart = startOfYear(date)
          periodKey = format(periodStart, "yyyy")
          break
        default:
          periodStart = startOfDay(date)
          periodKey = format(periodStart, "yyyy-MM-dd")
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { count: 0, date: periodStart }
      }

      grouped[periodKey].count += 1
    })

    // Trier les données par date
    return Object.entries(grouped)
      .map(([key, value]) => ({
        period: key,
        count: value.count,
        date: value.date,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  // Fonction pour formater les étiquettes de période
  const formatPeriodLabel = (period: string, groupBy: string) => {
    try {
      switch (groupBy) {
        case "jour":
          return format(parseISO(period), "dd/MM/yyyy", { locale: fr })
        case "semaine":
          return `Sem. ${format(parseISO(period), "w yyyy", { locale: fr })}`
        case "mois":
          return format(parseISO(period + "-01"), "MMMM yyyy", { locale: fr })
        case "annee":
          return period
        default:
          return period
      }
    } catch (e) {
      return period
    }
  }

  // Calculer la hauteur maximale pour les barres
  const maxCount = Math.max(...chartData.map((d) => d.count), 0)

  // Générer les barres du graphique
  const renderBars = () => {
    if (chartData.length === 0) return null

    return (
      <div className="flex items-end h-64 gap-1 mt-4">
        {chartData.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <div
              className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-all cursor-pointer relative group"
              style={{
                height: `${(d.count / maxCount) * 100}%`,
                minHeight: d.count > 0 ? "8px" : "0",
              }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-indigo-700 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.count} entrées
              </div>
            </div>
            <div className="text-xs mt-1 text-indigo-700 truncate w-full text-center">
              {formatPeriodLabel(d.period, groupBy)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-indigo-700">Évolution temporelle</CardTitle>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[180px] border-indigo-200">
              <SelectValue placeholder="Métrique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Nombre d'entrées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-4 text-indigo-500">Chargement des données...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          </div>
        ) : (
          <>
            {renderBars()}
            <div className="mt-4 text-xs text-center text-indigo-600">
              Groupé par{" "}
              {groupBy === "jour" ? "jour" : groupBy === "semaine" ? "semaine" : groupBy === "mois" ? "mois" : "année"}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

