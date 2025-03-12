"use client"

import type { Dispatch, SetStateAction } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FilterIcon, SearchIcon, RefreshCwIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AnalyseFiltersProps {
  files: string[]
  selectedFile: string
  setSelectedFile: Dispatch<SetStateAction<string>>
  dateRange: { from?: Date; to?: Date }
  setDateRange: Dispatch<SetStateAction<{ from?: Date; to?: Date }>>
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  groupBy: string
  setGroupBy: Dispatch<SetStateAction<string>>
  applyFilters: () => void
  resetFilters: () => void
  loading: boolean
}

// Update the filters layout to prevent overlap
export function AnalyseFilters({
  files,
  selectedFile,
  setSelectedFile,
  dateRange,
  setDateRange,
  searchTerm,
  setSearchTerm,
  groupBy,
  setGroupBy,
  applyFilters,
  resetFilters,
  loading,
}: AnalyseFiltersProps) {
  return (
    <Card className="bg-indigo-50/50 border-indigo-100">
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* First row: File and Period selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File selection */}
            <div>
              <label className="text-sm font-medium text-indigo-700 mb-1 block">Fichier</label>
              <Select value={selectedFile} onValueChange={setSelectedFile}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Tous les fichiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fichiers</SelectItem>
                  {files.map((file) => (
                    <SelectItem key={file} value={file}>
                      {file}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period selection */}
            <div>
              <label className="text-sm font-medium text-indigo-700 mb-1 block">Période</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-indigo-200",
                        !dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : "Date début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-indigo-200",
                        !dateRange.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Second row: Search and Group by */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-indigo-700 mb-1 block">Recherche</label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-indigo-500" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-indigo-200 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Group by */}
            <div>
              <label className="text-sm font-medium text-indigo-700 mb-1 block">Grouper par</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Grouper par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                  <SelectItem value="annee">Année</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={loading}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button onClick={applyFilters} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Appliquer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

