"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { FileDataResponse } from "../api-service"
import { FileIcon, ClockIcon, DatabaseIcon, UsersIcon } from "lucide-react"

interface StatCardsProps {
  data: FileDataResponse[]
  loading: boolean
  statsData?: any
}

export function StatCards({ data, loading, statsData }: StatCardsProps) {
  // Utiliser les statistiques de l'API si disponibles, sinon calculer à partir des données locales
  const totalEntries = statsData?.total_entries || data.length
  const uniqueFiles = statsData?.unique_files || new Set(data.map((item) => item.file_name)).size
  const latestEntry =
    statsData?.latest_entry ||
    (data.length > 0 && data[0].creation
      ? new Date(
          Math.max(...data.filter((item): item is typeof item & { creation: string } => Boolean(item.creation)).map((item) => new Date(item.creation).getTime())),
        ).toLocaleDateString()
      : "(vide)")
  const uniqueSources = statsData?.unique_sources || new Set(data.map((item) => item.source).filter(Boolean)).size

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
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-bounce mx-0.5">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
                </span>
              ) : (
                totalEntries.toLocaleString()
              )}
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
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-bounce mx-0.5">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
                </span>
              ) : (
                uniqueFiles.toLocaleString()
              )}
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
            <h3 className="text-xl font-bold text-blue-700">
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-bounce mx-0.5">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
                </span>
              ) : (
                latestEntry
              )}
            </h3>
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
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-bounce mx-0.5">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                  <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
                </span>
              ) : (
                uniqueSources.toLocaleString()
              )}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

