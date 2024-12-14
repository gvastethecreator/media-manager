'use client'

import * as React from "react"
import { Settings2, LayoutGrid, List, Table2, Plus, Search, ZoomIn, ZoomOut, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MainToolbarProps {
  view: 'grid' | 'list' | 'details'
  onViewChange: (view: 'grid' | 'list' | 'details') => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onOpenSettings: () => void
  canNavigateBack?: boolean
  canNavigateForward?: boolean
  canZoomIn?: boolean
  canZoomOut?: boolean
}

export function MainToolbar({
  view,
  onViewChange,
  onZoomIn,
  onZoomOut,
  onNavigateBack,
  onNavigateForward,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  canNavigateBack = false,
  canNavigateForward = false,
  canZoomIn = true,
  canZoomOut = true,
}: MainToolbarProps) {
  return (
    <TooltipProvider>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange('grid')}
                  className={view === 'grid' ? 'bg-muted' : ''}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange('details')}
                  className={view === 'details' ? 'bg-muted' : ''}
                >
                  <Table2 className="h-4 w-4" />
                  <span className="sr-only">Vista de detalles</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de detalles</TooltipContent>
            </Tooltip>
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
        </div>
        <div className="flex-1 px-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Configuración</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configuración</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}