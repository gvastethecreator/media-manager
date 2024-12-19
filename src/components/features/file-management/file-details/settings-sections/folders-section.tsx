'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, RefreshCw, AlertCircle, FolderPlus, FolderX, Eye, EyeOff } from "lucide-react"
import { useSettingsContext } from "@/context/settings-context"
import { folderService } from "@/services/folder.service"
import { watcherService } from "@/services/watcher.service"
import { formatBytes, cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface FolderStats {
  totalFolders: number
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
}

const initialStats: FolderStats = {
  totalFolders: 0,
  totalFiles: 0,
  totalSize: 0,
  lastIndexed: null
}

export function FoldersSection() {
  const { settings, updateSettings } = useSettingsContext()
  const { toast } = useToast()
  const [isIndexing, setIsIndexing] = React.useState(false)
  const [stats, setStats] = React.useState<FolderStats>(initialStats)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [folderPath, setFolderPath] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Cargar estadísticas al montar el componente
  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const indexStats = await folderService.getIndexStats()
      setStats(indexStats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setError('No se pudieron cargar las estadísticas')
      setStats(initialStats)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFolder = async () => {
    try {
      setError(null)
      
      if (!folderPath.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa una ruta de carpeta válida",
          variant: "destructive"
        })
        return
      }

      setIsAdding(true)
      const folder = await folderService.addFolder(folderPath)
      
      // Iniciar el monitoreo de la carpeta
      await watcherService.watchFolder(folder.id)
      
      // Actualizar estadísticas
      await loadStats()
      
      toast({
        title: "Carpeta agregada",
        description: `Se ha agregado la carpeta ${folder.name} correctamente.`
      })

      // Limpiar el input
      setFolderPath("")
      setIsAdding(false)
    } catch (error) {
      console.error('Error agregando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al agregar la carpeta',
        variant: "destructive"
      })
      setIsAdding(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      // Crear un elemento input de tipo file
      const input = document.createElement('input')
      input.type = 'file'
      
      // Configurar para selección de carpetas
      input.setAttribute('webkitdirectory', '')
      input.setAttribute('directory', '')
      
      // Manejar el cambio
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
          const file = files[0]
          // En Windows, file.path contiene la ruta completa al archivo
          if (file.path) {
            // Obtener la ruta de la carpeta (eliminando el último segmento que es el archivo)
            const folderPath = file.path.split('\\').slice(0, -1).join('\\')
            setFolderPath(folderPath)
          }
        }
      }

      // Simular click
      input.click()
    } catch (error) {
      console.error('Error seleccionando carpeta:', error)
      toast({
        title: "Error",
        description: "No se pudo abrir el selector de carpetas",
        variant: "destructive"
      })
    }
  }

  const handleRemoveFolder = async (folderId: string) => {
    try {
      setError(null)
      // Detener el monitoreo
      await watcherService.stopWatching(folderId)
      
      // Eliminar la carpeta
      await folderService.removeFolder(folderId)
      
      // Actualizar estadísticas
      await loadStats()
      
      toast({
        title: "Carpeta eliminada",
        description: "Se ha eliminado la carpeta correctamente."
      })
    } catch (error) {
      console.error('Error eliminando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al eliminar la carpeta',
        variant: "destructive"
      })
    }
  }

  const handleReindexFolder = async (folderId: string) => {
    try {
      setError(null)
      await folderService.reindexFolder(folderId)
      await loadStats()
      
      toast({
        title: "Reindexación completada",
        description: "Se ha actualizado la carpeta correctamente."
      })
    } catch (error) {
      console.error('Error reindexando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al reindexar la carpeta',
        variant: "destructive"
      })
    }
  }

  const handleReindex = async () => {
    if (isIndexing) return

    try {
      setError(null)
      setIsIndexing(true)
      await folderService.reindexAll()
      await loadStats()
      
      toast({
        title: "Reindexación completada",
        description: "Se han actualizado todas las carpetas correctamente."
      })
    } catch (error) {
      console.error('Error reindexando:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al reindexar las carpetas',
        variant: "destructive"
      })
    } finally {
      setIsIndexing(false)
    }
  }

  const toggleWatching = async (folderId: string, isWatched: boolean) => {
    try {
      setError(null)
      if (isWatched) {
        await watcherService.watchFolder(folderId)
      } else {
        await watcherService.stopWatching(folderId)
      }
      
      toast({
        title: isWatched ? "Monitoreo iniciado" : "Monitoreo detenido",
        description: `Se ha ${isWatched ? 'iniciado' : 'detenido'} el monitoreo de la carpeta.`
      })
    } catch (error) {
      console.error('Error cambiando estado de monitoreo:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cambiar el estado de monitoreo',
        variant: "destructive"
      })
    }
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Carpetas Indexadas</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Administra las carpetas que quieres mantener indexadas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-3">
          <div className="flex items-center gap-2 p-2 rounded-lg border">
            <div className="flex-1">
              <Input
                placeholder="Ruta de la carpeta (ej: C:\Users\Usuario\Imágenes)"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-7"
              onClick={handleAddFolder}
              disabled={isLoading || isAdding || !folderPath.trim()}
            >
              {isAdding ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Agregar
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
              Cargando carpetas...
            </div>
          ) : settings.folders && settings.folders.length > 0 ? (
            <div className="space-y-2">
              {settings.folders.map((folder) => (
                <div 
                  key={folder.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium block truncate">{folder.name}</span>
                      <p className="text-[10px] text-muted-foreground truncate">{folder.path}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {folder._count?.images || 0} imágenes
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatBytes(folder.totalSize || 0)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {folder.lastIndexed ? new Date(folder.lastIndexed).toLocaleString() : 'No indexado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleReindexFolder(folder.id)}
                      disabled={isLoading || folder.isIndexing}
                    >
                      <RefreshCw className={cn("h-4 w-4", folder.isIndexing && "animate-spin")} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={isLoading}
                        >
                          <FolderX className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará la carpeta "{folder.name}" de la lista de indexación.
                            No se eliminarán los archivos del disco.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveFolder(folder.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              No hay carpetas indexadas
              <p className="text-xs mt-1 text-muted-foreground/75">
                Agrega una carpeta para comenzar a indexar imágenes
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Carpetas indexadas</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats.totalFolders}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Archivos indexados</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats.totalFiles}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Espacio total</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {formatBytes(stats.totalSize)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Última indexación</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {stats.lastIndexed ? new Date(stats.lastIndexed).toLocaleString() : 'Nunca'}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs mt-2"
            onClick={handleReindex}
            disabled={isIndexing || isLoading}
          >
            {isIndexing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Reindexando...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Reindexar todo
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}