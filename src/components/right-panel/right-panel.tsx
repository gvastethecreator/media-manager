'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Settings2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileInfo } from "./file-info"
import { SettingsPanel } from "./settings-panel"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResizablePanel } from "@/components/ui/resizable"

export interface FileItem {
  id: string
  name: string
  type: "file" | "folder" | "image"
  size: string
  dateCreated: string
  dateModified: string
  thumbnail?: string
  dimensions?: string
  children?: FileItem[]
  metadata?: {
    camera?: string
    lens?: string
    focalLength?: string
    aperture?: string
    shutterSpeed?: string
    iso?: string
    location?: string
    tags?: string[]
    rating?: number
    description?: string
    [key: string]: any
  }
}

interface RightPanelProps {
  selectedItem: FileItem | null
  isCollapsed?: boolean
  showSettings?: boolean
  onToggleSettings?: () => void
  onToggleCollapse?: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

export function RightPanel({
  selectedItem,
  isCollapsed = false,
  showSettings = false,
  onToggleSettings,
  onToggleCollapse,
  defaultSize = 25,
  minSize = 15,
  maxSize = 40,
}: RightPanelProps) {
  const [size, setSize] = React.useState(defaultSize)

  if (isCollapsed) {
    return (
      <ResizablePanel defaultSize={5} minSize={5} maxSize={5}>
        <div className="flex flex-col h-full border-l items-center justify-center text-muted-foreground p-2">
          <Button variant="ghost" size="icon" className="rotate-180" onClick={onToggleCollapse}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Expandir panel</span>
          </Button>
          <span className="rotate-90 whitespace-nowrap mt-4">Panel de información</span>
        </div>
      </ResizablePanel>
    )
  }

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      onResize={setSize}
    >
      <div className="flex flex-col h-full border-l">
        <TooltipProvider>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-sm font-medium">
              {showSettings ? "Configuración" : "Información"}
            </h2>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onToggleSettings}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">
                      {showSettings ? "Mostrar información" : "Mostrar configuración"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {showSettings ? "Mostrar información" : "Mostrar configuración"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onToggleCollapse}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Colapsar panel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Colapsar panel</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {showSettings ? (
              <SettingsPanel />
            ) : (
              <FileInfo selectedItem={selectedItem} />
            )}
          </div>
        </TooltipProvider>
      </div>
    </ResizablePanel>
  )
}
