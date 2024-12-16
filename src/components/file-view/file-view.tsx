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
  selectedItems: Set<string>
  onSelectItem: (item: FileItem | string) => void
}

const variants = {
  grid: {
    initial: {
      scale: 0.95,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1]
      }
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1]
      }
    }
  },
  list: {
    initial: {
      scale: 0.98,
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1]
      }
    },
    exit: {
      scale: 0.98,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1]
      }
    }
  }
}

const containerVariants = {
  initial: {
    opacity: 0,
    scale: 0.98
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
}

export function FileView({
  items,
  view,
  thumbnailSize,
  selectedItems,
  onSelectItem
}: FileViewProps) {
  const selectedItem = items.find(item => selectedItems.has(item.id)) || null

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {(view === 'list' || view === 'details') ? (
          <motion.div
            key="list"
            className="absolute inset-0"
            variants={variants.list}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <VirtualizedList
              items={items}
              onSelectItem={onSelectItem}
              selectedItem={selectedItem}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="absolute inset-0"
            variants={containerVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <VirtualizedGrid
              items={items}
              thumbnailSize={thumbnailSize}
              onSelectItem={onSelectItem}
              selectedItem={selectedItem}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

