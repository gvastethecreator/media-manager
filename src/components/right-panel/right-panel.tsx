'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ResizablePanel } from "@/components/ui/resizable"
import { ChevronLeft, ChevronRight, Settings2, InfoIcon, PanelRightClose } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileInfo } from "./file-info"
import type { FileItem } from '@/store/files'
import { cn } from "@/lib/utils"

interface RightPanelProps {
  selectedItem: FileItem | null
  isCollapsed: boolean
  showSettings: boolean
  onToggleSettings: () => void
  onToggleCollapse: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

export function RightPanel({
  selectedItem,
  isCollapsed,
  showSettings,
  onToggleSettings,
  onToggleCollapse,
  defaultSize = 25,
  minSize = 15,
  maxSize = 40
}: RightPanelProps) {
  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "bg-muted/30 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/60",
        isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
      )}
    >
      {isCollapsed ? (
        <div className="h-full flex flex-col items-center justify-start pt-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-2 h-11">
            <div className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Detalles</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSettings}
                className="h-8 w-8"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator className="mb-4" />
          <FileInfo selectedItem={selectedItem} />
        </div>
      )}
    </ResizablePanel>
  )
}
