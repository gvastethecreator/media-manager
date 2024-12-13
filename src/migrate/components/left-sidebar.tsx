"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronsUpDown,
  Folder,
  FolderIcon,
  Plus,
  TagIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useProfile } from "@/lib/contexts/profile-context"

export function LeftSidebar() {
  return (
    <aside className="group/sidebar relative flex h-full w-[300px] flex-col border-r bg-background">
      <header className="border-b px-4 py-2">
        <NavUser />
      </header>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Collections />
          <Separator className="my-4" />
          <Folders />
          <Separator className="my-4" />
          <Tags />
        </div>
      </ScrollArea>
      <footer className="border-t p-4">
        <DatePicker />
      </footer>
    </aside>
  )
}

function NavUser() {
  const { currentUser, openProfileSettings } = useProfile()

  return (
    <Button
      variant="ghost"
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
        <span className="text-muted-foreground">
          {currentUser.totalImages} imágenes
        </span>
      </div>
      <ChevronsUpDown className="h-4 w-4 opacity-50" />
    </Button>
  )
}

function Collections() {
  const { openSettingsTab, setCurrentView, collections } = useProfile()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <Button
          variant="link"
          className="h-auto flex items-center p-0 font-semibold"
          onClick={() => setCurrentView("collections")}
        >
          <BookmarkIcon className="mr-2 h-4 w-4 text-blue-500" />
          Colecciones
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => openSettingsTab("collections")}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <nav className="space-y-1">
        {collections.map((collection) => (
          <Button
            key={collection.id}
            variant="ghost"
            className="w-full justify-start"
          >
            <span className="mr-2 text-xl">{collection.emoji}</span>
            <span className="flex-1">{collection.title}</span>
            <span className="text-xs text-muted-foreground">
              ({collection.itemCount})
            </span>
          </Button>
        ))}
      </nav>
    </div>
  )
}

function Folders() {
  const { openSettingsTab, setCurrentView, folders } = useProfile()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <Button
          variant="link"
          className="h-auto flex items-center p-0 font-semibold"
          onClick={() => setCurrentView("folders")}
        >
          <FolderIcon className="mr-2 h-4 w-4 text-yellow-500" />
          Carpetas
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => openSettingsTab("folders")}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <nav className="space-y-1">
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant="ghost"
            className="w-full justify-start"
          >
            <Folder className="mr-2 h-4 w-4 text-blue-500" />
            <span className="flex-1">{folder.title}</span>
            <span className="text-xs text-muted-foreground">
              ({folder.itemCount})
            </span>
          </Button>
        ))}
      </nav>
    </div>
  )
}

function Tags() {
  const { openSettingsTab, setCurrentView, tags } = useProfile()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <Button
          variant="link"
          className="h-auto flex items-center p-0 font-semibold"
          onClick={() => setCurrentView("tags")}
        >
          <TagIcon className="mr-2 h-4 w-4 text-green-500" />
          Etiquetas
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => openSettingsTab("tags")}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {tags.map((tag) => {
          const textColor = getContrastColor(tag.color)
          return (
            <Badge
              key={tag.id}
              className="cursor-pointer"
              style={{
                backgroundColor: tag.color,
                color: textColor,
              }}
            >
              {tag.title}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}

function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? "#000000" : "#ffffff"
}

