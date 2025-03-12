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

// Récupérer les données depuis l'API avec filtrage optionnel
export const getFileDataFromAPI = async (
  search?: string,
  fileName?: string,
  skip = 0,
  limit = 100,
): Promise<FileDataResponse[]> => {
  try {
    let url = `${API_BASE_URL}file-data/?skip=${skip}&limit=${limit}`

    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    if (fileName) {
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

