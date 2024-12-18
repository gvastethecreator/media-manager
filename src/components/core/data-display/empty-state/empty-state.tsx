'use client'

import * as React from "react"
import { FolderIcon, TagIcon, ImageIcon, BookmarkIcon } from "lucide-react"
import { motion } from "framer-motion"

interface EmptyStateProps {
  type: 'collections' | 'folders' | 'tags' | 'files'
}

export function EmptyState({ type }: EmptyStateProps) {
  const icons = {
    collections: BookmarkIcon,
    folders: FolderIcon,
    tags: TagIcon,
    files: ImageIcon,
  }
  const Icon = icons[type]

  const messages = {
    collections: "No hay colecciones",
    folders: "No hay carpetas",
    tags: "No hay etiquetas",
    files: "No hay archivos"
  }

  const descriptions = {
    collections: "Crea una nueva colección para organizar tus imágenes",
    folders: "Agrega una carpeta para organizar tus archivos",
    tags: "Crea etiquetas para clasificar tus imágenes",
    files: "Agrega algunos archivos para empezar"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground"
    >
      <Icon className="w-12 h-12 mb-4" />
      <h3 className="text-lg font-medium mb-2">{messages[type]}</h3>
      <p className="text-sm">{descriptions[type]}</p>
    </motion.div>
  )
}