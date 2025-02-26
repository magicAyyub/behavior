import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Mettre à jour les métadonnées
export const metadata: Metadata = {
  title: "Outil de Mapping Excel et CSV",
  description: "Traitez vos fichiers Excel et CSV pour obtenir des fichiers CSV propres et formatés",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

