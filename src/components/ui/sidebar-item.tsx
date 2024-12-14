'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          "sidebar-item flex-1 justify-start gap-2",
          isActive && "sidebar-item-active"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {count !== undefined && (
          <span className="ml-auto text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </Button>
      {onAdd && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onAdd}
          className="h-8 w-8 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Añadir {label}</span>
        </Button>
      )}
    </div>
  )
}