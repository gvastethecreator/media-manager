'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFiles } from "@/context/FilesContext"
import { FolderIcon, BookmarkIcon, TagIcon, ImageIcon, Settings2, ChevronDown, Plus, CalendarIcon } from "lucide-react"
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

export function LeftSidebar() {
  const {
    currentView,
    setCurrentView,
    collections,
    folders,
    tags,
    stats,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag
  } = useFiles()

  const sidebar = useSidebar()
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [isTagsExpanded, setIsTagsExpanded] = React.useState(true)

  const handleViewChange = (view: 'collections' | 'folders' | 'tags') => {
    setCurrentView(view)
  }

  const handleOpenSettings = (tab: string) => {
    // TODO: Implement settings panel
    console.log('Open settings tab:', tab)
  }

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
        <header className="px-3 py-2 border-b">
          <div className={cn(
            "flex items-center justify-between px-4 mb-4",
            sidebar.state === "collapsed" && "justify-center px-2"
          )}>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/avatars/01.png" alt="@usuario" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              {sidebar.state !== "collapsed" && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Usuario</span>
                  <span className="text-xs text-muted-foreground">{stats.totalFiles} imágenes</span>
                </div>
              )}
            </div>
            {sidebar.state !== "collapsed" && (
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
          {sidebar.state === "collapsed" ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-full h-9", currentView === 'collections' && "bg-muted")}
                onClick={() => handleViewChange('collections')}
              >
                <BookmarkIcon className="h-4 w-4" />
                <span className="sr-only">Colecciones</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-full h-9", currentView === 'folders' && "bg-muted")}
                onClick={() => handleViewChange('folders')}
              >
                <FolderIcon className="h-4 w-4" />
                <span className="sr-only">Carpetas</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("w-full h-9", currentView === 'tags' && "bg-muted")}
                onClick={() => handleViewChange('tags')}
              >
                <TagIcon className="h-4 w-4" />
                <span className="sr-only">Etiquetas</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <SidebarItem
                icon={BookmarkIcon}
                label="Colecciones"
                count={stats.totalCollections}
                isActive={currentView === 'collections'}
                onClick={() => handleViewChange('collections')}
                onAdd={() => handleOpenSettings('collections')}
              />
              <SidebarItem
                icon={FolderIcon}
                label="Carpetas"
                count={stats.totalFolders}
                isActive={currentView === 'folders'}
                onClick={() => handleViewChange('folders')}
                onAdd={() => handleOpenSettings('folders')}
              />
              <SidebarItem
                icon={TagIcon}
                label="Etiquetas"
                count={stats.totalTags}
                isActive={currentView === 'tags'}
                onClick={() => handleViewChange('tags')}
                onAdd={() => handleOpenSettings('tags')}
              />
            </div>
          )}
        </header>
        {sidebar.state !== "collapsed" ? (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <div className="mb-2 px-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Colecciones</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSettings('collections')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {collections.map((collection) => (
                      <Button
                        key={collection.id}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-9"
                        onClick={() => handleSelectCollection(collection.id)}
                      >
                        <span className="text-xl">{collection.emoji}</span>
                        <span className="flex-1 text-left truncate">{collection.name}</span>
                        <span className="text-muted-foreground text-xs">{collection.count}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="mb-2 px-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Carpetas</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSettings('folders')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-9"
                        onClick={() => handleSelectFolder(folder.id)}
                      >
                        <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <span className="text-muted-foreground text-xs">{folder.count}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="mb-2 px-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Etiquetas</h2>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSettings('tags')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsTagsExpanded(!isTagsExpanded)}>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", !isTagsExpanded && "rotate-180")} />
                      </Button>
                    </div>
                  </div>
                  {isTagsExpanded && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1 px-4">
                        {tags.slice(0, 5).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-muted"
                            style={{ backgroundColor: `${tag.color}20` }}
                            onClick={() => handleSelectTag(tag.name)}
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
                            onClick={() => handleSelectTag(tag.name)}
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
              </div>
            </ScrollArea>
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
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </footer>
          </>
        ) : (
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
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </aside>
  )
}
