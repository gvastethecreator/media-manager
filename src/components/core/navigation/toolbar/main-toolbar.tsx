'use client'

import * as React from "react"
import {
  LayoutGrid,
  List,
  CalendarDays,
  Search,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SortMenu } from "./sort-menu"
import type { Column } from "../file-browser/file-browser"

interface MainToolbarProps {
  view: 'grid' | 'list' | 'details'
  onViewChange: (view: 'grid' | 'list' | 'details') => void
  onSearch?: () => void
  onDateSelect?: (date: Date | undefined) => void
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  onSortChange: (by: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => void
  columns?: Column[]
  onColumnsChange?: (columns: Column[]) => void
}

export function MainToolbar({
  view,
  onViewChange,
  onSearch,
  onDateSelect,
  sortBy,
  sortOrder,
  onSortChange,
  columns,
  onColumnsChange
}: MainToolbarProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date)
    onDateSelect?.(date)
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange('grid')}
                  className={cn("h-8 w-8", view === 'grid' && 'bg-muted')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Vista de cuadrícula</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de cuadrícula</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange('list')}
                  className={view === 'list' ? 'bg-muted' : ''}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">Vista de lista</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de lista</TooltipContent>
            </Tooltip>

            <SortMenu
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <CalendarDays className="h-4 w-4" />
                    <span className="sr-only">Calendario</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="rounded-md border shadow-md"
                  />
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>Calendario</TooltipContent>
          </Tooltip>

          <Button
            variant="secondary"
            size="sm"
            onClick={onSearch}
            className="h-8 gap-1.5"
          >
            <Search className="h-4 w-4" />
            <span className="text-xs font-medium">Buscar</span>
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}