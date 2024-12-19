'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
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
  onResizeStart?: () => void
  onResizeEnd?: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

// Componente separado para los botones de acción para evitar re-renders innecesarios
const ActionButtons = React.memo(function ActionButtons({ showSettings, onToggleSettings }: { showSettings: boolean; onToggleSettings: () => void }) {
  const { theme, setTheme } = useTheme()

  const handleRestart = React.useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <>
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
    </>
  )
})

export function RightPanel({
  selectedItem,
  isCollapsed,
  showSettings,
  onToggleSettings,
  onToggleCollapse,
  onResizeStart,
  onResizeEnd,
  defaultSize = 60,
  minSize = 20,
  maxSize = 70
}: RightPanelProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  const handleToggleCollapse = React.useCallback(() => {
    setIsTransitioning(true)
    onToggleCollapse()
  }, [onToggleCollapse])

  React.useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  const panelContent = React.useMemo(() => {
    return showSettings ? <SettingsPanel /> : <FileInfo selectedItem={selectedItem} />
  }, [showSettings, selectedItem])

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      onResize={(size) => {
        if (size < minSize + 5) {
          handleToggleCollapse()
        }
      }}
      className={cn(
        "bg-muted/30 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/60",
        isCollapsed && "max-w-[40px] transition-all duration-0 ease-in-out",
        isTransitioning && "pointer-events-none"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-2 h-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleCollapse}
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              !isCollapsed && "rotate-180"
            )} />
          </Button>
          <ActionButtons showSettings={showSettings} onToggleSettings={onToggleSettings} />
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          {panelContent}
        </ScrollArea>
      </div>
    </ResizablePanel>
  )
}
