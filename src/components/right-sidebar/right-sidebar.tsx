'use client'

import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileItem } from '@/components/file-view/file-view'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Share2, Pencil, Trash2, Copy, Eye, Info, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageFallback } from "@/components/ui/image-fallback"
import { useToast } from "@/components/ui/use-toast"

type RightSidebarProps = {
  selectedItem: FileItem | null
  isCollapsed?: boolean
  onAction?: (action: string, item: FileItem) => void
}

export function RightSidebar({ selectedItem, isCollapsed = false, onAction }: RightSidebarProps) {
  const { toast } = useToast()

  if (!selectedItem) {
    return (
      <div className="w-80 border-l flex flex-col">
        <div className="p-4 text-center text-muted-foreground">
          Selecciona un elemento para ver sus detalles
        </div>
      </div>
    )
  }

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, selectedItem)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedItem.name)
      toast({
        title: "Copiado",
        description: "El nombre del archivo ha sido copiado al portapapeles"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el nombre del archivo",
        variant: "destructive"
      })
    }
  }

  const gradientColors = [
    `hsl(${parseInt(selectedItem.id.split('-')[1] || '0') * 40 % 360}, 95%, 75%)`,
    `hsl(${(parseInt(selectedItem.id.split('-')[1] || '0') * 40 + 60) % 360}, 95%, 75%)`
  ]

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 space-y-4">
        {selectedItem.type === 'image' && (
          <div
            className="group relative aspect-square w-full rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleAction('preview')}
          >
            <ImageFallback
              src={selectedItem.thumbnail}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
              gradientColors={gradientColors}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {selectedItem.type === 'folder' && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              Vista previa del contenido
              <Badge variant="secondary" className="text-[10px]">
                {selectedItem.children?.length || 0} elementos
              </Badge>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {selectedItem.children?.slice(0, 9).map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 cursor-pointer group"
                  onClick={() => handleAction('open')}
                >
                  {item.type === 'image' ? (
                    <ImageFallback
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      gradientColors={[
                        `hsl(${parseInt(item.id.split('-')[1] || '0') * 40 % 360}, 95%, 75%)`,
                        `hsl(${(parseInt(item.id.split('-')[1] || '0') * 40 + 60) % 360}, 95%, 75%)`
                      ]}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-xs">Carpeta</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Abrir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('download')}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('share')}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('rename')}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Renombrar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('delete')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="info" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger
            value="info"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold data-[state=active]:border-primary"
          >
            Información
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold data-[state=active]:border-primary"
          >
            Detalles
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="info" className="m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <p className="text-sm text-muted-foreground capitalize">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tamaño</label>
                <p className="text-sm text-muted-foreground">{selectedItem.size}</p>
              </div>
              {selectedItem.type === 'image' && selectedItem.dimensions && (
                <div>
                  <label className="text-sm font-medium">Dimensiones</label>
                  <p className="text-sm text-muted-foreground">{selectedItem.dimensions}</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="details" className="m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Fecha de creación</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedItem.dateCreated).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Última modificación</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedItem.dateModified).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Extensión</label>
                <p className="text-sm text-muted-foreground">{selectedItem.extension || '-'}</p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}