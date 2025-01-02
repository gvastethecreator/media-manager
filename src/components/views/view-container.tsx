'use client';

import { useNavigationStore } from '@/store/navigation';
import { ViewContainerProps } from './types';
import { SettingsView } from './settings/settings-view';
import { DashboardView } from './dashboard/dashboard-view';
import { AllImagesView } from './all-images/all-images-view';
import { FavoritesView } from './favorites/favorites-view';
import { SearchView } from './search/search-view';
import { FoldersView } from './folders/folders-view';
import { FolderContentView } from './folders/folder-content-view';
import { CollectionsView } from './collections/collections-view';
import { CollectionContentView } from './collections/collection-content-view';
import { TagsView } from './tags/tags-view';
import { TagContentView } from './tags/tag-content-view';
import { AnimatePresence, motion } from 'framer-motion';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

export function ViewContainer({ isResizing }: ViewContainerProps) {
  const { currentView, navigationDirection } = useNavigationStore();

  const renderView = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsView isResizing={isResizing} />;
      case 'all-images':
        return <AllImagesView />;
      case 'favorites':
        return <FavoritesView />;
      case 'search':
        return <SearchView isResizing={isResizing} />;
      case 'collections':
        return <CollectionsView isResizing={isResizing} />;
      case 'collection-content':
        return <CollectionContentView />;
      case 'folders':
        return <FoldersView isResizing={isResizing} />;
      case 'folder-content':
        return <FolderContentView />;
      case 'tags':
        return <TagsView isResizing={isResizing} />;
      case 'tag-content':
        return <TagContentView />;
      case 'dashboard':
      default:
        return <DashboardView isResizing={isResizing} />;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence initial={false} custom={navigationDirection}>
        <motion.div
          key={currentView}
          custom={navigationDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute w-full h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
