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
    <div className="flex items-center gap-1 px-6 py-2 text-sm text-muted-foreground border-b">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={() => onNavigate?.(0)}
      >
        <Home className="h-4 w-4" />
      </Button>
      {path.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <Button
            variant="ghost"
            className={cn(
              "px-2 h-6 hover:text-foreground transition-colors",
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