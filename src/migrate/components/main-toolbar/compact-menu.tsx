"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Copy,
  Download,
  FolderPlus,
  ImageIcon,
  LayoutGrid,
  List,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react"
import { useFileActions } from "@/lib/hooks/use-file-actions"

interface CompactMenuProps {
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
  thumbnailSize: "small" | "medium" | "large"
  onThumbnailSizeChange: (size: "small" | "medium" | "large") => void
}

export function CompactMenu({
  view,
  onViewChange,
  thumbnailSize,
  onThumbnailSizeChange,
}: CompactMenuProps) {
  const {
    selectedCount,
    handleDelete,
    handleDownload,
    handleCopy,
    handleMove,
  } = useFileActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onViewChange("grid")}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Grid view
          {view === "grid" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewChange("list")}>
          <List className="mr-2 h-4 w-4" />
          List view
          {view === "list" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onThumbnailSizeChange("small")}>
          <ImageIcon className="mr-2 h-3 w-3" />
          Small thumbnails
          {thumbnailSize === "small" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThumbnailSizeChange("medium")}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Medium thumbnails
          {thumbnailSize === "medium" && " ✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThumbnailSizeChange("large")}>
          <ImageIcon className="mr-2 h-5 w-5" />
          Large thumbnails
          {thumbnailSize === "large" && " ✓"}
        </DropdownMenuItem>
        {selectedCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDownload()}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopy()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMove("")}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Move to folder
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:bg-red-100 dark:focus:bg-red-900"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}