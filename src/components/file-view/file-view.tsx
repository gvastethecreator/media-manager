'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FileItem } from '@/store/files'
import { VirtualizedGrid } from './virtualized-grid'
import { VirtualizedList } from './virtualized-list'
import type { ThumbnailSize } from '@/store/ui'

interface FileViewProps {
  items: FileItem[]
  view: 'grid' | 'list' | 'details'
  thumbnailSize: ThumbnailSize
  onSelectItem: (item: FileItem) => void
  selectedItem: FileItem | null
}

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
}

export function FileView({
  items,
  view,
  thumbnailSize,
  onSelectItem,
  selectedItem
}: FileViewProps) {
  console.log('FileView: render', { view, thumbnailSize, selectedItem })

  const handleSelectItem = (item: FileItem) => {
    console.log('FileView: handleSelectItem', item)
    onSelectItem(item)
  }

  const direction = view === 'grid' ? 1 : -1

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {(view === 'list' || view === 'details') ? (
          <motion.div
            key="list"
            className="absolute inset-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            <VirtualizedList
              items={items}
              onSelectItem={handleSelectItem}
              selectedItem={selectedItem}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="absolute inset-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            <VirtualizedGrid
              items={items}
              thumbnailSize={thumbnailSize}
              onSelectItem={handleSelectItem}
              selectedItem={selectedItem}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

