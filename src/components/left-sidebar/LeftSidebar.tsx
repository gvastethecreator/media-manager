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
          <Button
            variant="ghost"
            className={cn(
              "w-full h-auto p-2",
              "flex items-center",
              sidebar.state === "collapsed"
                ? "justify-center"
                : "justify-start gap-3"
            )}
            onClick={() => handleOpenSettings('profile')}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="@usuario" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {sidebar.state !== "collapsed" && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">Usuario</span>
                <span className="text-xs text-muted-foreground">{stats.totalFiles} imágenes</span>
              </div>
            )}
          </Button>
        </header>
        {sidebar.state !== "collapsed" ? (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <SidebarItem
                    icon={BookmarkIcon}
                    label="Colecciones"
                    count={stats.totalCollections}
                    isActive={currentView === 'collections'}
                    onClick={() => handleViewChange('collections')}
                    onAdd={() => handleOpenSettings('collections')}
                  />
                  <div className="space-y-1 mt-2">
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
                  <SidebarItem
                    icon={FolderIcon}
                    label="Carpetas"
                    count={stats.totalFolders}
                    isActive={currentView === 'folders'}
                    onClick={() => handleViewChange('folders')}
                    onAdd={() => handleOpenSettings('folders')}
                  />
                  <div className="space-y-1 mt-2">
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
                  <SidebarItem
                    icon={TagIcon}
                    label="Etiquetas"
                    count={stats.totalTags}
                    isActive={currentView === 'tags'}
                    onClick={() => handleViewChange('tags')}
                    onAdd={() => handleOpenSettings('tags')}
                  />
                  <div className="flex flex-wrap gap-1 px-4 mt-2">
                    {tags.map((tag) => (
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
                </div>
              </div>
            </ScrollArea>
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
