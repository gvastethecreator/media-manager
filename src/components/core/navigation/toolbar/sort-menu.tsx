'use client'

import { Button } from "@/components/ui/button"
import { SortAsc, ArrowDown, ArrowUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

type SortOption = 'name' | 'date' | 'size' | 'type'

interface SortMenuProps {
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  onSortChange: (by: SortOption, order: 'asc' | 'desc') => void
}

const sortOptions = [
  { id: 'name' as SortOption, label: 'Nombre', description: 'Ordenar alfabéticamente' },
  { id: 'date' as SortOption, label: 'Fecha', description: 'Ordenar por fecha de modificación' },
  { id: 'size' as SortOption, label: 'Tamaño', description: 'Ordenar por tamaño de archivo' },
  { id: 'type' as SortOption, label: 'Tipo', description: 'Ordenar por tipo de archivo' },
]

export function SortMenu({ sortBy, sortOrder, onSortChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <SortAsc className="h-4 w-4" />
          <span className="sr-only">Ordenar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="start"
        alignOffset={-4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Ordenar por</span>
            <span className="text-xs text-muted-foreground">
              {sortOptions.find(opt => opt.id === sortBy)?.label || 'Selecciona un criterio'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(value) => onSortChange(value, sortOrder)}
        >
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.id}
              value={option.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
              {sortBy === option.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSortChange(option.id, sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 