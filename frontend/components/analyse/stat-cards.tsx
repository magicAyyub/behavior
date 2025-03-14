import { Card, CardContent } from "@/components/ui/card"
import type { FileDataResponse } from "../api-service"
import { FileIcon, ClockIcon, DatabaseIcon, UsersIcon, RefreshCwIcon, InfoIcon } from 'lucide-react'
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
  const renderCardContent = (value: any, loadingState: boolean) => {
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
      return "(RAS)"
    }
    
    return typeof value === "number" ? value.toLocaleString() : value
  }

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
              {renderCardContent(totalEntries, loading)}
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
              {renderCardContent(uniqueFiles, loading)}
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
              {renderCardContent(latestEntry, loading)}
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
            <div className="flex items-center">
              <span className="text-sm text-emerald-600 font-medium">Sources uniques</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3.5 w-3.5 ml-1 text-emerald-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="text-xs max-w-xs">La source indique l'origine des données (ex: système, département)</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className="text-2xl font-bold text-emerald-700">
              {renderCardContent(uniqueSources, loading)}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

