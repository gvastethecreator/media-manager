'use client'

import { Columns } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { Column } from '@/components/file-browser/file-browser'

interface ColumnMenuProps {
  columns: Column[]
  onColumnChange: (columns: Column[]) => void
}

export function ColumnMenu({ columns, onColumnChange }: ColumnMenuProps) {
  const handleColumnToggle = (columnId: string) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId && col.isHideable) {
        return { ...col, isVisible: !col.isVisible }
      }
      return col
    })
    onColumnChange(newColumns)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Columns className="h-4 w-4" />
          <span className="sr-only">Columnas</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(column => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.isVisible}
            onCheckedChange={() => handleColumnToggle(column.id)}
            disabled={!column.isHideable}
          >
            <div className="flex items-center gap-2">
              {column.icon}
              <span>{column.label}</span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}