"use client";

import { useNavigationStore } from '@/store/navigation'
import { useFilesStore } from '@/store/files'
import { DashboardView } from '@/components/views/dashboard/dashboard-view'
import { AllImagesView } from '@/components/views/all-images/all-images-view'
import { FavoritesView } from '@/components/views/favorites/favorites-view'
import { FilesView } from '@/components/views/files/files-view'
import { CollectionsView } from '@/components/views/collections/collections-view'
import { TagsView } from '@/components/views/tags/tags-view'
import { LeftPanel } from '@/components/layout/left-panel/left-panel'
import { RightPanel } from '@/components/features/file-management/file-details/right-panel'
import { MainContent } from '@/components/layout/main-content/main-content'
import { useUIStore } from '@/store/ui'

export function MainLayout() {
  const { currentView } = useNavigationStore()
  const { currentFolderId, selectedItem } = useFilesStore()
  const { showSettings, toggleSettings } = useUIStore()

  const renderView = () => {
    console.log('Current View:', currentView)
    console.log('Current Folder ID:', currentFolderId)

    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'all-images':
        return <AllImagesView />
      case 'favorites':
        return <FavoritesView />
      case 'files':
        return <FilesView />
      case 'collections':
        return <CollectionsView />
      case 'tags':
        return <TagsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-full">
      {/* Panel Izquierdo - 20% */}
      <div className="w-[20%] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <LeftPanel />
      </div>

      {/* Contenido Principal - 60% */}
      <div className="w-[60%]">
        <MainContent>
          {renderView()}
        </MainContent>
      </div>

      {/* Panel Derecho - 20% */}
      <div className="w-[20%] border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <RightPanel
          selectedItem={selectedItem}
          showSettings={showSettings}
          onToggleSettings={toggleSettings}
        />
      </div>
    </div>
  )
}
