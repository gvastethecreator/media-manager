'use client'

import { Copy, Download, Info, Pencil, Share2, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { FileItem } from "./file-browser"

interface FileContextMenuProps {
  file: FileItem
  children: React.ReactNode
  onAction: (action: string, file: FileItem) => void
}

export function FileContextMenu({ file, children, onAction }: FileContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {file.type === 'image' && (
          <ContextMenuItem onClick={() => onAction('preview', file)}>
            Ver imagen
            <ContextMenuShortcut>⏎</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onAction('open', file)}>
          Abrir
          <ContextMenuShortcut>⌘O</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction('download', file)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction('share', file)}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction('copy', file)}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onAction('rename', file)}>
          <Pencil className="mr-2 h-4 w-4" />
          Renombrar
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAction('delete', file)} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onAction('info', file)}>
          <Info className="mr-2 h-4 w-4" />
          Propiedades
          <ContextMenuShortcut>⌘I</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}