'use client'

import { FileItem } from "./file-view"
import { cn } from "@/lib/utils"
import { FileContextMenu } from "./context-menu"
import { FolderIcon, ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DetailsViewProps {
  files: FileItem[]
  selectedItem: FileItem | null
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
}

export function DetailsView({
  files,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onItemAction,
}: DetailsViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tamaño</TableHead>
          <TableHead>Modificado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <FileContextMenu key={file.id} file={file} onAction={onItemAction}>
            <TableRow
              className={cn(
                "file-item group cursor-pointer",
                selectedItem?.id === file.id ? 'bg-muted' : '',
                "hover:bg-muted/70"
              )}
              onClick={() => onItemClick(file)}
              onDoubleClick={() => onItemDoubleClick(file)}
            >
              <TableCell>
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                    {file.type === 'folder' ? (
                      <FolderIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <span className="text-sm truncate">
                    {file.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {file.type === 'folder' ? 'Carpeta' : 'Imagen'}
              </TableCell>
              <TableCell className="text-sm">
                {file.size}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(file.dateModified).toLocaleDateString()}
              </TableCell>
            </TableRow>
          </FileContextMenu>
        ))}
      </TableBody>
    </Table>
  )
}