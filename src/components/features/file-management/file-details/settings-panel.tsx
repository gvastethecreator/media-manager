'use client'

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FolderIcon,
  ImageIcon,
  DatabaseIcon,
  TagIcon,
  BookmarkIcon,
  Settings2Icon,
  UserIcon,
  InfoIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"

const thumbnailSizes = ["64x64", "128x128", "256x256", "512x512"]
const colorOptions = [
  { value: 'red', label: 'Rojo' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'purple', label: 'Morado' },
  { value: 'pink', label: 'Rosa' },
  { value: 'orange', label: 'Naranja' },
  { value: 'cyan', label: 'Cian' },
  { value: 'indigo', label: 'Índigo' },
]

export function SettingsPanel() {
  const [activeTab, setActiveTab] = React.useState("general")
  const [thumbnailSize, setThumbnailSize] = React.useState("256x256")
  const [thumbnailQuality, setThumbnailQuality] = React.useState(75)

  return (
    <TooltipProvider>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="general">
                    <Settings2Icon className="h-4 w-4" />
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
                  <TabsTrigger value="about">
                    <InfoIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Acerca de</TooltipContent>
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
                    {/* Lista de carpetas */}
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

            <TabsContent value="collections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Colecciones</CardTitle>
                  <CardDescription>
                    Gestiona tus colecciones de archivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Nombre de la colección" />
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Crear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {/* Lista de colecciones */}
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <BookmarkIcon className="h-4 w-4" />
                        <span>Favoritos</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas</CardTitle>
                  <CardDescription>
                    Gestiona las etiquetas para organizar tus archivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Nombre de la etiqueta" />
                    <Select defaultValue="blue">
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Crear
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {/* Lista de etiquetas */}
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="h-4 w-4" />
                        <span>Importante</span>
                        <Badge variant="secondary">32 archivos</Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="thumbnails" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de miniaturas</CardTitle>
                  <CardDescription>
                    Configura cómo se generan y muestran las miniaturas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tamaño de miniaturas</Label>
                    <Select value={thumbnailSize} onValueChange={setThumbnailSize}>
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
                      <Label>Calidad de compresión</Label>
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

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Acerca de</CardTitle>
                  <CardDescription>
                    Información sobre el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Versión</span>
                    <Badge variant="secondary">1.0.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Base de datos</span>
                    <Badge variant="secondary">SQLite 3.42.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Espacio usado</span>
                    <Badge variant="secondary">2.5 GB</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Última copia de seguridad</span>
                    <Badge variant="secondary">Hace 2 días</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Crear copia de seguridad</Button>
                  <Button variant="outline">Buscar actualizaciones</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}