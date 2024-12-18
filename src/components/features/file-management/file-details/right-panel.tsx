'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ResizablePanel } from "@/components/ui/resizable"
import { ChevronRight, Settings2, Moon, Sun, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileInfo } from "./file-info"
import { SettingsPanel } from "./settings-panel"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { FileItem } from '@/store/files'

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
  const { theme, setTheme } = useTheme()
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  const handleToggleCollapse = () => {
    setIsTransitioning(true)
    onToggleCollapse()
  }

  const handleRestart = () => {
    window.location.reload()
  }

  React.useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "bg-muted/30 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/60",
        isCollapsed && "max-w-[40px] transition-all duration-0 ease-in-out",
        isTransitioning && "pointer-events-none"
      )}
    >
      {isCollapsed ? (
        <div className="flex items-center justify-between p-2 h-11 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCollapse}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-2 h-11 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleToggleCollapse}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {showSettings ? (
                <span className="text-xs font-medium">Configuración</span>
              ) : (
                <span className="text-xs font-medium">Detalles</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRestart}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSettings}
                className={cn(
                  "h-7 w-7",
                  showSettings && "bg-accent"
                )}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {showSettings ? (
              <SettingsPanel />
            ) : (
              <FileInfo selectedItem={selectedItem} />
            )}
          </div>
        </div>
      )}
    </ResizablePanel>
  )
}
