"use client"

import { Button } from "@/components/ui/button"
import { Download, Share2, Trash2, Copy, FolderPlus } from "lucide-react"
import { useFileActions } from "@/lib/hooks/use-file-actions"
import { cn } from "@/lib/utils"

interface ActionButtonsProps {
  className?: string
}

export function ActionButtons({ className }: ActionButtonsProps) {
  const {
    selectedCount,
    handleDelete,
    handleDownload,
    handleCopy,
    handleMove,
  } = useFileActions()

  if (selectedCount === 0) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => handleDownload()}
        className="h-8 w-8"
      >
        <Download className="h-4 w-4" />
        <span className="sr-only">Download</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => handleCopy()}
        className="h-8 w-8"
      >
        <Copy className="h-4 w-4" />
        <span className="sr-only">Copy</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => handleMove("")}
        className="h-8 w-8"
      >
        <FolderPlus className="h-4 w-4" />
        <span className="sr-only">Move to folder</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDelete}
        className="h-8 w-8 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  )
}