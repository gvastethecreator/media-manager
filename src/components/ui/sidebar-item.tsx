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
  className?: string
}

export function SidebarItem({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
  onAdd,
  className
}: SidebarItemProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        className={cn(
          "justify-start gap-2 h-9 flex-1",
          isActive && "bg-muted",
          className
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        <span className="text-base font-semibold">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto">{count}</span>
        )}
      </Button>
      {onAdd && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}