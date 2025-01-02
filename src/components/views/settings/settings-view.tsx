'use client'

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FolderIcon,
  ImageIcon,
  TagIcon,
  BookmarkIcon,
  KeyboardIcon,
  DatabaseIcon,
  UserIcon,
} from "lucide-react"

// Importar las secciones
import { FoldersSection } from "./settings-sections/folders-section"
import { CollectionsSection } from "./settings-sections/collections-section"
import { TagsSection } from "./settings-sections/tags-section"
import { ShortcutsSection } from "./settings-sections/shortcuts-section"
import { ThumbnailsSection } from "./settings-sections/thumbnails-section"
import { ProfilesSection } from "./settings-sections/profiles-section"
import { SystemSection } from "./settings-sections/system-section"
import { getFolders } from "@/services/folder.service"
import { useToast } from "@/components/ui/use-toast"

export function SettingsView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState("appearance")
  const [initialFolders, setInitialFolders] = React.useState([])

  React.useEffect(() => {
    const loadInitialFolders = async () => {
      try {
        const folders = await getFolders()
        setInitialFolders(folders)
      } catch (error) {
        console.error('Error cargando carpetas:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Error al cargar las carpetas',
          variant: 'destructive',
        })
      }
    }

    if (activeTab === 'folders') {
      loadInitialFolders()
    }
  }, [activeTab, toast])

  return (
    <TooltipProvider>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">


              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="folders">
                    <FolderIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Carpetas y Miniaturas</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="collections">
                    <BookmarkIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Colecciones y Tags</TooltipContent>
              </Tooltip>




              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="system">
                    <DatabaseIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Perfiles y Sistema</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="shortcuts">
                    <KeyboardIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Atajos y Ayuda</TooltipContent>
              </Tooltip>
            </TabsList>

            <TabsContent value="folders">
              <FoldersSection />
              <ThumbnailsSection />
            </TabsContent>

            <TabsContent value="collections">
              <CollectionsSection />
              <TagsSection />
            </TabsContent>

            <TabsContent value="system">
              <ProfilesSection />
              <SystemSection />
            </TabsContent>

            <TabsContent value="shortcuts">
              <ShortcutsSection />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}