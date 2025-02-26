import { FileUploader } from "@/components/file-uploader"
import { PageHeader } from "@/components/page-header"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <PageHeader
        title="Outil de Mapping Excel et CSV"
        description="Traitez vos fichiers Excel et CSV pour obtenir des fichiers CSV propres et formatés"
      />
      <FileUploader />
    </main>
  )
}

