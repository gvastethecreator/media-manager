import React from 'react'
import { Button } from "@/components/ui/button"
import { MoreVertical, LayoutGrid, List, Table2, ZoomOut, ZoomIn, Download, Bookmark, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CompactMenuProps {
  setView: (view: 'grid' | 'list' | 'details') => void
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void
}

export function CompactMenu({ setView, setThumbnailSize }: CompactMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Vista</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setView('grid')}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span>Cuadrícula</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setView('list')}>
          <List className="mr-2 h-4 w-4" />
          <span>Lista</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setView('details')}>
          <Table2 className="mr-2 h-4 w-4" />
          <span>Detalles</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tamaño de miniatura</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setThumbnailSize('small')}>
          <ZoomOut className="mr-2 h-4 w-4" />
          <span>Pequeño</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThumbnailSize('medium')}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span>Mediano</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThumbnailSize('large')}>
          <ZoomIn className="mr-2 h-4 w-4" />
          <span>Grande</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          <span>Descargar</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bookmark className="mr-2 h-4 w-4" />
          <span>Marcar</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

