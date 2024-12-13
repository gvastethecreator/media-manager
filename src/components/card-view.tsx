"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface CardItem {
  id: string
  name: string
  description: string
  thumbnails: string[]
  fileCount: number
  totalSize: string
  tags: string[]
  color: string
  emoji?: string
}

interface CardViewProps {
  items: CardItem[]
  type: "collections" | "folders" | "tags"
  onItemClick?: (item: CardItem) => void
}

export function CardView({ items, type, onItemClick }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          style={{ borderColor: item.color }}
          className={cn(
            "group overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-lg",
            onItemClick && "cursor-pointer"
          )}
          onClick={() => onItemClick?.(item)}
          role={onItemClick ? "button" : "article"}
          tabIndex={onItemClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onItemClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault()
              onItemClick(item)
            }
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-2xl font-bold">
              {type === "collections" && item.emoji && (
                <span className="mr-2" role="img" aria-label={`Emoji ${item.emoji}`}>
                  {item.emoji}
                </span>
              )}
              {item.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-1">
              {item.thumbnails.slice(0, 9).map((thumbnail, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-md shadow-sm transition-transform group-hover:scale-105"
                >
                  <img
                    src={thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <CardDescription className="line-clamp-2 text-sm">
              {item.description}
            </CardDescription>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="mb-2 flex w-full justify-between text-sm text-muted-foreground">
              <span>
                {item.fileCount} {item.fileCount === 1 ? "archivo" : "archivos"}
              </span>
              <span>{item.totalSize}</span>
            </div>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => {
                  const textColor = getContrastColor(item.color)
                  return (
                    <Badge
                      key={tag}
                      style={{
                        backgroundColor: item.color,
                        color: textColor,
                      }}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? "#000000" : "#ffffff"
}