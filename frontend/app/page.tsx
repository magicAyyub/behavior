import { FileUploader } from "@/components/file-uploader"
import { PageHeader } from "@/components/page-header"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <PageHeader
        title="Outil de Mapping Excel"
        description="Combinez plusieurs fichiers Excel en un seul fichier CSV complet"
      />
      <FileUploader />
    </main>
  )
}

