import React from 'react'
import { Button } from "@/components/ui/button"
import { Download, Bookmark, Trash2 } from 'lucide-react'

export function ActionButtons() {
  return (
    <div className="hidden lg:flex items-center gap-2">
      <Button variant="ghost" size="icon">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Bookmark className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

