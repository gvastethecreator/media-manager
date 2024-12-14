'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  count?: number
  isActive?: boolean
  onClick?: () => void
  onAdd?: () => void
}

export function SidebarItem({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
  onAdd
}: SidebarItemProps) {
  return (
    <div className="relative group">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 h-9",
          isActive && "bg-muted"
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left truncate">{label}</span>
        {typeof count !== 'undefined' && (
          <span className="text-muted-foreground text-xs">{count}</span>
        )}
      </Button>
      {onAdd && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-1 top-1 h-7 w-7",
            "opacity-0 group-hover:opacity-100",
            "focus:opacity-100"
          )}
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Agregar {label}</span>
        </Button>
      )}
    </div>
  )
}