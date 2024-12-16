'use client'

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BreadcrumbsProps {
  path: string[]
  onNavigate?: (index: number) => void
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 text-xs text-muted-foreground border-b">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-muted"
        onClick={() => onNavigate?.(0)}
      >
        <Home className="h-4 w-4" />
      </Button>
      {path.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <Button
            variant="ghost"
            className={cn(
              "px-1.5 h-5 hover:text-foreground transition-colors text-xs",
              index === path.length - 2 && "text-foreground font-medium"
            )}
            onClick={() => onNavigate?.(index + 1)}
          >
            {item}
          </Button>
        </React.Fragment>
      ))}
    </div>
  )
}