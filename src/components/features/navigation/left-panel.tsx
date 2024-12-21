'use client'

import { useCallback, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useFilesStore } from "@/store/files"
import { useUIStore } from "@/store/ui"
import { useStatsStore } from '@/store/stats'
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/ui/sidebar-item"
import {
  FolderIcon,
  TagIcon,
  Settings2,
  Sun,
  Moon,
  Home,
  Star,
  Image as ImageIcon,
  LibraryBig
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useNavigationStore } from "@/store/navigation"

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'all-images', label: 'Galería', icon: ImageIcon },
  { id: 'favorites', label: 'Favoritos', icon: Star },
]

const categories = [
  {
    id: 'collections',
    icon: LibraryBig,
    label: 'Colecciones',
    color: '#ef4444',
  },
  {
    id: 'files',
    icon: FolderIcon,
    label: 'Archivos',
    color: '#22c55e',
  },
  {
    id: 'tags',
    icon: TagIcon,
    label: 'Etiquetas',
    color: '#f59e0b',
  }
]

export function LeftPanel() {
  const { stats } = useStatsStore()
  const { currentView, setCurrentView } = useNavigationStore()
  const {
    collections,
    folders,
    tags,
    handleSelectCollection,
    handleSelectFolder,
    handleSelectTag,
    initialize
  } = useFilesStore()

  const { toggleSettings } = useUIStore()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const handleOpenSettings = useCallback(() => {
    toggleSettings()
  }, [toggleSettings])

  const handleItemClick = useCallback((id: string) => {
    setCurrentView(id)
  }, [setCurrentView])

  const handleCollectionClick = useCallback((collectionId: string) => {
    setCurrentView('collections')
    handleSelectCollection(collectionId)
  }, [setCurrentView, handleSelectCollection])

  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentView('files')
    handleSelectFolder(folderId)
  }, [setCurrentView, handleSelectFolder])

  const handleTagClick = useCallback((tagName: string) => {
    setCurrentView('tags')
    handleSelectTag(tagName)
  }, [setCurrentView, handleSelectTag])

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 justify-start gap-2 px-2",
              currentView === 'dashboard' && "bg-accent"
            )}
            onClick={() => handleItemClick('dashboard')}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/app-logo.png" alt="Logo" />
              <AvatarFallback>IM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Image Manager</span>
              <span className="text-xs text-muted-foreground">
                {stats?.totalImages || 0} imágenes
              </span>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleThemeToggle}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 p-2">
          {/* Navegación Principal */}
          <div className="py-2">
            {navigationItems.map(({ id, icon: Icon, label }) => (
              <SidebarItem
                key={id}
                icon={Icon}
                label={label}
                isActive={currentView === id}
                onClick={() => handleItemClick(id)}
              />
            ))}
          </div>

          <Separator />

          {/* Categorías con Listas */}
          <div className="py-2">
            {categories.map(({ id, icon: Icon, label, color }) => (
              <div key={id} className="py-1">
                <SidebarItem
                  icon={Icon}
                  label={label}
                  count={id === 'collections' ? stats?.totalCollections :
                         id === 'files' ? stats?.totalFolders :
                         id === 'tags' ? stats?.totalTags : undefined}
                  isActive={currentView === id}
                  onClick={() => handleItemClick(id)}
                />
                <div className="mt-1 space-y-0.5 pl-8">
                  {id === 'collections' && collections?.map((collection) => (
                    <Button
                      key={collection.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-sm px-2"
                      onClick={() => handleCollectionClick(collection.id)}
                    >
                      <span className="text-base">{collection.emoji}</span>
                      <span className="flex-1 text-left truncate">{collection.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {collection.count}
                      </Badge>
                    </Button>
                  ))}
                  {id === 'files' && folders?.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-sm px-2"
                      onClick={() => handleFolderClick(folder.id)}
                    >
                      <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {folder.count}
                      </Badge>
                    </Button>
                  ))}
                  {id === 'tags' && tags?.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-sm px-2"
                      onClick={() => handleTagClick(tag.name)}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left truncate">{tag.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {tag.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleOpenSettings}
        >
          <Settings2 className="h-4 w-4" />
          Configuración
        </Button>
      </div>
    </div>
  )
}