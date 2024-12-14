'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { MoreVertical, Grid2X2, List, Table, Square } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface CompactMenuProps {
  view: "grid" | "list" | "details"
  onViewChange: (view: "grid" | "list" | "details") => void
  thumbnailSize: "small" | "medium" | "large"
  onThumbnailSizeChange: (size: "small" | "medium" | "large") => void
  sortBy: "name" | "date" | "size"
  sortOrder: "asc" | "desc"
  onSort: (by: "name" | "date" | "size") => void
}

export function CompactMenu({
  view,
  onViewChange,
  thumbnailSize,
  onThumbnailSizeChange,
  sortBy,
  sortOrder,
  onSort,
}: CompactMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Más opciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Vista</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onViewChange("grid")}>
            <Grid2X2 className="mr-2 h-4 w-4" />
            Vista en cuadrícula
            {view === "grid" && " ✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewChange("list")}>
            <List className="mr-2 h-4 w-4" />
            Vista en lista
            {view === "list" && " ✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewChange("details")}>
            <Table className="mr-2 h-4 w-4" />
            Vista en detalles
            {view === "details" && " ✓"}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {view === "grid" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tamaño de miniaturas</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onThumbnailSizeChange("small")}>
                <Square className="mr-2 h-3 w-3" />
                Pequeñas
                {thumbnailSize === "small" && " ✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThumbnailSizeChange("medium")}>
                <Square className="mr-2 h-4 w-4" />
                Medianas
                {thumbnailSize === "medium" && " ✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThumbnailSizeChange("large")}>
                <Square className="mr-2 h-5 w-5" />
                Grandes
                {thumbnailSize === "large" && " ✓"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onSort("name")}>
            Nombre
            {sortBy === "name" && ` (${sortOrder === "asc" ? "↑" : "↓"})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("date")}>
            Fecha
            {sortBy === "date" && ` (${sortOrder === "asc" ? "↑" : "↓"})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("size")}>
            Tamaño
            {sortBy === "size" && ` (${sortOrder === "asc" ? "↑" : "↓"})`}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}