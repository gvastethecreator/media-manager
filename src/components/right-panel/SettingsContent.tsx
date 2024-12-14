import React from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from 'lucide-react'
import { ProfilesTab } from './settings-tabs/ProfilesTab'
import { FoldersTab } from './settings-tabs/FoldersTab'
import { CollectionsTab } from './settings-tabs/CollectionsTab'
import { TagsTab } from './settings-tabs/TagsTab'
import { ThumbnailsTab } from './settings-tabs/ThumbnailsTab'
import { SystemTab } from './settings-tabs/SystemTab'
import { InfoTab } from './settings-tabs/InfoTab'

interface SettingsContentProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onClose: () => void
}

export function SettingsContent({ activeTab, onTabChange, onClose }: SettingsContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Settings</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="profiles"><ProfilesTab /></TabsContent>
          <TabsContent value="folders"><FoldersTab /></TabsContent>
          <TabsContent value="collections"><CollectionsTab /></TabsContent>
          <TabsContent value="tags"><TagsTab /></TabsContent>
          <TabsContent value="thumbnails"><ThumbnailsTab /></TabsContent>
          <TabsContent value="system"><SystemTab /></TabsContent>
          <TabsContent value="info"><InfoTab /></TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

