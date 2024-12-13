"use client"

import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThumbnailSizeToggleProps {
  size: "small" | "medium" | "large"
  onSizeChange: (size: "small" | "medium" | "large") => void
  className?: string
}

export function ThumbnailSizeToggle({
  size,
  onSizeChange,
  className,
}: ThumbnailSizeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant={size === "small" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("small")}
        className="h-8 w-8"
      >
        <ImageIcon className="h-3 w-3" />
        <span className="sr-only">Small thumbnails</span>
      </Button>
      <Button
        variant={size === "medium" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("medium")}
        className="h-8 w-8"
      >
        <ImageIcon className="h-4 w-4" />
        <span className="sr-only">Medium thumbnails</span>
      </Button>
      <Button
        variant={size === "large" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("large")}
        className="h-8 w-8"
      >
        <ImageIcon className="h-5 w-5" />
        <span className="sr-only">Large thumbnails</span>
      </Button>
    </div>
  )
}