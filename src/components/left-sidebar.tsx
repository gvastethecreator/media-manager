'use client'

import * as React from "react"
import { ChevronRight, ChevronsUpDown, Plus, Folder, CalendarIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProfileContext } from "@/contexts/ProfileContext"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { BookmarkIcon, FolderIcon, TagIcon } from 'lucide-react'

export function LeftSidebar() {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-2">
        <NavUser />
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          <Collections />
          <SidebarGroup>
            <Folders />
          </SidebarGroup>
          <SidebarGroup>
            <Tags />
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter className="border-t p-4">
        <DatePicker />
      </SidebarFooter>
    </Sidebar>
  )
}

function NavUser() {
  const { currentUser, openProfileSettings } = React.useContext(ProfileContext)
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="w-full justify-start"
          onClick={openProfileSettings}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-2 grid flex-1 text-left text-xs leading-tight">
            <span className="font-semibold">{currentUser.name}</span>
            <span className="text-muted-foreground">{currentUser.totalImages} imágenes</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function Collections() {
  const { openSettingsTab, setCurrentView, collections } = React.useContext(ProfileContext)
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between px-2">
        <Button variant="link" className="p-0 h-auto font-semibold flex items-center" onClick={() => setCurrentView('collections')}>
          <BookmarkIcon className="h-4 w-4 mr-2 text-blue-500" />
          Colecciones
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openSettingsTab('collections')}>
          <Plus className="h-3 w-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {collections.map((collection) => (
            <SidebarMenuItem key={collection.id}>
              <SidebarMenuButton>
                <span className="mr-2 text-xl">{collection.emoji}</span>
                <span className="flex-1">{collection.name}</span>
                <span className="text-xs text-muted-foreground">({collection.fileCount})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function Folders() {
  const { openSettingsTab, setCurrentView, folders } = React.useContext(ProfileContext)
  return (
    <>
      <SidebarGroupLabel className="flex items-center justify-between px-2">
        <Button variant="link" className="p-0 h-auto font-semibold flex items-center" onClick={() => setCurrentView('folders')}>
          <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />
          Carpetas
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openSettingsTab('folders')}>
          <Plus className="h-3 w-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {folders.map((folder) => (
            <SidebarMenuItem key={folder.id}>
              <SidebarMenuButton>
                <Folder className="mr-2 h-4 w-4 text-blue-500" />
                <span className="flex-1">{folder.name}</span>
                <span className="text-xs text-muted-foreground">({folder.fileCount})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </>
  )
}

function Tags() {
  const { openSettingsTab, setCurrentView, tags } = React.useContext(ProfileContext)
  return (
    <>
      <SidebarGroupLabel className="flex items-center justify-between px-2">
        <Button variant="link" className="p-0 h-auto font-semibold flex items-center" onClick={() => setCurrentView('tags')}>
          <TagIcon className="h-4 w-4 mr-2 text-green-500" />
          Etiquetas
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => openSettingsTab('tags')}>
          <Plus className="h-3 w-3" />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="flex flex-wrap gap-2 p-4">
          {tags.map((tag) => (
            <Badge 
              key={tag.id} 
              className={`cursor-pointer text-${getContrastColor(tag.color)}`}
              style={{
                backgroundColor: tag.color,
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </SidebarGroupContent>
    </>
  )
}

function getContrastColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}

function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
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
  )
}

