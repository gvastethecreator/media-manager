'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFilesStore } from "@/store/files"
import { useUIStore } from "@/store/ui"
import { useTheme } from "next-themes"
import { FolderIcon, BookmarkIcon, TagIcon, ImageIcon, Settings2, Sun, Moon, RefreshCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/ui/sidebar-item"
import { useSidebar } from "@/components/ui/sidebar"

// Función auxiliar para determinar el color del texto basado en el contraste
const getContrastText = (bgColor: string) => {
  // Convertir color hex a RGB
  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)

  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function LeftSidebar() {
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

  const sidebar = useSidebar()
  const [isTagsExpanded, setIsTagsExpanded] = React.useState(true)

  const handleViewChange = (view: 'collections' | 'folders' | 'tags') => {
    setCurrentView(view)
  }

  const handleOpenSettings = (tab: string) => {
    toggleSettings()
  }

  const categories = [
    {
      id: 'collections',
      icon: BookmarkIcon,
      label: 'Colecciones',
      color: '#ef4444', // rojo
      count: stats.totalCollections
    },
    {
      id: 'folders',
      icon: FolderIcon,
      label: 'Carpetas',
      color: '#f59e0b', // amarillo naranja
      count: stats.totalFolders
    },
    {
      id: 'tags',
      icon: TagIcon,
      label: 'Etiquetas',
      color: '#0ea5e9', // celeste
      count: stats.totalTags
    }
  ]

  return (
    <aside
      data-state={sidebar.state}
      data-collapsed={sidebar.state === "collapsed"}
      className={cn(
        "group/sidebar relative flex h-full flex-col overflow-hidden border-r bg-background transition-all duration-300 ease-in-out",
        sidebar.state === "collapsed" ? "w-[50px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col">
        <div
          role="button"
          onClick={() => handleOpenSettings('profile')}
          className="h-11 px-2 flex items-center gap-2 border-b hover:bg-accent/50 cursor-pointer"
        >
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src="/avatars/01.png" alt="@usuario" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          {sidebar.state !== "collapsed" && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium leading-tight truncate">Nombre Usuario Largo</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{stats.totalFiles} archivos</span>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="py-2">
            {categories.map(({ id, icon: Icon, label, color, count }) => (
              <div key={id} className="py-1">
                <SidebarItem
                  icon={(props) => <Icon {...props} className="h-5 w-5" style={{ color }} />}
                  label={label}
                  count={count}
                  isActive={currentView === id}
                  onClick={() => handleViewChange(id as any)}
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

      </div>
    </aside>
  )
}
// Ejemplo de colores variados para tags
const tagColors = [
  '#ef4444', // rojo
  '#f97316', // naranja
  '#f59e0b', // amarillo naranja
  '#84cc16', // verde lima
  '#22c55e', // verde
  '#06b6d4', // cyan
  '#0ea5e9', // celeste
  '#6366f1', // indigo
  '#a855f7', // púrpura
  '#ec4899', // rosa
  '#f43f5e', // rosa rojo
  '#64748b', // slate
]

