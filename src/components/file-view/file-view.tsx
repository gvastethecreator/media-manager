'use client'

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderIcon, ImageIcon } from 'lucide-react'
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface FileItem {
  id: string
  name: string
  type: 'folder' | 'image'
  size: string
  dateModified: string
  dateCreated: string
  thumbnail?: string
  dimensions?: string
  children?: FileItem[]
}

interface FileViewProps {
  items: FileItem[]
  onSelectItem: (item: FileItem) => void
  view?: 'grid' | 'list' | 'details'
  thumbnailSize?: 'small' | 'medium' | 'large'
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function FileView({
  items,
  onSelectItem,
  view = 'grid',
  thumbnailSize = 'medium'
}: FileViewProps) {
  const itemSize = React.useMemo(() => {
    switch (thumbnailSize) {
      case 'small': return 120
      case 'large': return 200
      default: return 160
    }
  }, [thumbnailSize])

  const renderGridView = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4"
    >
      {items.map((file) => (
        <motion.div
          key={file.id}
          variants={item}
          className={cn(
            "group cursor-pointer",
            "rounded-lg border bg-card hover:bg-accent transition-colors",
            "flex flex-col items-center p-4 relative"
          )}
          onClick={() => onSelectItem(file)}
          style={{ width: itemSize, height: itemSize }}
        >
          {file.type === 'folder' ? (
            <FolderIcon className="w-12 h-12 text-blue-500 mb-2" />
          ) : file.thumbnail ? (
            <div className="w-full aspect-square mb-2 rounded-md overflow-hidden">
              <img
                src={file.thumbnail}
                alt={file.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : (
            <ImageIcon className="w-12 h-12 text-green-500 mb-2" />
          )}
          <span className="text-sm font-medium truncate w-full text-center">
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {file.size}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )

  const renderListView = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="divide-y"
    >
      {items.map((file) => (
        <motion.div
          key={file.id}
          variants={item}
          className={cn(
            "flex items-center p-2 hover:bg-accent/50 cursor-pointer",
            "transition-colors"
          )}
          onClick={() => onSelectItem(file)}
        >
          {file.type === 'folder' ? (
            <FolderIcon className="w-5 h-5 text-blue-500 mr-3" />
          ) : (
            <ImageIcon className="w-5 h-5 text-green-500 mr-3" />
          )}
          <span className="flex-1 font-medium">{file.name}</span>
          <span className="text-sm text-muted-foreground mr-4">{file.size}</span>
          <span className="text-sm text-muted-foreground">
            {new Date(file.dateModified).toLocaleDateString()}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )

  const renderDetailsView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[400px]">Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((file) => (
          <TableRow
            key={file.id}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => onSelectItem(file)}
          >
            <TableCell>
              <div className="flex items-center">
                {file.type === 'folder' ? (
                  <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-green-500 mr-2" />
                )}
                {file.name}
              </div>
            </TableCell>
            <TableCell>{file.size}</TableCell>
            <TableCell>{new Date(file.dateModified).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(file.dateCreated).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="h-full overflow-auto">
      {view === 'grid' && renderGridView()}
      {view === 'list' && renderListView()}
      {view === 'details' && renderDetailsView()}
    </div>
  )
}