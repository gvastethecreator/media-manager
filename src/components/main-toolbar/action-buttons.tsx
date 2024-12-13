import { Button } from "@/components/ui/button"
import { Download, Share2, Trash2 } from "lucide-react"

export function ActionButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button size="icon" variant="ghost">
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share</span>
      </Button>
      <Button size="icon" variant="ghost">
        <Download className="h-4 w-4" />
        <span className="sr-only">Download</span>
      </Button>
      <Button size="icon" variant="ghost" className="text-red-600">
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  )
}