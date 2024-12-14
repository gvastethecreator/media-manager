'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFiles } from "@/context/FilesContext"
import { FolderIcon, BookmarkIcon, TagIcon, ImageIcon, Settings2, ChevronDown, Plus, CalendarIcon, LayoutGridIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { SidebarItem } from "@/components/ui/sidebar-item"
import { useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

// Memoized header component
const SidebarHeader = React.memo(({
  stats,
  sidebarState,
  onOpenSettings
}: {
  stats: { totalFiles: number }
  sidebarState: string
  onOpenSettings: () => void
}) => (
  <div className={cn(
    "flex items-center justify-between px-4 mb-4",
    sidebarState === "collapsed" && "justify-center px-2"
  )}>
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src="/avatars/01.png" alt="@usuario" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      {sidebarState !== "collapsed" && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">Usuario</span>
          <span className="text-xs text-muted-foreground">{stats.totalFiles} imágenes</span>
        </div>
      )}
    </div>
    {sidebarState !== "collapsed" && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuItem>Tema</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </div>
))
SidebarHeader.displayName = "SidebarHeader"

// Memoized navigation buttons component
const NavigationButtons = React.memo(({
  currentView,
  sidebarState,
  stats,
  onViewChange,
  onOpenSettings
}: {
  currentView: string
  sidebarState: string
  stats: { totalCollections: number; totalFolders: number; totalTags: number }
  onViewChange: (view: 'collections' | 'folders' | 'tags') => void
  onOpenSettings: (tab: string) => void
}) => {
  if (sidebarState === "collapsed") {
    return (
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-full h-9", currentView === 'collections' && "bg-muted")}
          onClick={() => onViewChange('collections')}
        >
          <BookmarkIcon className="h-4 w-4" />
          <span className="sr-only">Colecciones</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-full h-9", currentView === 'folders' && "bg-muted")}
          onClick={() => onViewChange('folders')}
        >
          <FolderIcon className="h-4 w-4" />
          <span className="sr-only">Carpetas</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("w-full h-9", currentView === 'tags' && "bg-muted")}
          onClick={() => onViewChange('tags')}
        >
          <TagIcon className="h-4 w-4" />
          <span className="sr-only">Etiquetas</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <SidebarItem
        icon={BookmarkIcon}
        label="Colecciones"
        count={stats.totalCollections}
        isActive={currentView === 'collections'}
        onClick={() => onViewChange('collections')}
        onAdd={() => onOpenSettings('collections')}
      />
      <SidebarItem
        icon={FolderIcon}
        label="Carpetas"
        count={stats.totalFolders}
        isActive={currentView === 'folders'}
        onClick={() => onViewChange('folders')}
        onAdd={() => onOpenSettings('folders')}
      />
      <SidebarItem
        icon={TagIcon}
        label="Etiquetas"
        count={stats.totalTags}
        isActive={currentView === 'tags'}
        onClick={() => onViewChange('tags')}
        onAdd={() => onOpenSettings('tags')}
      />
    </div>
  )
})
NavigationButtons.displayName = "NavigationButtons"

// Memoized collection list component
const CollectionList = React.memo(({
  collections,
  onSelectCollection,
  onOpenSettings
}: {
  collections: any[]
  onSelectCollection: (id: string) => void
  onOpenSettings: (tab: string) => void
}) => (
  <div className="px-3 py-2">
    <div className="mb-2 px-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">Colecciones</h2>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenSettings('collections')}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <div className="space-y-1">
      {collections.map((collection) => (
        <Button
          key={collection.id}
          variant="ghost"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onSelectCollection(collection.id)}
        >
          <span className="text-xl">{collection.emoji}</span>
          <span className="flex-1 text-left truncate">{collection.name}</span>
          <span className="text-muted-foreground text-xs">{collection.count}</span>
        </Button>
      ))}
    </div>
  </div>
))
CollectionList.displayName = "CollectionList"

