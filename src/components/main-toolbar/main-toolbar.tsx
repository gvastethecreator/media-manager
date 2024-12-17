'use client'

import * as React from "react"
import {
  LayoutGrid,
  List,
  Table2,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  SortAsc,
  CalendarDays,
  Search,
  PanelRightClose
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
import { ColumnMenu } from "./column-menu"
import type { Column } from "../file-browser/file-browser"

interface MainToolbarProps {
  view: 'grid' | 'list' | 'details'
  onViewChange: (view: 'grid' | 'list' | 'details') => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  onSort?: () => void
  onSearch?: () => void
  onToggleRightPanel?: () => void
  onDateSelect?: (date: Date | undefined) => void
  canNavigateBack?: boolean
  canNavigateForward?: boolean
  canZoomIn?: boolean
  canZoomOut?: boolean
  isRightPanelOpen?: boolean
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  onSortChange: (by: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => void
  columns?: Column[]
  onColumnsChange?: (columns: Column[]) => void
}

export function MainToolbar({
  view,
  onViewChange,
  onZoomIn,
  onZoomOut,
  onNavigateBack,
  onNavigateForward,
  onSort,
  onSearch,
  onToggleRightPanel,
  onDateSelect,
  canNavigateBack = false,
  canNavigateForward = false,
  canZoomIn = true,
  canZoomOut = true,
  isRightPanelOpen = true,
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
          <SidebarTrigger className="-ml-1.5" />
          <Separator orientation="vertical" className="h-4" />
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
            {(view === 'list' || view === 'details') && columns && onColumnsChange && (
              <ColumnMenu
                columns={columns}
                onColumnChange={onColumnsChange}
              />
            )}
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNavigateBack}
                  disabled={!canNavigateBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Atrás</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atrás</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNavigateForward}
                  disabled={!canNavigateForward}
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="sr-only">Adelante</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adelante</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomOut}
                  disabled={!canZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Reducir</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reducir</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomIn}
                  disabled={!canZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Ampliar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ampliar</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-4" />
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

          <Separator orientation="vertical" className="h-4" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleRightPanel}
              >
                <PanelRightClose
                  className={`h-4 w-4 transition-transform ${!isRightPanelOpen ? 'rotate-180' : ''}`}
                />
                <span className="sr-only">Panel lateral</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Panel lateral</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}