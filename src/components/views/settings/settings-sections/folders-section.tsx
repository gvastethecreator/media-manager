'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { addFolder, reindexFolder, getFolders, type IndexStats, deleteFolder } from "@/services/folder.service"
import { useToast } from "@/components/ui/use-toast"
import { Folder, FolderPlus, AlertCircle, RefreshCw, FolderIcon } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Trash2} from "lucide-react"

interface FolderStats {
  totalFolders: number
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
}

interface ProcessStatus {
  status?: string;
  currentFile?: string;
  current?: number;
  total?: number;
  progress?: number;
  folderId?: string;
}

const initialStats: FolderStats = {
  totalFolders: 0,
  totalFiles: 0,
  totalSize: 0,
  lastIndexed: null
}

export function FoldersSection() {
  const { toast } = useToast()

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [stats, setStats] = useState<FolderStats>(initialStats)
  const [folderPath, setFolderPath] = useState("")
  const [folders, setFolders] = useState<any[]>([])
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({})
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Cargar carpetas al montar el componente
  useEffect(() => {
    loadStats()
  }, [])

  const loadFolders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const folders = await getFolders()
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
      const folders = await getFolders()
      const indexStats: FolderStats = {
        totalFolders: folders.length,
        totalFiles: folders.reduce((acc: number, folder: any) => acc + (folder._count?.images || 0), 0),
        totalSize: folders.reduce((acc: number, folder: any) => acc + Number(folder.totalSize || 0), 0),
        lastIndexed: folders.reduce((acc: Date | null, folder: any) => {
          if (!acc || !folder.lastIndexed) return acc
          const date = new Date(folder.lastIndexed)
          return acc > date ? acc : date
        }, null as Date | null)
      }
      setStats(indexStats)
      setFolders(folders)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setError('No se pudieron cargar las estadísticas')
      setStats(initialStats)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFolder = async () => {
    if (!folderPath.trim()) return

    try {
      setError(null)
      setIsProcessing(true)
      setProcessProgress(0)
      setProcessStatus({
        status: 'Iniciando proceso...',
        currentFile: '',
        current: 0,
        total: 0,
        progress: 0
      })

      console.log('Intentando agregar carpeta:', folderPath)

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: folderPath
        }),
      })

      const contentType = response.headers.get('content-type')
      if (!response.ok) {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: 'Error desconocido' }
        throw new Error(errorData.error || 'Error adding folder')
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let isComplete = false

      try {
        while (!isComplete) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          console.log('Chunk received:', chunk)

          const events = chunk
            .split('\n')
            .filter(Boolean)
            .map(line => {
              try {
                const parsed = JSON.parse(line)
                console.log('Parsed event:', parsed)
                return parsed
              } catch (error) {
                console.error('Error parsing event:', error)
                return null
              }
            })
            .filter(event => event !== null)

          for (const event of events) {
            if (!event?.type || !event?.data) {
              console.warn('Invalid event received:', event)
              continue
            }

            switch (event.type) {
              case 'progress':
                if (typeof event.data.progress === 'number') {
                  setProcessProgress(event.data.progress)
                }
                setProcessStatus(prevStatus => ({
                  ...prevStatus,
                  ...event.data,
                  status: event.data.status || 'Procesando...'
                }))
                // Añadir un pequeño delay para que el UI se actualice
                await new Promise(resolve => setTimeout(resolve, 50))
                break
              case 'error':
                if (event.data.error) {
                  console.error('Error procesando archivo:', event.data.file, event.data.error)
                  toast({
                    title: "Error",
                    description: event.data.error,
                    variant: "destructive"
                  })
                }
                break
              case 'complete':
                isComplete = true
                toast({
                  title: "Carpeta agregada",
                  description: `Se agregó la carpeta correctamente`
                })
                setFolderPath("")
                // Esperar un momento antes de actualizar la lista
                await new Promise(resolve => setTimeout(resolve, 500))
                await loadStats()
                break
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error agregando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar la carpeta",
        variant: "destructive"
      })
    } finally {
      // Esperar un momento antes de limpiar el estado
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsProcessing(false)
      setProcessProgress(0)
      setProcessStatus({})
    }
  }

  const handleReindexFolder = async (folderId: string) => {
    try {
      setError(null)
      setIsProcessing(true)
      setProcessProgress(0)
      setProcessStatus({ folderId })

      const response = await fetch(`/api/folders/reindex/${folderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: folderPath
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error reindexing folder')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let isComplete = false

      try {
        while (!isComplete) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const events = chunk
            .split('\n')
            .filter(Boolean)
            .map(line => {
              try {
                return JSON.parse(line)
              } catch (error) {
                console.error('Error parsing event:', error)
                return null
              }
            })
            .filter((event): event is { type: string; data: any } => {
              if (!event || typeof event !== 'object') return false
              if (!event.type || !event.data) return false
              return true
            })

          for (const event of events) {
            switch (event.type) {
              case 'progress':
                if (typeof event.data.progress === 'number') {
                  setProcessProgress(event.data.progress)
                  setProcessStatus(prevStatus => ({
                    ...prevStatus,
                    ...event.data,
                    folderId,
                    status: event.data.status || 'Procesando...'
                  }))
                  // Añadir un pequeño delay para que el UI se actualice
                  await new Promise(resolve => setTimeout(resolve, 50))
                }
                break

              case 'error':
                if (event.data.error) {
                  const errorMessage = event.data.file
                    ? `Error procesando ${event.data.file}: ${event.data.error}`
                    : event.data.error
                  console.error(errorMessage)
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                  })
                }
                break

              case 'complete':
                isComplete = true
                const errors = event.data.folder?.errors || 0
                toast({
                  title: errors > 0 ? "Reindexación completada con errores" : "Reindexación completada",
                  description: errors > 0
                    ? `Se completó la reindexación con ${errors} errores`
                    : "Se ha completado la reindexación correctamente",
                  variant: errors > 0 ? "destructive" : "default"
                })
                // Esperar un momento antes de actualizar la lista
                await new Promise(resolve => setTimeout(resolve, 500))
                await loadStats()
                break
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error reindexando carpeta:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al reindexar la carpeta',
        variant: "destructive"
      })
    } finally {
      // Esperar un momento antes de limpiar el estado
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsProcessing(false)
      setProcessProgress(0)
      setProcessStatus({})
    }
  }

  const handleRemoveFolder = async (folderId: string) => {
    try {
      setError(null)
      await reindexFolder({
        id: folderId,
        onProgress: () => {},
        onError: () => {},
        onComplete: () => {}
      })

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

  const handleFolderClick = async (folderId: string) => {
    if (selectedFolder === folderId) {
      try {
        await deleteFolder(folderId);
        toast({
          title: "Carpeta eliminada",
          description: "La carpeta se eliminó correctamente"
        });
        await loadStats();
        setSelectedFolder(null);
      } catch (error) {
        console.error('Error deleting folder:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la carpeta",
          variant: "destructive"
        });
      }
    } else {
      setSelectedFolder(folderId);
    }
  };

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
      <Card className="border-none py-2">
        <CardHeader className="px-4 py-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <FolderIcon className="h-6 w-6 mr-2" /> Carpetas</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex items-center gap-2 p-2 border-none">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Ruta de la carpeta (ej: C:\Users\Usuario\Imágenes)"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="h-7 text-xs"
                disabled={isProcessing}
              />
            </div>
            <Button
              size="sm"
              className="h-7"
              onClick={handleAddFolder}
              disabled={isLoading || isProcessing || !folderPath.trim()}
            >
              {isProcessing ? (
                <React.Fragment>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Agregando...
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Agregar
                </React.Fragment>
              )}
            </Button>

          </div>
 {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{processStatus.status || 'Procesando...'}</span>
                <span>{processStatus.current}/{processStatus.total} archivos</span>
              </div>
              <Progress value={processProgress} className="h-2" />
            </div>
          )}



          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
              Cargando carpetas...
            </div>
          ) : folders.length > 0 ? (
            <div className="space-y-2">
              {folders.map((folder) => (
                <Card key={folder.id}>
                  <CardContent className="p-2">
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
                              {formatBytes(Number(folder.totalSize || 0))}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {folder.lastIndexed ? new Date(folder.lastIndexed).toLocaleString() : 'No indexado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleReindexFolder(folder.id)}
                          disabled={isProcessing}
                        >
                          <RefreshCw className={cn(
                            "h-4 w-4",
                            isProcessing && processStatus.folderId === folder.id && "animate-spin"
                          )} />
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  "h-7 w-7",
                                  selectedFolder === folder.id && "bg-destructive hover:bg-destructive/90"
                                )}
                                onClick={() => handleFolderClick(folder.id)}
                                disabled={isProcessing}
                              >
                                <Trash2 className={cn(
                                  "h-4 w-4",
                                  selectedFolder === folder.id && "text-destructive-foreground"
                                )} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {selectedFolder === folder.id
                                ? "Haz clic de nuevo para eliminar"
                                : "Haz clic para eliminar"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    {isProcessing && processStatus.folderId === folder.id && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{processStatus.status || 'Procesando...'}</span>
                          <span>{Math.round(processProgress)}%</span>
                        </div>
                        <Progress value={processProgress} className="h-2" />
                        <div className="flex flex-col gap-1">
                          {processStatus.currentFile && (
                            <p className="text-xs text-muted-foreground truncate">
                              Archivo actual: {processStatus.currentFile}
                            </p>
                          )}
                          {processStatus.current !== undefined && processStatus.total !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {processStatus.current} de {processStatus.total} archivos procesados
                            </p>
                          )}
                        </div>
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
                {stats.lastIndexed ? stats.lastIndexed.toLocaleString() : 'Nunca'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}