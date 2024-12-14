'use client'

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface CardItem {
  id: string
  name: string
  description: string
  thumbnails: string[]
  count: number
  totalSize: string
  tags: string[]
  color: string
  emoji?: string
}

interface CardViewProps {
  items: CardItem[]
  type: 'collections' | 'folders' | 'tags'
  onSelect?: (item: CardItem) => void
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function CardView({ items, type, onSelect }: CardViewProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={item}>
          <Card
            className={cn(
              "overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2",
              "transform hover:scale-[1.02] transition-transform duration-200"
            )}
            style={{ borderColor: item.color }}
            onClick={() => onSelect?.(item)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold flex items-center">
                {type === 'collections' && item.emoji && (
                  <span className="mr-2">{item.emoji}</span>
                )}
                {item.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1 mb-4">
                {item.thumbnails.slice(0, 9).map((thumbnail, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-md overflow-hidden shadow-sm"
                  >
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
              <CardDescription className="text-sm line-clamp-2">
                {item.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="flex justify-between w-full text-sm text-muted-foreground mb-2">
                <span>{item.count} archivos</span>
                <span>{item.totalSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-muted/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

