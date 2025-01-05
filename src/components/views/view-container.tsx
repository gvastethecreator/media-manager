'use client';

import { useNavigationStore } from '@/store/navigation';
import { ViewContainerProps } from './types';
import { SettingsView } from './settings/settings-view';
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
import { DebugView } from './debug/debug-view';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';

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
        return <SettingsView />;
      default:
      case 'all-images':
        return <AllImagesView />;
      case 'favorites':
        return <FavoritesView />;
      case 'search':
        return <SearchView />;
      case 'collections':
        return <CollectionsView  />;
      case 'collection-content':
        return <CollectionContentView />;
      case 'folders':
        return <FoldersView  />;
      case 'folder-content':
        return <FolderContentView />;
      case 'tags':
        return <TagsView/>;
      case 'tag-content':
        return <TagContentView />;
      case 'debug':
        return <DebugView />;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
       <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
        )}
      />
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
