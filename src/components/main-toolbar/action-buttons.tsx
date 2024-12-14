'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Copy, Download, Share2, Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ActionButtonsProps {
  onCopy?: () => void
  onShare?: () => void
  onDownload?: () => void
  onDelete?: () => void
  disabled?: boolean
}

export function ActionButtons({
  onCopy,
  onShare,
  onDownload,
  onDelete,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {onCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              disabled={disabled}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copiar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center gap-2">
              <span>Copiar</span>
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                Ctrl+C
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {onShare && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              disabled={disabled}
              className="h-8 w-8"
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Compartir</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Compartir</TooltipContent>
        </Tooltip>
      )}

      {onDownload && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              disabled={disabled}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Descargar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Descargar</TooltipContent>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={disabled}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center gap-2">
              <span>Eliminar</span>
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                Supr
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}