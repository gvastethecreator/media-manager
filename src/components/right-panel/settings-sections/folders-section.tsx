'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FolderPlus, RefreshCw, Trash2 } from "lucide-react"
import { useSettingsContext } from "@/contexts/SettingsContext"

export function FoldersSection() {
  const { settings, updateFolder } = useSettingsContext()
  const { folders } = settings
  const [newFolderPath, setNewFolderPath] = React.useState("")

  const handleAddFolder = async () => {
    if (!newFolderPath) return
    const newFolder = {
      path: newFolderPath,
      fileCount: 0,
      size: "0 B",
      autoIndex: true,
      excludePatterns: [],
      includePatterns: ["*.jpg", "*.png", "*.gif", "*.webp"]
    }
    await updateFolder(newFolderPath, newFolder)
    setNewFolderPath("")
  }

  const handleRemoveFolder = async (path: string) => {
    await updateFolder(path, { path, fileCount: 0, size: "0 B" })
  }

  const handleRefreshFolder = async (path: string) => {
    // Implementar lógica de reindexado
    console.log("Reindexando:", path)
  }

  const getTotalStats = () => {
    return {
      totalFolders: folders.length,
      totalFiles: folders.reduce((sum, folder) => sum + folder.fileCount, 0),
      totalSize: folders.reduce((sum, folder) => {
        const size = parseFloat(folder.size.split(" ")[0])
        const unit = folder.size.split(" ")[1]
        // Convertir todo a GB para la suma
        switch (unit) {
          case "TB":
            return sum + size * 1024
          case "GB":
            return sum + size
          case "MB":
            return sum + size / 1024
          case "KB":
            return sum + size / (1024 * 1024)
          case "B":
            return sum + size / (1024 * 1024 * 1024)
          default:
            return sum
        }
      }, 0).toFixed(2)
    }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Ingresa la ruta de la carpeta..."
              className="w-full"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
            />
          </div>
          <Button className="flex gap-2" onClick={handleAddFolder}>
            <FolderPlus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4">
            {folders.map((folder) => (
              <Card key={folder.path} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{folder.path}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder.fileCount} archivos · {folder.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRefreshFolder(folder.path)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveFolder(folder.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex gap-2 flex-1"
              onClick={() => folders.forEach(folder => handleRefreshFolder(folder.path))}
            >
              <RefreshCw className="h-4 w-4" />
              Reindexar todo
            </Button>
            <Button
              variant="outline"
              className="flex gap-2 flex-1 text-destructive"
              onClick={() => folders.forEach(folder => handleRemoveFolder(folder.path))}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar todo
            </Button>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Información del sistema</p>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Carpetas totales: {stats.totalFolders}</p>
                <p>Archivos totales: {stats.totalFiles}</p>
                <p>Peso total: {stats.totalSize} GB</p>
                <p>Extensiones: .jpg, .png, .gif, .webp</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}