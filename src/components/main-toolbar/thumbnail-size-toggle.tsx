import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"

type ThumbnailSizeToggleProps = {
  size: "sm" | "md" | "lg"
  onSizeChange: (size: "sm" | "md" | "lg") => void
}

export function ThumbnailSizeToggle({
  size,
  onSizeChange,
}: ThumbnailSizeToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={size === "sm" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("sm")}
      >
        <ImageIcon className="h-3 w-3" />
        <span className="sr-only">Small thumbnails</span>
      </Button>
      <Button
        variant={size === "md" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("md")}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="sr-only">Medium thumbnails</span>
      </Button>
      <Button
        variant={size === "lg" ? "default" : "ghost"}
        size="icon"
        onClick={() => onSizeChange("lg")}
      >
        <ImageIcon className="h-5 w-5" />
        <span className="sr-only">Large thumbnails</span>
      </Button>
    </div>
  )
}