'use client'

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { FileItem } from "./right-panel"
import { formatBytes } from "@/lib/utils"
import { ImageOff } from "lucide-react"

interface FileInfoProps {
  selectedItem: FileItem | null
}

export function FileInfo({ selectedItem }: FileInfoProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    setImageError(false)
  }, [selectedItem])

  if (!selectedItem) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        No hay ningún elemento seleccionado
      </div>
    )
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderImage = (src?: string, alt = "") => {
    if (!src || imageError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-muted/30 text-muted-foreground">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-xs">Error al cargar la imagen</span>
        </div>
      )
    }

    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform hover:scale-105"
        onError={handleImageError}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {selectedItem.type === 'image' && (
        <div className="p-4">
          <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
            <DialogTrigger asChild>
              <div className="aspect-square w-full rounded-lg bg-muted/50 overflow-hidden cursor-pointer">
                {renderImage(selectedItem.thumbnail, selectedItem.name)}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              {renderImage(selectedItem.thumbnail, selectedItem.name)}
            </DialogContent>
          </Dialog>
        </div>
      )}
      {selectedItem.type === 'folder' && selectedItem.children && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {selectedItem.children.slice(0, 9).map((item, index) => (
              <div key={index} className="aspect-square rounded-lg bg-muted/50 overflow-hidden">
                {renderImage(item.thumbnail, item.name)}
              </div>
            ))}
          </div>
        </div>
      )}
      <Separator />
      <ScrollArea className="flex-1 px-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="metadata">Metadatos</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-2 animate-in fade-in-50 duration-500">
              <MetadataItem label="Nombre" value={selectedItem.name} />
              <MetadataItem label="Tipo" value={selectedItem.type} />
              <MetadataItem label="Tamaño" value={selectedItem.size} />
              <MetadataItem label="Creado" value={new Date(selectedItem.dateCreated).toLocaleString()} />
              <MetadataItem label="Modificado" value={new Date(selectedItem.dateModified).toLocaleString()} />
              {selectedItem.type === 'image' && selectedItem.dimensions && (
                <MetadataItem label="Dimensiones" value={selectedItem.dimensions} />
              )}
              {selectedItem.type === 'folder' && selectedItem.children && (
                <>
                  <MetadataItem label="Elementos" value={selectedItem.children.length.toString()} />
                  <MetadataItem label="Tamaño total" value={calculateFolderSize(selectedItem)} />
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="metadata" className="space-y-4 py-4">
            <div className="space-y-2 animate-in fade-in-50 duration-500">
              {selectedItem.metadata ? (
                Object.entries(selectedItem.metadata).map(([key, value]) => (
                  <MetadataItem
                    key={key}
                    label={key}
                    value={Array.isArray(value) ? value.join(", ") : value?.toString() || ""}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No hay metadatos disponibles
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 p-2 rounded-md">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <p className="text-xs break-words">{value}</p>
    </div>
  )
}

function calculateFolderSize(folder: FileItem): string {
  if (!folder.children) return '0 B'
  const totalBytes = folder.children.reduce((acc, item) => {
    if (item.type === 'folder' && item.children) {
      return acc + parseInt(calculateFolderSize(item))
    }
    return acc + parseInt(item.size)
  }, 0)
  return formatBytes(totalBytes)
}