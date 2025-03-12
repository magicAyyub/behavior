"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DistributionDataPoint } from "../api-service"
import { RefreshCwIcon } from "lucide-react"

interface DistributionChartProps {
  data: DistributionDataPoint[]
  loading: boolean
}

export function DistributionChart({ data, loading }: DistributionChartProps) {
  const [distributionField, setDistributionField] = useState<string>("etat")

  // Calculer la valeur maximale pour les barres
  const maxCount = Math.max(...data.map((d) => d.count), 0)

  // Générer un dégradé de couleurs pour les barres
  const getBarColor = (index: number) => {
    const colors = [
      "bg-indigo-500",
      "bg-indigo-400",
      "bg-indigo-300",
      "bg-purple-500",
      "bg-purple-400",
      "bg-blue-500",
      "bg-blue-400",
      "bg-cyan-500",
      "bg-cyan-400",
      "bg-emerald-500",
    ]

    return colors[index % colors.length]
  }

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-indigo-700">Distribution par catégorie</CardTitle>
          <Select value={distributionField} onValueChange={setDistributionField}>
            <SelectTrigger className="w-[180px] border-indigo-200">
              <SelectValue placeholder="Champ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="etat">État</SelectItem>
              <SelectItem value="source">Source</SelectItem>
              <SelectItem value="file_name">Fichier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-4 text-indigo-500 flex items-center">
              Chargement des données
              <span className="ml-1 inline-flex loading-dots">
                <span className="animate-bounce mx-0.5">.</span>
                <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
              </span>
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {data.slice(0, 10).map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-indigo-700 truncate max-w-[70%]" title={item.label}>
                    {item.label}
                  </span>
                  <span className="text-indigo-600">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getBarColor(index)} transition-all duration-500 ease-out`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {data.length > 10 && (
              <div className="text-xs text-center text-indigo-600 mt-2">
                Affichage des 10 premières valeurs sur {data.length} au total
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

