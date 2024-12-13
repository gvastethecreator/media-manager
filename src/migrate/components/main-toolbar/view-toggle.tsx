"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface ViewToggleProps {
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="icon"
        onClick={() => onViewChange("grid")}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="icon"
        onClick={() => onViewChange("list")}
        className="h-8 w-8"
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  )
}