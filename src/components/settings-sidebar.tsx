'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { FolderIcon, ImageIcon, DatabaseIcon, TagIcon, BookmarkIcon, Settings2Icon, UserIcon, Trash2Icon, RefreshCwIcon, PlusIcon, EditIcon, InfoIcon } from 'lucide-react'

// Expanded mock data
const data = {
  profiles: [
    { id: 1, name: "John Doe", avatar: "/avatars/01.png", collections: 5, folders: 10, images: 1000, tags: 15 },
    { id: 2, name: "Jane Smith", avatar: "/avatars/02.png", collections: 3, folders: 5, images: 500, tags: 8 },
  ],
  collections: [
    { emoji: "🏖️", name: "Vacaciones 2023", count: 145 },
    { emoji: "🎂", name: "Cumpleaños", count: 67 },
    { emoji: "🐾", name: "Mascotas", count: 89 },
    { emoji: "💼", name: "Trabajo", count: 203 },
  ],
  folders: [
    { name: "Documentos", count: 56 },
    { name: "Imágenes", count: 412 },
    { name: "Proyectos", count: 7 },
  ],
  tags: [
    { name: "Favoritos", color: "red" },
    { name: "Importante", color: "yellow" },
    { name: "Personal", color: "green" },
    { name: "Trabajo", color: "blue" },
    { name: "Archivo", color: "purple" },
    { name: "Referencias", color: "pink" },
    { name: "Familia", color: "orange" },
    { name: "Viajes", color: "cyan" },
    { name: "Eventos", color: "indigo" },
  ],
  thumbnails: {
    total: 1500,
    sizes: {
      "64x64": 300,
      "128x128": 500,
      "256x256": 400,
      "512x512": 300
    }
  },
  generalStats: {
    totalProfiles: 2,
    totalCollections: 4,
    totalFolders: 3,
    totalTags: 9,
    totalImages: 1500,
    totalStorage: "5.2 GB",
    lastBackup: "2023-04-15 14:30:00",
    version: "1.2.3"
  }
}

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

const emojiOptions = ["🏖️", "🎂", "🐾", "💼", "📚", "🎵", "🎨", "🍔", "🚗"]

const thumbnailSizes = ["64x64", "128x128", "256x256", "512x512"]

type SettingsSidebarProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ isOpen, onOpenChange, activeTab, onTabChange }: SettingsSidebarProps) {
  const [theme, setTheme] = React.useState("system")
  const [thumbnailSize, setThumbnailSize] = React.useState("256x256")
  const [thumbnailQuality, setThumbnailQuality] = React.useState(75)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="profiles">
              <UserIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="folders">
              <FolderIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="collections">
              <BookmarkIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="tags">
              <TagIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="thumbnails">
              <ImageIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings2Icon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="info">
              <InfoIcon className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {data.profiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden">
                  <CardHeader className="space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-sm font-medium">
                        {profile.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                      <div>Collections: {profile.collections}</div>
                      <div>Folders: {profile.folders}</div>
                      <div>Images: {profile.images}</div>
                      <div>Tags: {profile.tags}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <EditIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2Icon className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <Button className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Profile
            </Button>
            <MiniDashboard title="Profile Statistics" items={[
              { label: "Total Profiles", value: data.profiles.length },
              { label: "Total Collections", value: data.profiles.reduce((sum, profile) => sum + profile.collections, 0) },
              { label: "Total Folders", value: data.profiles.reduce((sum, profile) => sum + profile.folders, 0) },
              { label: "Total Images", value: data.profiles.reduce((sum, profile) => sum + profile.images, 0) },
            ]} />
          </TabsContent>

          <TabsContent value="folders" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input placeholder="Ruta de la carpeta" />
              <Button>Agregar</Button>
            </div>
            <div className="space-y-2">
              {data.folders.map((folder) => (
                <div key={folder.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="h-4 w-4" />
                    <span>{folder.name}</span>
                    <span className="text-xs text-muted-foreground">({folder.count} items)</span>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <MiniDashboard title="Folder Statistics" items={[
              { label: "Total Folders", value: data.folders.length },
              { label: "Total Items", value: data.folders.reduce((sum, folder) => sum + folder.count, 0) },
              { label: "Avg Items per Folder", value: (data.folders.reduce((sum, folder) => sum + folder.count, 0) / data.folders.length).toFixed(2) },
            ]} />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Select>
                <SelectTrigger className="w-[60px]">
                  <SelectValue placeholder="🏷️" />
                </SelectTrigger>
                <SelectContent>
                  {emojiOptions.map((emoji) => (
                    <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Nombre de la colección" />
              <Button>Agregar</Button>
            </div>
            <div className="space-y-2">
              {data.collections.map((collection) => (
                <div key={collection.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{collection.emoji}</span>
                    <span>{collection.name}</span>
                    <span className="text-xs text-muted-foreground">({collection.count} items)</span>
                  </div>
                  <Button variant="ghost" size="sm">Eliminar</Button>
                </div>
              ))}
            </div>
            <MiniDashboard title="Collection Statistics" items={[
              { label: "Total Collections", value: data.collections.length },
              { label: "Total Items", value: data.collections.reduce((sum, collection) => sum + collection.count, 0) },
              { label: "Avg Items per Collection", value: (data.collections.reduce((sum, collection) => sum + collection.count, 0) / data.collections.length).toFixed(2) },
            ]} />
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input placeholder="Nombre de la etiqueta" />
              <Select>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full bg-${color.value}-500 mr-2`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge 
                  key={tag.name}
                  variant="secondary"
                  className="cursor-pointer flex items-center gap-2 text-white"
                  style={{
                    backgroundColor: `var(--${tag.color}-500)`,
                  }}
                >
                  {tag.name}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 hover:bg-transparent text-white"
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
            <MiniDashboard title="Tag Statistics" items={[
              { label: "Total Tags", value: data.tags.length },
              { label: "Unique Colors", value: new Set(data.tags.map(tag => tag.color)).size },
            ]} />
          </TabsContent>

          <TabsContent value="thumbnails" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tamaño de miniaturas</Label>
                <Select value={thumbnailSize} onValueChange={setThumbnailSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {thumbnailSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calidad de miniaturas: {thumbnailQuality}%</Label>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[thumbnailQuality]}
                  onValueChange={(value) => setThumbnailQuality(value[0])}
                />
              </div>
              <Button className="w-full">Regenerar miniaturas</Button>
            </div>
            <MiniDashboard title="Thumbnail Statistics" items={[
              { label: "Total Thumbnails", value: data.thumbnails.total },
              ...Object.entries(data.thumbnails.sizes).map(([size, count]) => ({
                label: `${size} Thumbnails`,
                value: count
              }))
            ]} />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="w-[180px]">
                    <SelectValue placeholder="Seleccionar tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-update" />
                <Label htmlFor="auto-update">Actualizaciones automáticas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Notificaciones</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="compact-mode" />
                <Label htmlFor="compact-mode">Modo compacto</Label>
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Limpiar base de datos</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los datos de la base de datos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Continuar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Resetear configuración y aplicación</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se restablecerá la aplicación a su estado inicial.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Continuar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de perfiles</p>
                    <p className="text-lg font-bold">{data.generalStats.totalProfiles}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de colecciones</p>
                    <p className="text-lg font-bold">{data.generalStats.totalCollections}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de carpetas</p>
                    <p className="text-lg font-bold">{data.generalStats.totalFolders}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de etiquetas</p>
                    <p className="text-lg font-bold">{data.generalStats.totalTags}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total de imágenes</p>
                    <p className="text-lg font-bold">{data.generalStats.totalImages}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Almacenamiento total</p>
                    <p className="text-lg font-bold">{data.generalStats.totalStorage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Información adicional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Versión de la aplicación</span>
                    <span className="text-sm">{data.generalStats.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Última copia de seguridad</span>
                    <span className="text-sm">{data.generalStats.lastBackup}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function MiniDashboard({ title, items }: { title: string, items: { label: string, value: number | string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

