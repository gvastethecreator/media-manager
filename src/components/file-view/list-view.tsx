import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileItem } from "./file-view"
import { cn } from "@/lib/utils"
import { FileContextMenu } from "./context-menu"
import { FolderIcon, ImageIcon } from "lucide-react"

interface ListViewProps {
  files: FileItem[]
  selectedItem: FileItem | null
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
}

const ListItem = memo(function ListItem({
  file,
  selected,
  index,
  onItemClick,
  onItemDoubleClick,
  onItemAction,
}: {
  file: FileItem
  selected: boolean
  index: number
  onItemClick: (item: FileItem) => void
  onItemDoubleClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
}) {
  return (
    <FileContextMenu file={file} onAction={onItemAction}>
      <motion.div
        layout
        layoutId={file.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.2,
          delay: index * 0.03,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          "file-item flex items-center p-2 rounded-lg hover:bg-muted/70 group cursor-pointer",
          selected ? 'bg-muted' : ''
        )}
        onClick={() => onItemClick(file)}
        onDoubleClick={() => onItemDoubleClick(file)}
      >
        <div className="w-8 h-8 mr-2 flex items-center justify-center">
          {file.type === 'folder' ? (
            <FolderIcon className="w-6 h-6 text-blue-500" />
          ) : (
            <ImageIcon className="w-6 h-6 text-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate">
            {file.name}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-2">
          {file.size}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {new Date(file.dateModified).toLocaleDateString()}
        </span>
      </motion.div>
    </FileContextMenu>
  )
})

export const ListView = memo(function ListView({
  files,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
  onItemAction,
}: ListViewProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={true}>
        {files.map((file, index) => (
          <ListItem
            key={file.id}
            file={file}
            selected={selectedItem?.id === file.id}
            index={index}
            onItemClick={onItemClick}
            onItemDoubleClick={onItemDoubleClick}
            onItemAction={onItemAction}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})
