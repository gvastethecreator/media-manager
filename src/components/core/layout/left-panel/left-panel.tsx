'use client'

import * as React from "react"
import { ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "next-themes"
import { FolderIcon, BookmarkIcon, TagIcon, ChevronLeft, Settings2, Sun, Moon, RefreshCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/ui/sidebar-item"

interface LeftPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
  isResizing?: boolean
  onTransitionStart?: () => void
  onTransitionEnd?: () => void
  className?: string
}

// Función auxiliar para determinar el color del texto basado en el contraste
const getContrastText = (bgColor: string) => {
  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function LeftPanel({
  isCollapsed,
  onToggleCollapse,
  defaultSize = 25,
  minSize = 15,
  maxSize = 40,
  isResizing,
  onTransitionStart,
  onTransitionEnd,
  className
}: LeftPanelProps) {
  const {
    currentView,
    collections,
    folders,
    tags,
    stats,
    setCurrentView,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag
  } = useFilesStore()

  const { toggleSettings } = useUIStore()
  const { theme, setTheme } = useTheme()
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  const handleTransitionEnd = React.useCallback(() => {
    setIsTransitioning(false)
  }, [])

  const handleToggleCollapse = React.useCallback(() => {
    if (isResizing) return
    onTransitionStart?.()
    onToggleCollapse()
  }, [onToggleCollapse, isResizing, onTransitionStart])

  const handleOpenSettings = React.useCallback(() => {
    toggleSettings()
  }, [toggleSettings])

  const handleThemeToggle = React.useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const handleRestart = React.useCallback(() => {
    window.location.reload()
  }, [])

  const categories = [
    {
      id: 'collections',
      icon: BookmarkIcon,
      label: 'Colecciones',
      color: '#ef4444',
      count: stats.totalCollections
    },
    {
      id: 'folders',
      icon: FolderIcon,
      label: 'Carpetas',
      color: '#f59e0b',
      count: stats.totalFolders
    },
    {
      id: 'tags',
      icon: TagIcon,
      label: 'Etiquetas',
      color: '#0ea5e9',
      count: stats.totalTags
    }
  ]

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn(
        "flex flex-col",
        isCollapsed ? "items-center p-2" : "p-4",
        className
      )}
      onTransitionStart={onTransitionStart}
      onTransitionEnd={onTransitionEnd}
    >
      <div className={cn(
        "flex items-center gap-2 border-b pb-2",
        isCollapsed ? "flex-col w-full" : "w-full justify-between"
      )}>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src="/avatars/01.png" alt="@usuario" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium leading-tight truncate">Nombre Usuario Largo</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stats.totalFiles} archivos</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleThemeToggle}
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
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                isCollapsed && "rotate-90 transform"
              )}
              onClick={handleToggleCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {isCollapsed ? (
        <div className="flex flex-col gap-4 mt-4 w-full">
          {/* Botones de navegación */}
          {categories.map(({ id, icon: Icon, color }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                currentView === id && "bg-accent"
              )}
              onClick={() => setCurrentView(id)}
            >
              <Icon 
                className="h-4 w-4" 
                style={{ color: currentView === id ? color : undefined }}
              />
            </Button>
          ))}

          <div className="mt-auto flex flex-col gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleThemeToggle}
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
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                "rotate-90 transform"
              )}
              onClick={handleToggleCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 w-full">
          <div className="py-2">
            {categories.map(({ id, icon: Icon, label, color, count }) => (
              <div key={id} className="py-1">
                <SidebarItem
                  icon={(props) => <Icon {...props} className="h-5 w-5" style={{ color }} />}
                  label={label}
                  count={count}
                  isActive={currentView === id}
                  onClick={() => setCurrentView(id as any)}
                  onAdd={() => handleOpenSettings(id)}
                  className="px-2"
                />
                <div className="mt-1 space-y-0.5">
                  {id === 'collections' && collections.map((collection) => (
                    <Button
                      key={collection.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-sm px-2"
                      onClick={() => handleSelectCollection(collection.id)}
                    >
                      <span className="text-base">{collection.emoji}</span>
                      <span className="flex-1 text-left truncate">{collection.name}</span>
                      <span className="text-muted-foreground text-xs">{collection.count}</span>
                    </Button>
                  ))}
                  {id === 'folders' && folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-sm px-2"
                      onClick={() => handleSelectFolder(folder.id)}
                    >
                      <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="text-muted-foreground text-xs">{folder.count}</span>
                    </Button>
                  ))}
                  {id === 'tags' && (
                    <div className="flex flex-wrap gap-1 px-2 mt-1">
                      {tags.map((tag) => {
                        const bgColor = tag.color
                        const textColor = getContrastText(bgColor)
                        return (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="cursor-pointer hover:opacity-90 text-xs"
                            style={{
                              backgroundColor: bgColor,
                              color: textColor,
                              boxShadow: `0 1px 2px ${bgColor}40`
                            }}
                            onClick={() => handleSelectTag(tag.name)}
                          >
                            {tag.name}
                            <span className="ml-1 text-[10px]" style={{ color: textColor, opacity: 0.9 }}>
                              {tag.count}
                            </span>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </ResizablePanel>
  )
}
