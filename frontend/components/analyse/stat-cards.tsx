import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { FileDataResponse } from "../api-service"
import { FileIcon, ClockIcon, DatabaseIcon, UsersIcon, InfoIcon, SearchIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StatCardsProps {
  data: FileDataResponse[]
  loading: boolean
  statsData?: any
}

export function StatCards({ data, loading, statsData }: StatCardsProps) {
  // Utiliser les statistiques de l'API si disponibles, sinon calculer à partir des données locales
  const totalEntries = statsData?.total_entries ?? 0
  const uniqueFiles = statsData?.unique_files ?? 0
  const latestEntry = statsData?.latest_entry || "-"
  const uniqueSources = statsData?.unique_sources ?? 0

  // Fonction pour afficher le contenu des cartes en fonction de l'état de chargement
  const renderCardContent = (value: any, loadingState: boolean, icon?: React.ReactNode) => {
    if (loadingState) {
      return (
        <span className="inline-flex items-center">
          <span className="animate-bounce mx-0.5">.</span>
          <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
          <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
        </span>
      )
    }

    if (value === 0 || value === null || value === "-") {
      return (
        <div className="flex items-center text-gray-400 text-lg">
          {icon || <SearchIcon className="h-4 w-4 mr-2 opacity-70" />}
          <span className="italic">Aucun résultat</span>
        </div>
      )
    }

    return typeof value === "number" ? value.toLocaleString() : value
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        className={`border-indigo-100 transition-all duration-300 ${totalEntries === 0 ? "bg-gray-50" : "bg-white"}`}
      >
        <CardContent className="p-4 flex items-center space-x-4">
          <div className={`p-2 rounded-full transition-colors ${totalEntries === 0 ? "bg-gray-200" : "bg-indigo-100"}`}>
            <DatabaseIcon className={`h-5 w-5 ${totalEntries === 0 ? "text-gray-400" : "text-indigo-600"}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${totalEntries === 0 ? "text-gray-500" : "text-indigo-600"}`}>
              Total des entrées
            </p>
            <h3 className={`text-2xl font-bold ${totalEntries === 0 ? "text-gray-400" : "text-indigo-700"}`}>
              {renderCardContent(totalEntries, loading)}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`border-indigo-100 transition-all duration-300 ${uniqueFiles === 0 ? "bg-gray-50" : "bg-white"}`}
      >
        <CardContent className="p-4 flex items-center space-x-4">
          <div className={`p-2 rounded-full transition-colors ${uniqueFiles === 0 ? "bg-gray-200" : "bg-purple-100"}`}>
            <FileIcon className={`h-5 w-5 ${uniqueFiles === 0 ? "text-gray-400" : "text-purple-600"}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${uniqueFiles === 0 ? "text-gray-500" : "text-purple-600"}`}>
              Fichiers uniques
            </p>
            <h3 className={`text-2xl font-bold ${uniqueFiles === 0 ? "text-gray-400" : "text-purple-700"}`}>
              {renderCardContent(uniqueFiles, loading)}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`border-indigo-100 transition-all duration-300 ${latestEntry === "-" || latestEntry === null ? "bg-gray-50" : "bg-white"}`}
      >
        <CardContent className="p-4 flex items-center space-x-4">
          <div
            className={`p-2 rounded-full transition-colors ${latestEntry === "-" || latestEntry === null ? "bg-gray-200" : "bg-blue-100"}`}
          >
            <ClockIcon
              className={`h-5 w-5 ${latestEntry === "-" || latestEntry === null ? "text-gray-400" : "text-blue-600"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-medium ${latestEntry === "-" || latestEntry === null ? "text-gray-500" : "text-blue-600"}`}
            >
              Dernière entrée
            </p>
            <h3
              className={`text-xl font-bold ${latestEntry === "-" || latestEntry === null ? "text-gray-400" : "text-blue-700"}`}
            >
              {renderCardContent(latestEntry, loading)}
            </h3>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`border-indigo-100 transition-all duration-300 ${uniqueSources === 0 ? "bg-gray-50" : "bg-white"}`}
      >
        <CardContent className="p-4 flex items-center space-x-4">
          <div
            className={`p-2 rounded-full transition-colors ${uniqueSources === 0 ? "bg-gray-200" : "bg-emerald-100"}`}
          >
            <UsersIcon className={`h-5 w-5 ${uniqueSources === 0 ? "text-gray-400" : "text-emerald-600"}`} />
          </div>
          <div>
            <div className="flex items-center">
              <span className={`text-sm font-medium ${uniqueSources === 0 ? "text-gray-500" : "text-emerald-600"}`}>
                Sources uniques
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon
                      className={`h-3.5 w-3.5 ml-1 cursor-help ${uniqueSources === 0 ? "text-gray-400" : "text-emerald-500"}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="text-xs max-w-xs">
                      La source indique l'origine des données (ex: système, département)
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className={`text-2xl font-bold ${uniqueSources === 0 ? "text-gray-400" : "text-emerald-700"}`}>
              {renderCardContent(uniqueSources, loading)}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

