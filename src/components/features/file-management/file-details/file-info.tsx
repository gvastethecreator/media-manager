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

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        <Tabs defaultValue="info" className="w-full">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Información básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Nombre</span>
                  <Badge variant="secondary">{selectedItem.name}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tipo</span>
                  <Badge variant="secondary">{selectedItem.mimeType || selectedItem.type}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tamaño</span>
                  <Badge variant="secondary">{formatFileSize(selectedItem.size)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Modificado</span>
                  <Badge variant="secondary">
                    {new Date(selectedItem.modified).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Creado</span>
                  <Badge variant="secondary">
                    {new Date(selectedItem.created).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {selectedItem.model && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Modelo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="w-full justify-center">
                    {selectedItem.model}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {selectedItem.loras && selectedItem.loras.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    LoRAs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.loras.map((lora, index) => (
                      <Badge key={index} variant="secondary">
                        {lora}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Creación</span>
                  <Badge variant="secondary">
                    {new Date(selectedItem.created).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Modificación</span>
                  <Badge variant="secondary">
                    {new Date(selectedItem.modified).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {(selectedItem.type === 'image' || selectedItem.mimeType?.startsWith('image/')) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Dimensiones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ancho</span>
                    <Badge variant="secondary">{selectedItem.width || selectedItem.metadata?.width}px</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alto</span>
                    <Badge variant="secondary">{selectedItem.height || selectedItem.metadata?.height}px</Badge>
                  </div>
                  {selectedItem.metadata?.format && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Formato</span>
                      <Badge variant="secondary">{selectedItem.metadata.format}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Otros metadatos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(selectedItem.metadata)
                    .filter(([key]) => !['width', 'height', 'format'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{key}</span>
                        <Badge variant="secondary">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}