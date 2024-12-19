'use client'

import * as React from "react"
import { ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { useStatsStore } from '@/store/stats'
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "next-themes"
import { FolderIcon, BookmarkIcon, TagIcon, ChevronLeft, Settings2, Sun, Moon, RefreshCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/ui/sidebar-item"
import { FolderList } from "@/components/features/file-management/folders/folder-list"
import { BookmarkIcon, ChevronLeft, FolderIcon, ImageIcon, Moon, RefreshCcw, Sun, TagIcon } from "lucide-react"

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
  const { stats } = useStatsStore()
  const {
    currentView,
    collections,
    folders,
    tags,
    setCurrentView,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    initialize
  } = useFilesStore()

  const { toggleSettings } = useUIStore()
  const { theme, setTheme } = useTheme()
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | undefined>()

  React.useEffect(() => {
    useStatsStore.getState().initialize()
    initialize()
  }, [initialize])

  const handleFolderSelect = React.useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
    handleSelectFolder(folderId)
  }, [handleSelectFolder])

  const handleOpenSettings = React.useCallback(() => {
    toggleSettings()
  }, [toggleSettings])

  const handleThemeToggle = React.useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const handleRestart = React.useCallback(() => {
    window.location.reload()
  }, [])

  const categories = React.useMemo(() => [
    {
      id: 'all',
      icon: ImageIcon,
      label: 'Todos',
      color: '#3b82f6',
      count: stats?.totalFiles || 0
    },
    {
      id: 'collections',
      icon: BookmarkIcon,
      label: 'Colecciones',
      color: '#ef4444',
      count: stats?.totalCollections || 0
    },
    {
      id: 'folders',
      icon: FolderIcon,
      label: 'Carpetas',
      color: '#22c55e',
      count: stats?.totalFolders || 0
    },
    {
      id: 'tags',
      icon: TagIcon,
      label: 'Etiquetas',
      color: '#f59e0b',
      count: stats?.totalTags || 0
    }
  ], [stats])

  const handleItemClick = React.useCallback((id: string, itemId?: string) => {
    if (itemId) {
      switch (id) {
        case 'collections':
          handleSelectCollection(itemId);
          break;
        case 'folders':
          handleSelectFolder(itemId);
          break;
        case 'tags':
          handleSelectTag(itemId);
          break;
      }
    } else {
      setCurrentView(id);
    }
  }, [handleSelectCollection, handleSelectFolder, handleSelectTag, setCurrentView]);

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      collapsible={true}
      collapsedSize={5}
      minSize={minSize}
      maxSize={maxSize}
      onCollapse={onToggleCollapse}
      className={cn(
        "flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-[52px] items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/app-logo.png" alt="Logo" />
            <AvatarFallback>IM</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Image Manager</span>
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleThemeToggle}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 p-2">
          {isCollapsed ? (
            <div className="flex flex-col gap-4 mt-4 w-full">
              {categories.map(({ id, icon: Icon, color }) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    currentView === id && "bg-accent"
                  )}
                  onClick={() => handleItemClick(id)}
                >
                  <Icon 
                    className="h-4 w-4" 
                    style={{ color: currentView === id ? color : undefined }}
                  />
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              {categories.map(({ id, icon: Icon, label, color, count }) => (
                <div key={id} className="py-1">
                  <SidebarItem
                    icon={Icon}
                    label={label}
                    count={count}
                    isActive={currentView === id}
                    onClick={() => handleItemClick(id)}
                  />
                  <div className="mt-1 space-y-0.5">
                    {id === 'collections' && collections?.map((collection) => (
                      <Button
                        key={collection.id}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-8 text-sm px-2"
                        onClick={() => handleItemClick('collections', collection.id)}
                      >
                        <span className="text-base">{collection.emoji}</span>
                        <span className="flex-1 text-left truncate">{collection.name}</span>
                        <span className="text-muted-foreground text-xs">{collection.count}</span>
                      </Button>
                    ))}
                    {id === 'folders' && folders?.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-8 text-sm px-2"
                        onClick={() => handleItemClick('folders', folder.id)}
                      >
                        <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <span className="text-muted-foreground text-xs">{folder.count}</span>
                      </Button>
                    ))}
                    {id === 'tags' && tags?.map((tag) => (
                      <Button
                        key={tag.id}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-8 text-sm px-2"
                        onClick={() => handleItemClick('tags', tag.name)}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="flex-1 text-left truncate">{tag.name}</span>
                        <span className="text-muted-foreground text-xs">{tag.count}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </ResizablePanel>
  )
}
