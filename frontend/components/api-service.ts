// Service pour interagir avec l'API backend
/*
Pour l'instant ce qu'on fait c'est de la réecriture d'url. C'est à dire que toute url qui commence par /api/ sera redirigée vers le backend.
Ce qui fait que j'ai ${API_BASE_URL}file-data/ au lieu de ${API_BASE_URL}/file-data/ et ça va rediriger vers http://localhost:8000/api/file-data/
Pour un déploiement en production, il faudra changer la valeur de API_BASE_URL pour pointer vers l'URL du backend et mettre un / à la fin de l'url
ou alors ajouter un / après ${API_BASE_URL} dans les appels à fetch.
*/

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
    throw error
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
    throw error
  }
}

