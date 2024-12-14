import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileItem } from "./file-view"
import { cn } from "@/lib/utils"
import { FileContextMenu } from "./context-menu"

interface GridViewProps {
  files: FileItem[]
  selectedItem: FileItem | null
  itemWidth: number
  itemHeight: number
  gap: number
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
  renderFileIcon: (file: FileItem) => React.ReactNode
}

const GridItem = memo(function GridItem({
  file,
  selected,
  width,
  height,
  index,
  onItemClick,
  onItemDoubleClick,
  onItemAction,
  renderFileIcon
}: {
  file: FileItem
  selected: boolean
  width: number
  height: number
  index: number
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
  renderFileIcon: (file: FileItem) => React.ReactNode
}) {
  return (
    <FileContextMenu file={file} onAction={onItemAction}>
      <motion.div
        layout
        layoutId={file.id}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.15,
          delay: index * 0.03,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          "relative overflow-hidden rounded-lg cursor-pointer",
          "hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background",
          "group",
          selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        )}
        style={{
          width,
          height,
          aspectRatio: '1/1',
        }}
        onClick={() => onItemClick(file)}
        onDoubleClick={() => onItemDoubleClick(file)}
      >
        {/* Contenedor del icono/imagen */}
        <div className="absolute inset-0">
          {renderFileIcon(file)}
        </div>

        {/* Overlay con el nombre del archivo */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 p-2",
          "bg-gradient-to-t from-black/80 to-transparent",
          "translate-y-full opacity-0",
          "group-hover:translate-y-0 group-hover:opacity-100",
          "transition-[transform,opacity] duration-150"
        )}>
          <span className="block text-xs font-medium text-white truncate">
            {file.name}
          </span>
          {file.type === 'image' && file.dimensions && (
            <span className="block text-[10px] text-white/80">
              {file.dimensions}
            </span>
          )}
        </div>

        {/* Overlay de selección */}
        <div className={cn(
          "absolute inset-0",
          selected ? 'bg-primary/10' : 'bg-transparent',
          "group-hover:bg-primary/5",
          "transition-colors duration-150"
        )} />
      </motion.div>
    </FileContextMenu>
  )
})

export const GridView = memo(function GridView({
  files,
  selectedItem,
  itemWidth,
  itemHeight,
  gap,
  onItemClick,
  onItemDoubleClick,
  onItemAction,
  renderFileIcon
}: GridViewProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
        gap: `${gap}px`,
        padding: `${gap}px`,
      }}
    >
      <AnimatePresence initial={true}>
        {files.map((file, index) => (
          <GridItem
            key={file.id}
            file={file}
            selected={selectedItem?.id === file.id}
            width={itemWidth}
            height={itemHeight}
            index={index}
            onItemClick={onItemClick}
            onItemDoubleClick={onItemDoubleClick}
            onItemAction={onItemAction}
            renderFileIcon={renderFileIcon}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})
