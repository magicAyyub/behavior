"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { FileDataResponse } from "../api-service"
import { FileIcon, ClockIcon, DatabaseIcon, UsersIcon } from "lucide-react"

interface StatCardsProps {
  data: FileDataResponse[]
  loading: boolean
}

export function StatCards({ data, loading }: StatCardsProps) {
  const [stats, setStats] = useState({
    totalEntries: 0,
    uniqueFiles: 0,
    latestEntry: "",
    uniqueSources: 0,
  })

  useEffect(() => {
    if (loading || data.length === 0) return

    // Calculer les statistiques
    const uniqueFiles = new Set(data.map((item) => item.file_name)).size
    const uniqueSources = new Set(data.map((item) => item.source).filter(Boolean)).size

    // Trouver la date la plus récente
    let latestDate = new Date(0)
    data.forEach((item) => {
      if (item.creation) {
        const date = new Date(item.creation)
        if (!isNaN(date.getTime()) && date > latestDate) {
          latestDate = date
        }
      }
    })

    setStats({
      totalEntries: data.length,
      uniqueFiles,
      latestEntry: latestDate.getTime() > 0 ? latestDate.toLocaleDateString() : "-",
      uniqueSources,
    })
  }, [data, loading])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-indigo-100">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-indigo-100 rounded-full">
            <DatabaseIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-indigo-600 font-medium">Total des entrées</p>
            <h3 className="text-2xl font-bold text-indigo-700">
              {loading ? "..." : stats.totalEntries.toLocaleString()}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <FileIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-purple-600 font-medium">Fichiers uniques</p>
            <h3 className="text-2xl font-bold text-purple-700">
              {loading ? "..." : stats.uniqueFiles.toLocaleString()}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <ClockIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Dernière entrée</p>
            <h3 className="text-xl font-bold text-blue-700">{loading ? "..." : stats.latestEntry}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-emerald-100 rounded-full">
            <UsersIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-emerald-600 font-medium">Sources uniques</p>
            <h3 className="text-2xl font-bold text-emerald-700">
              {loading ? "..." : stats.uniqueSources.toLocaleString()}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

