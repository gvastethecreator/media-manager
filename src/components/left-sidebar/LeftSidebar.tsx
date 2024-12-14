'use client'

import * as React from "react"
import { FolderIcon, TagIcon, BookmarkIcon, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useFiles } from "@/context/FilesContext"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function LeftSidebar() {
  const {
    currentView,
    setCurrentView,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    collections,
    folders,
    tags
  } = useFiles()

  return (
    <Sidebar>
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="space-y-4 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-2">
                <Button
                  variant="link"
                  className={cn(
                    "p-0 h-auto font-semibold flex items-center",
                    currentView === 'collections' && "text-primary"
                  )}
                  onClick={() => setCurrentView('collections')}
                >
                  <BookmarkIcon className="h-4 w-4 mr-2 text-purple-500" />
                  Colecciones
                </Button>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Plus className="h-3 w-3" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {collections.map((collection) => (
                    <SidebarMenuItem key={collection.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectCollection(collection.id)}
                        className={cn(
                          "w-full",
                          currentView === 'collections' && "hover:bg-accent"
                        )}
                      >
                        <span className="mr-2">{collection.emoji}</span>
                        <span className="flex-1">{collection.name}</span>
                        <span className="text-xs text-muted-foreground">({collection.count})</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="mx-4" />

            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-2">
                <Button
                  variant="link"
                  className={cn(
                    "p-0 h-auto font-semibold flex items-center",
                    currentView === 'folders' && "text-primary"
                  )}
                  onClick={() => setCurrentView('folders')}
                >
                  <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  Carpetas
                </Button>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Plus className="h-3 w-3" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {folders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectFolder(folder.id)}
                        className={cn(
                          "w-full",
                          currentView === 'folders' && "hover:bg-accent"
                        )}
                      >
                        <FolderIcon className="h-4 w-4 mr-2" style={{ color: folder.color }} />
                        <span className="flex-1">{folder.name}</span>
                        <span className="text-xs text-muted-foreground">({folder.count})</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="mx-4" />

            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between px-2">
                <Button
                  variant="link"
                  className={cn(
                    "p-0 h-auto font-semibold flex items-center",
                    currentView === 'tags' && "text-primary"
                  )}
                  onClick={() => setCurrentView('tags')}
                >
                  <TagIcon className="h-4 w-4 mr-2 text-green-500" />
                  Etiquetas
                </Button>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Plus className="h-3 w-3" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-wrap gap-2 p-4">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      className={cn(
                        "cursor-pointer hover:opacity-80",
                        currentView === 'tags' && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{
                        backgroundColor: tag.color,
                        color: '#ffffff'
                      }}
                      onClick={() => handleSelectTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}