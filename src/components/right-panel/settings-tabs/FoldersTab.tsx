import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Folder, RefreshCw, Trash2 } from 'lucide-react'

const folders = [
  { name: "Documentos", count: 56 },
  { name: "Imágenes", count: 412 },
  { name: "Proyectos", count: 7 },
]

export function FoldersTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input placeholder="Ruta de la carpeta" />
        <Button>Agregar</Button>
      </div>
      <div className="space-y-2">
        {folders.map((folder) => (
          <div key={folder.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4" />
              <span>{folder.name}</span>
              <span className="text-xs text-muted-foreground">({folder.count} items)</span>
            </div>
            <div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

