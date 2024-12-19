'use client'

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { FileItem } from '@/store/files'
import { formatFileSize } from "@/lib/utils"
import { ImageOff, Calendar, FileText, Hash, Tag, Info, ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FileInfoProps {
  selectedItem: FileItem | null
}

export function FileInfo({ selectedItem }: FileInfoProps) {
  const [activeTab, setActiveTab] = React.useState('info')
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    setImageError(false)
  }, [selectedItem])

  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sin selección
            </CardTitle>
            <CardDescription>
              Selecciona un archivo para ver su información
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
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
        onError={() => setImageError(true)}
      />
    )
  }

  const renderInfoItem = (label: string, value: string | number) => (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="font-mono">{value}</Badge>
    </div>
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Metadatos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {(selectedItem.type === 'image' || selectedItem.mimeType?.startsWith('image/')) && (
              <Card>
                <CardContent className="pt-6">
                  <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
                    <DialogTrigger asChild>
                      <div className="aspect-square w-full rounded-lg bg-muted/50 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        {renderImage(selectedItem.thumbnailUrl, selectedItem.name)}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      {renderImage(selectedItem.url || selectedItem.thumbnailUrl, selectedItem.name)}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Información básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {renderInfoItem("Nombre", selectedItem.name)}
                {renderInfoItem("Tipo", selectedItem.mimeType || selectedItem.type)}
                {renderInfoItem("Tamaño", formatFileSize(selectedItem.size))}
                {renderInfoItem("Modificado", new Date(selectedItem.modified).toLocaleDateString())}
                {renderInfoItem("Creado", new Date(selectedItem.created).toLocaleDateString())}
              </CardContent>
            </Card>

            {selectedItem.model && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="h-4 w-4" />
                    Modelo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {renderInfoItem("Nombre", selectedItem.model.name)}
                  {renderInfoItem("Versión", selectedItem.model.version)}
                  {renderInfoItem("Parámetros", selectedItem.model.parameters)}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  Metadatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {selectedItem.metadata && Object.entries(selectedItem.metadata).map(([key, value]) => (
                  <div key={key}>
                    {renderInfoItem(key, value as string)}
                  </div>
                ))}
                {(!selectedItem.metadata || Object.keys(selectedItem.metadata).length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No hay metadatos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}