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
import type { FileItem } from '@/types/files'

interface RightPanelProps {
  selectedItem: FileItem | null
  isCollapsed: boolean
  showSettings: boolean
  onToggleSettings: () => void
  onToggleCollapse: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
  isResizing?: boolean
}

interface ActionButtonsProps {
  showSettings: boolean
  onToggleSettings: () => void
}

// Componente separado para los botones de acción para evitar re-renders innecesarios
const ActionButtons = React.memo(function ActionButtons({ showSettings, onToggleSettings }: ActionButtonsProps) {
  const { theme, setTheme } = useTheme()

  const handleRestart = React.useCallback(() => {
    window.location.reload()
  }, [])

  const handleThemeToggle = React.useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return (
    <>

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

ActionButtons.displayName = 'ActionButtons'

export function RightPanel({
  selectedItem,
  isCollapsed,
  showSettings,
  onToggleSettings,
  onToggleCollapse,
  defaultSize = 20,
  minSize = 15,
  maxSize = 70,
  isResizing
}: RightPanelProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  const handleTransitionEnd = React.useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const handleToggleCollapse = React.useCallback(() => {
    if (isResizing) return
    setIsTransitioning(true)
    onToggleCollapse()
  }, [onToggleCollapse, isResizing])

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "border-l transition-[flex-basis] duration-300 ease-in-out",
        isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
        isResizing && "select-none pointer-events-none"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-2 h-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleCollapse}
            disabled={isResizing}
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              !isCollapsed && "rotate-180"
            )} />
          </Button>
          {!isCollapsed && (
            <ActionButtons showSettings={showSettings} onToggleSettings={onToggleSettings} />
          )}
        </div>
        <Separator />
        <ScrollArea
          className={cn(
            "flex-1",
            isResizing && "pointer-events-none"
          )}
        >
          {isCollapsed ? null : showSettings ? <SettingsPanel /> : <FileInfo selectedItem={selectedItem} />}
        </ScrollArea>
      </div>
    </ResizablePanel>
  )
}
