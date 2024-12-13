"use client"

import { useState } from "react"
import { ChevronRight, FolderIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface FolderItem {
  id: string
  name: string
  count: number
  children?: FolderItem[]
  parentId?: string
}

interface FoldersProps {
  folders: FolderItem[]
  onFolderClick?: (folder: FolderItem) => void
  onCreateFolder?: (folder: Partial<FolderItem>) => void
}

export function Folders({
  folders,
  onFolderClick,
  onCreateFolder,
}: FoldersProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>()
  const [newFolder, setNewFolder] = useState({
    name: "",
    parentId: undefined as string | undefined,
  })

  const handleCreate = () => {
    if (newFolder.name.trim() && onCreateFolder) {
      onCreateFolder({
        name: newFolder.name,
        parentId: selectedParentId,
      })
      setNewFolder({ name: "", parentId: undefined })
      setIsCreating(false)
    }
  }

  const renderFolder = (folder: FolderItem, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id} style={{ paddingLeft: `${level * 12}px` }}>
        <Collapsible>
          <div
            className={cn(
              "group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50",
              onFolderClick && "cursor-pointer"
            )}
            onClick={() => onFolderClick?.(folder)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onFolderClick?.(folder)
              }
            }}
          >
            {hasChildren ? (
              <CollapsibleTrigger
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronRight className="h-4 w-4" />
              </CollapsibleTrigger>
            ) : (
              <div className="w-6" />
            )}
            <FolderIcon className="h-4 w-4 text-blue-500" />
            <span className="flex-1 truncate">{folder.name}</span>
            <span className="text-xs text-muted-foreground">
              ({folder.count})
            </span>
            {level === 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedParentId(folder.id)
                  setIsCreating(true)
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Crear subcarpeta</span>
              </Button>
            )}
          </div>
          {hasChildren && (
            <CollapsibleContent className="pt-1">
              {folder.children?.map((child) => renderFolder(child, level + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carpetas</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Crear carpeta</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva carpeta</DialogTitle>
              <DialogDescription>
                {selectedParentId
                  ? "Crea una nueva subcarpeta"
                  : "Crea una nueva carpeta raíz"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newFolder.name}
                  onChange={(e) =>
                    setNewFolder({ ...newFolder, name: e.target.value })
                  }
                  placeholder="Mi carpeta"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-1">
          {folders.map((folder) => renderFolder(folder))}
        </div>
      </ScrollArea>
    </div>
  )
}