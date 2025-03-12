"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AggregatedDataPoint } from "../api-service"
import { RefreshCwIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface TimeSeriesChartProps {
  data: AggregatedDataPoint[]
  groupBy: string
  loading: boolean
}

export function TimeSeriesChart({ data, groupBy, loading }: TimeSeriesChartProps) {
  const [metric, setMetric] = useState<string>("count")

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
  const maxCount = Math.max(...data.map((d) => d.count), 0)

  // Générer les barres du graphique
  const renderBars = () => {
    if (data.length === 0) return null

    return (
      <div className="flex items-end h-64 gap-1 mt-4">
        {data.map((d, i) => (
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
        ) : data.length === 0 ? (
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