// Memoized folder list component
const FolderList = React.memo(({
  folders,
  onSelectFolder,
  onOpenSettings
}: {
  folders: any[]
  onSelectFolder: (id: string) => void
  onOpenSettings: (tab: string) => void
}) => (
  <div className="px-3 py-2">
    <div className="mb-2 px-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">Carpetas</h2>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenSettings('folders')}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <div className="space-y-1">
      {folders.map((folder) => (
        <Button
          key={folder.id}
          variant="ghost"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onSelectFolder(folder.id)}
        >
          <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
          <span className="flex-1 text-left truncate">{folder.name}</span>
          <span className="text-muted-foreground text-xs">{folder.count}</span>
        </Button>
      ))}
    </div>
  </div>
))
FolderList.displayName = "FolderList"

// Memoized tag list component
const TagList = React.memo(({
  tags,
  isExpanded,
  onToggleExpand,
  onSelectTag,
  onOpenSettings
}: {
  tags: any[]
  isExpanded: boolean
  onToggleExpand: () => void
  onSelectTag: (name: string) => void
  onOpenSettings: (tab: string) => void
}) => (
  <div className="px-3 py-2">
    <div className="mb-2 px-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">Etiquetas</h2>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenSettings('tags')}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", !isExpanded && "rotate-180")} />
        </Button>
      </div>
    </div>
    {isExpanded && (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 px-4">
          {tags.slice(0, 5).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="cursor-pointer hover:bg-muted"
              style={{ backgroundColor: `${tag.color}20` }}
              onClick={() => onSelectTag(tag.name)}
            >
              {tag.name}
              <span className="ml-1 text-xs text-muted-foreground">
                {tag.count}
              </span>
            </Badge>
          ))}
        </div>
        <div className="space-y-1">
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant="ghost"
              className="w-full justify-start gap-2 h-9"
              onClick={() => onSelectTag(tag.name)}
            >
              <TagIcon className="h-4 w-4" style={{ color: tag.color }} />
              <span className="flex-1 text-left truncate">{tag.name}</span>
              <span className="text-muted-foreground text-xs">{tag.count}</span>
            </Button>
          ))}
        </div>
      </div>
    )}
  </div>
))
TagList.displayName = "TagList"

// Memoized calendar component
const CalendarFooter = React.memo(({
  date,
  onDateChange,
  sidebarState
}: {
  date?: Date
  onDateChange: (date?: Date) => void
  sidebarState: string
}) => {
  if (sidebarState === "collapsed") {
    return (
      <div className="mt-auto p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full h-9">
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Calendario</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <footer className="mt-auto border-t p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Seleccionar fecha</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </footer>
  )
})
CalendarFooter.displayName = "CalendarFooter"

export function LeftSidebar() {
  const {
    setCurrentView,
    collections,
    folders,
    tags,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    stats
  } = useFiles()

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [settingsTab, setSettingsTab] = React.useState<string>('general')

  const handleOpenSettings = (tab: string) => {
    setSettingsTab(tab)
    setIsSettingsOpen(true)
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Biblioteca
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9"
              onClick={() => setCurrentView('cards')}
            >
              <LayoutGridIcon className="h-4 w-4" />
              <span>Todas las tarjetas</span>
            </Button>
          </div>
        </div>
        <Separator className="my-2" />
        <CollectionList
          collections={collections}
          onSelectCollection={handleSelectCollection}
          onOpenSettings={handleOpenSettings}
        />
        <Separator className="my-2" />
        <FolderList
          folders={folders}
          onSelectFolder={handleSelectFolder}
          onOpenSettings={handleOpenSettings}
        />
        <Separator className="my-2" />
        <TagList
          tags={tags}
          onSelectTag={handleSelectTag}
          onOpenSettings={handleOpenSettings}
        />
      </div>
      <Separator />
      <div className="p-4 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-2">
          <div>Total archivos:</div>
          <div className="text-right">{stats.totalFiles}</div>
          <div>Tamaño total:</div>
          <div className="text-right">{stats.totalSize}</div>
        </div>
      </div>
    </div>
  )
}
