'use client'

import * as React from "react"
import { ChevronRight, Home, CalendarDays, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavigationBarProps {
  path: string[]
  onNavigate?: (index: number) => void
  onSearch?: () => void
  onDateSelect?: (date: Date | undefined) => void
}

export function NavigationBar({ 
  path, 
  onNavigate,
  onSearch,
  onDateSelect 
}: NavigationBarProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date)
    onDateSelect?.(date)
  }

  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-0.5">
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

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      date && "text-foreground"
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>Filtrar por fecha</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}