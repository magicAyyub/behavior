// Service pour interagir avec l'API backend

const API_BASE_URL = "http://localhost:8000/api/"

export interface FileDataItem {
  reference?: string
  id_lin?: string
  id_ccu?: string
  etat?: string
  creation?: string
  mise_a_jour?: string
  idrh?: string
  device_id?: string
  retour_metier?: string
  commentaires_cloture?: string
  nom_bureau_poste?: string
  regate?: string
  source?: string
  solution_scan?: string
  rg?: string
  ruo?: string
  file_name: string
}

export interface FileDataResponse extends FileDataItem {
  id: number
  import_date: string
}

export interface PaginatedResponse {
  items: FileDataResponse[]
  total: number
  page: number
  pages: number
}

// Convertir les noms de colonnes du frontend vers le backend
const mapColumnNames = (data: any, fileName: string): FileDataItem => {
  return {
    reference: data["Référence"],
    id_lin: data["ID LIN"],
    id_ccu: data["ID CCU"],
    etat: data["Etat"],
    creation: data["Création"],
    mise_a_jour: data["Mise à jour"],
    idrh: data["IDRH"],
    device_id: data["Device Id"],
    retour_metier: data["Retour métier"],
    commentaires_cloture: data["Commentaires cloture"],
    nom_bureau_poste: data["Nom bureau de poste"],
    regate: data["Regate"],
    source: data["Source"],
    solution_scan: data["Solution scan"],
    rg: data["RG"],
    ruo: data["RUO"],
    file_name: fileName,
  }
}

// Envoyer les données d'un fichier à l'API
export const sendFileDataToAPI = async (fileData: { fileName: string; data: any[] }): Promise<FileDataResponse[]> => {
  try {
    const mappedData = fileData.data.map((item) => mapColumnNames(item, fileData.fileName))

    const response = await fetch(`${API_BASE_URL}file-data/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: mappedData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de l'envoi des données")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de l'envoi des données:", error)
    throw error
  }
}

// Récupérer les données depuis l'API avec filtrage optionnel et pagination
export const getFileDataFromAPI = async (
  search?: string,
  fileName?: string,
  page = 1,
  pageSize = 100,
  dateFrom?: string,
  dateTo?: string,
): Promise<PaginatedResponse> => {
  try {
    const skip = (page - 1) * pageSize
    let url = `${API_BASE_URL}file-data/?skip=${skip}&limit=${pageSize}`

    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    if (fileName && fileName !== "all") {
      url += `&file_name=${encodeURIComponent(fileName)}`
    }

    if (dateFrom) {
      url += `&date_from=${encodeURIComponent(dateFrom)}`
    }

    if (dateTo) {
      url += `&date_to=${encodeURIComponent(dateTo)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la récupération des données")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error)
    throw error
  }
}

// Récupérer la liste des fichiers uniques dans la base
export const getUniqueFilesFromAPI = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}file-data/files`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la récupération des fichiers")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error)
    throw error
  }
}

// Supprimer les données d'un fichier
export const deleteFileDataFromAPI = async (fileName: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}file-data/${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la suppression des données")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la suppression des données:", error)
    throw error
  }
}

// Interface pour les données agrégées
export interface AggregatedDataPoint {
  period: string
  count: number
  data: any[]
}

export interface FilterParams {
  search?: string
  fileName?: string
  dateFrom?: string
  dateTo?: string
  groupBy?: "jour" | "semaine" | "mois" | "annee"
}

// Interface pour les données de distribution
export interface DistributionDataPoint {
  label: string
  count: number
  percentage: number
}

// Nouvelles fonctions API pour l'analyse
export const getAggregatedData = async (params: FilterParams): Promise<AggregatedDataPoint[]> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.groupBy) queryParams.append("group_by", params.groupBy)
    if (params.search) queryParams.append("search", params.search)
    if (params.fileName && params.fileName !== "all") queryParams.append("file_name", params.fileName)
    if (params.dateFrom) queryParams.append("date_from", params.dateFrom)
    if (params.dateTo) queryParams.append("date_to", params.dateTo)

    const response = await fetch(`${API_BASE_URL}file-data/aggregate?${queryParams}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la récupération des données agrégées")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des données agrégées:", error)
    throw error
  }
}

export const getDistributionData = async (field: string, params: FilterParams): Promise<DistributionDataPoint[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append("field", field)

    if (params.search) queryParams.append("search", params.search)
    if (params.fileName && params.fileName !== "all") queryParams.append("file_name", params.fileName)
    if (params.dateFrom) queryParams.append("date_from", params.dateFrom)
    if (params.dateTo) queryParams.append("date_to", params.dateTo)

    const response = await fetch(`${API_BASE_URL}file-data/distribution?${queryParams}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la récupération de la distribution")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération de la distribution:", error)
    return [] // Retourner un tableau vide en cas d'erreur pour éviter les erreurs d'affichage
  }
}

export const getStatsData = async (params: FilterParams): Promise<any> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.search) queryParams.append("search", params.search)
    if (params.fileName && params.fileName !== "all") queryParams.append("file_name", params.fileName)
    if (params.dateFrom) queryParams.append("date_from", params.dateFrom)
    if (params.dateTo) queryParams.append("date_to", params.dateTo)

    const response = await fetch(`${API_BASE_URL}file-data/stats?${queryParams}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de la récupération des statistiques")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      total_entries: 0,
      unique_files: 0,
      latest_entry: null,
      unique_sources: 0,
    }
  }
}

// Nouvelle fonction pour exporter toutes les données
export const exportAllDataToCSV = async (params: FilterParams): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.search) queryParams.append("search", params.search)
    if (params.fileName && params.fileName !== "all") queryParams.append("file_name", params.fileName)
    if (params.dateFrom) queryParams.append("date_from", params.dateFrom)
    if (params.dateTo) queryParams.append("date_to", params.dateTo)

    const response = await fetch(`${API_BASE_URL}file-data/export?${queryParams}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Erreur lors de l'export des données")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error)
    throw error
  }
}

