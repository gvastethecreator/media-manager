'use client'

import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { animate, stagger, spring } from "motion"
import { FileItem } from '@/components/file-view/file-view'
import { cn } from "@/lib/utils"

type RightPanelProps = {
  selectedItem: FileItem | null
  isSettingsOpen: boolean
  onCloseSettings: () => void
  activeSettingsTab: string
  onTabChange: (value: string) => void
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="metadata-item bg-muted/30 p-2 rounded-md">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <p className="text-xs break-words">{value}</p>
    </div>
  )
}

function calculateFolderSize(folder: FileItem): string {
  if (!folder.children) return '0 B'
  const totalBytes = folder.children.reduce((acc, item) => {
    if (item.type === 'folder') {
      return acc + parseInt(calculateFolderSize(item))
    }
    return acc + parseInt(item.size)
  }, 0)
  return formatBytes(totalBytes)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function RightPanel({
  selectedItem,
  isSettingsOpen,
  onCloseSettings,
  activeSettingsTab,
  onTabChange
}: RightPanelProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)

  React.useEffect(() => {
    animate(
      ".metadata-item",
      { opacity: [0, 1], y: [10, 0] },
      { delay: stagger(0.05), duration: 0.3, easing: spring() }
    )
  }, [selectedItem])

  if (!selectedItem) {
    return (
      <div className="flex flex-col h-full border-l items-center justify-center text-muted-foreground">
        No hay ningún elemento seleccionado
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-l w-80">
      {selectedItem.type === 'image' && (
        <div className="p-4">
          <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
            <DialogTrigger asChild>
              <div className="aspect-square w-full rounded-lg bg-muted/50 overflow-hidden cursor-pointer">
                <img
                  src={selectedItem.thumbnail}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <img
                src={selectedItem.thumbnail}
                alt={selectedItem.name}
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {selectedItem.type === 'folder' && selectedItem.children && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {selectedItem.children.slice(0, 9).map((item, index) => (
              <div key={index} className="aspect-square rounded-lg bg-muted/50 overflow-hidden">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              {selectedItem.type === 'image' && (
                <>
                  <MetadataItem label="Cámara" value="Canon EOS R5" />
                  <MetadataItem label="Lente" value="RF 24-70mm f/2.8L IS USM" />
                  <MetadataItem label="Distancia focal" value="50mm" />
                  <MetadataItem label="Apertura" value="f/4.0" />
                  <MetadataItem label="Velocidad" value="1/250s" />
                  <MetadataItem label="ISO" value="100" />
                </>
              )}
              {selectedItem.type === 'folder' && (
                <>
                  <MetadataItem label="Propietario" value="John Doe" />
                  <MetadataItem label="Permisos" value="Lectura/Escritura" />
                  <MetadataItem label="Etiquetas" value="Vacaciones, Familia, 2023" />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}

