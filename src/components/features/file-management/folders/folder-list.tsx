'use client'

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Folder, FolderOpen, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { folderService } from "@/services/folder.service"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { formatBytes } from "@/lib/utils"

interface FolderListProps {
  onFolderSelect?: (folderId: string) => void
  selectedFolderId?: string
  className?: string
  isCollapsed?: boolean
}

export function FolderList({
  onFolderSelect,
  selectedFolderId,
  className,
  isCollapsed
}: FolderListProps) {
  const [folders, setFolders] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const loadFolders = async () => {
    try {
      setIsLoading(true)
      const folders = await folderService.getFolders()
      setFolders(folders)
    } catch (error) {
      console.error('Error cargando carpetas:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las carpetas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadFolders()
  }, [])

  const handleReindexFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se seleccione la carpeta al reindexar
    try {
      await folderService.reindexFolder(folderId)
      await loadFolders()
      toast({
        title: "Reindexación completada",
        description: "Se ha actualizado la carpeta correctamente."
      })
    } catch (error) {
      console.error('Error reindexando carpeta:', error)
      toast({
        title: "Error",
        description: "Error al reindexar la carpeta",
        variant: "destructive"
      })
    }
  }

  if (isCollapsed) {
    return (
      <div className={cn("py-2 space-y-2", className)}>
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
            size="icon"
            className="w-full h-8"
            onClick={() => onFolderSelect?.(folder.id)}
          >
            {selectedFolderId === folder.id ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className={cn("px-1", className)}>
      <div className="space-y-1">
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start relative group",
              selectedFolderId === folder.id && "bg-secondary"
            )}
            onClick={() => onFolderSelect?.(folder.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedFolderId === folder.id ? (
                <FolderOpen className="h-4 w-4 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}
              <div className="truncate">
                <div className="text-xs font-medium truncate">
                  {folder.name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <span>{folder._count?.images || 0}</span>
                  <span>·</span>
                  <span>{formatBytes(folder.totalSize || 0)}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleReindexFolder(folder.id, e)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
