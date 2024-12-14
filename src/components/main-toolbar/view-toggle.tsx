'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Grid2X2, List, Table } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ViewToggleProps {
  view: "grid" | "list" | "details"
  onViewChange: (view: "grid" | "list" | "details") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewChange("grid")}
            className="h-8 w-8"
          >
            <Grid2X2 className="h-4 w-4" />
            <span className="sr-only">Vista en cuadrícula</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Vista en cuadrícula</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewChange("list")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista en lista</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Vista en lista</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "details" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewChange("details")}
            className="h-8 w-8"
          >
            <Table className="h-4 w-4" />
            <span className="sr-only">Vista en detalles</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Vista en detalles</TooltipContent>
      </Tooltip>
    </div>
  )
}