'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ResizablePanel } from "@/components/ui/resizable"
import { ChevronLeft, ChevronRight, Settings2, FolderIcon, ImageIcon, DatabaseIcon, TagIcon, BookmarkIcon, UserIcon, InfoIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { FileItem } from "../file-view/file-view"

interface RightPanelProps {
  selectedItem: FileItem | null
  isCollapsed: boolean
  showSettings: boolean
  onToggleSettings: () => void
  onToggleCollapse: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

const thumbnailSizes = ["64x64", "128x128", "256x256", "512x512"]

export function RightPanel({
  selectedItem,
  isCollapsed,
  showSettings,
  onToggleSettings,
  onToggleCollapse,
  defaultSize = 320,
  minSize = 240,
  maxSize = 480
}: RightPanelProps) {
  const [activeTab, setActiveTab] = React.useState("general")
  const [thumbnailSize, setThumbnailSize] = React.useState("256x256")
  const [thumbnailQuality, setThumbnailQuality] = React.useState(75)
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)

  if (isCollapsed) {
    return (
        <div className="flex flex-col h-full border-l items-center justify-center text-muted-foreground p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-full"
        >
          <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Expandir panel</span>
          </Button>
        </div>
    )
  }

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "flex flex-col border-l",
        showSettings ? "bg-muted/50" : "bg-background"
      )}
    >
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-medium">
          {showSettings ? "Configuración" : "Detalles"}
        </h3>
            <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSettings}
            className={cn(
              "h-8 w-8",
              showSettings && "bg-accent text-accent-foreground"
            )}
                  >
                    <Settings2 className="h-4 w-4" />
            <span className="sr-only">Alternar configuración</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
            onClick={onToggleCollapse}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Colapsar panel</span>
                  </Button>
            </div>
          </div>

            {showSettings ? (
        <TooltipProvider>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="general">
                        <Settings2 className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>General</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="folders">
                        <FolderIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Carpetas</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="collections">
                        <BookmarkIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Colecciones</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="tags">
                        <TagIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Etiquetas</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="thumbnails">
                        <ImageIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Miniaturas</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="database">
                        <DatabaseIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Base de datos</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="info">
                        <InfoIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Información</TooltipContent>
                  </Tooltip>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración general</CardTitle>
                      <CardDescription>
                        Configura las opciones básicas del sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tema</Label>
                        <Select defaultValue="system">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Oscuro</SelectItem>
                            <SelectItem value="system">Sistema</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Idioma</Label>
                        <Select defaultValue="es">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mostrar miniaturas en la lista</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Animaciones</Label>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="folders" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Carpetas</CardTitle>
                      <CardDescription>
                        Gestiona las carpetas monitorizadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input placeholder="Ruta de la carpeta" />
                        <Button>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center space-x-2">
                            <FolderIcon className="h-4 w-4" />
                            <span>Documentos</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon">
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="thumbnails" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Miniaturas</CardTitle>
                      <CardDescription>
                        Configura la generación de miniaturas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tamaño</Label>
                        <Select
                          value={thumbnailSize}
                          onValueChange={setThumbnailSize}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tamaño" />
                          </SelectTrigger>
                          <SelectContent>
                            {thumbnailSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Calidad</Label>
                          <span className="text-sm text-muted-foreground">
                            {thumbnailQuality}%
                          </span>
                        </div>
                        <Slider
                          value={[thumbnailQuality]}
                          onValueChange={([value]) => setThumbnailQuality(value)}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Generar al importar</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mantener proporción</Label>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Regenerar miniaturas
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Base de datos</CardTitle>
                      <CardDescription>
                        Gestiona la base de datos del sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tamaño de la base de datos</span>
                          <Badge variant="secondary">128 MB</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Última optimización</span>
                          <Badge variant="secondary">Hace 3 días</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Última copia de seguridad</span>
                          <Badge variant="secondary">Hace 1 día</Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Optimizar
                      </Button>
                      <Button>
                        Crear copia de seguridad
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
          </div>
          </ScrollArea>
        </TooltipProvider>
      ) : selectedItem ? (
        <>
          {selectedItem.thumbnail && (
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
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="metadata">Metadatos</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                      <span className="text-sm">{selectedItem.name}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Tipo</span>
                      <span className="text-sm">{selectedItem.type}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Tamaño</span>
                      <span className="text-sm">{selectedItem.size}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Modificado</span>
                      <span className="text-sm">
                        {selectedItem.modified ? new Date(selectedItem.modified).toLocaleString() : 'No disponible'}
                      </span>
                    </div>
                    {selectedItem.tags && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Etiquetas</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedItem.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="metadata" className="space-y-4 py-4">
                  <div className="space-y-2">
                    {selectedItem.type === 'file' ? (
                      <>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Creado por</span>
                          <span className="text-sm">John Doe</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Última modificación por</span>
                          <span className="text-sm">Jane Smith</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Versión</span>
                          <span className="text-sm">1.0.0</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Estado</span>
                          <span className="text-sm">Activo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Propietario</span>
                          <span className="text-sm">John Doe</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Compartido con</span>
                          <span className="text-sm">3 personas</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Ruta</span>
                          <span className="text-sm">/Documentos/Trabajo/2023</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Contenido</span>
                          <span className="text-sm">12 archivos, 3 carpetas</span>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No hay ningún elemento seleccionado
      </div>
      )}
    </ResizablePanel>
  )
}
