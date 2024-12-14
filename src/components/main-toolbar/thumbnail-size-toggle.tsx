'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Square, SquareIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThumbnailSizeToggleProps {
  size: "small" | "medium" | "large"
  onSizeChange: (size: "small" | "medium" | "large") => void
}

export function ThumbnailSizeToggle({
  size,
  onSizeChange,
}: ThumbnailSizeToggleProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={size === "small" ? "default" : "ghost"}
            size="icon"
            onClick={() => onSizeChange("small")}
            className="h-8 w-8"
          >
            <Square className="h-3 w-3" />
            <span className="sr-only">Miniaturas pequeñas</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Miniaturas pequeñas</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={size === "medium" ? "default" : "ghost"}
            size="icon"
            onClick={() => onSizeChange("medium")}
            className="h-8 w-8"
          >
            <Square className="h-4 w-4" />
            <span className="sr-only">Miniaturas medianas</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Miniaturas medianas</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={size === "large" ? "default" : "ghost"}
            size="icon"
            onClick={() => onSizeChange("large")}
            className="h-8 w-8"
          >
            <Square className="h-5 w-5" />
            <span className="sr-only">Miniaturas grandes</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Miniaturas grandes</TooltipContent>
      </Tooltip>
    </div>
  )
}