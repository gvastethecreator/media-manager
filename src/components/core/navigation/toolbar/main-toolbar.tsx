'use client'

import * as React from "react"
import {
  LayoutGrid,
  List,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SortMenu } from "./sort-menu"
import type { Column } from "../file-browser/file-browser"

interface MainToolbarProps {
  view: 'grid' | 'list' | 'details'
  onViewChange: (view: 'grid' | 'list' | 'details') => void
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  onSortChange: (by: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => void
  columns?: Column[]
  onColumnsChange?: (columns: Column[]) => void
}

export function MainToolbar({
  view,
  onViewChange,
  sortBy,
  sortOrder,
  onSortChange,
  columns,
  onColumnsChange
}: MainToolbarProps) {
  return (
    <div className="flex items-center justify-between p-1 border-b">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", view === 'grid' && "bg-muted")}
          onClick={() => onViewChange('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", view === 'list' && "bg-muted")}
          onClick={() => onViewChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center">
        <SortMenu
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          columns={columns}
          onColumnsChange={onColumnsChange}
        />
      </div>
    </div>
  )
}