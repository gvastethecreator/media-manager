'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSettingsContext } from "@/context/settings-context"
import { folderService } from "@/services/folder.service"
import { useToast } from "@/components/ui/use-toast"
import { Folder, FolderX, RefreshCw, FolderPlus, AlertCircle } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [stats, setStats] = useState<FolderStats>(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState("")
  const [folders, setFolders] = useState<any[]>([])

  // Cargar carpetas al montar el componente
  React.useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const folders = await folderService.getFolders()
      setFolders(folders)
      await loadStats()
    } catch (error) {
      console.error('Error cargando carpetas:', error)
      setError('No se pudieron cargar las carpetas')
    } finally {
      setIsLoading(false)
    }
  }

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

      setIsProcessing(true)
      const folder = await folderService.addFolder(folderPath)
      setCurrentFolder(folder.id)
      
      // Recargar carpetas y estadísticas
      await loadFolders()
      
      toast({
        title: "Carpeta agregada",
        description: `Se han procesado ${folder.stats?.processedFiles || 0} archivos correctamente.`
      })

      // Limpiar el input
      setFolderPath("")
    } catch (error) {
      console.error('Error agregando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al agregar la carpeta',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
      setCurrentFolder(null)
    }
  }

  const handleReindexFolder = async (folderId: string) => {
    try {
      setError(null)
      setIsProcessing(true)
      setProcessProgress(0)
      setCurrentFolder(folderId)

      const response = await folderService.reindexFolder(folderId)
      
      // Recargar carpetas y estadísticas
      await loadFolders()
      
      toast({
        title: "Reindexación completada",
        description: `Se han procesado ${response.stats?.processedFiles || 0} archivos correctamente.`
      })
    } catch (error) {
      console.error('Error reindexando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al reindexar la carpeta',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
      setCurrentFolder(null)
    }
  }

  const handleRemoveFolder = async (folderId: string) => {
    try {
      setError(null)
      await folderService.removeFolder(folderId)
      
      // Recargar carpetas y estadísticas
      await loadFolders()
      
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

  const handleReindex = async () => {
    if (isProcessing) return

    try {
      setError(null)
      setIsProcessing(true)
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
      setIsProcessing(false)
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
        <CardContent className="p-4">
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
              size="sm"
              className="h-7"
              onClick={handleAddFolder}
              disabled={isLoading || isProcessing || !folderPath.trim()}
            >
              {isProcessing ? (
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
          ) : folders.length > 0 ? (
            <div className="space-y-2">
              {folders.map((folder) => (
                <Card key={folder.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
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
                          disabled={isProcessing}
                        >
                          <RefreshCw className={cn(
                            "h-4 w-4",
                            isProcessing && currentFolder === folder.id && "animate-spin"
                          )} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              disabled={isProcessing}
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

                    {/* Barra de progreso */}
                    {isProcessing && currentFolder === folder.id && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Procesando archivos...</span>
                          <span>{Math.round(processProgress)}%</span>
                        </div>
                        <Progress value={processProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
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
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? (
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