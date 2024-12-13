import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  type: 'collections' | 'folders' | 'tags'
}

export function CardView({ items, type }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {items.map((item) => (
        <Card key={item.id} className={`overflow-hidden transition-all hover:shadow-lg hover:scale-105 border-2`} style={{borderColor: item.color}}>
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
                <div key={index} className="aspect-square rounded-md overflow-hidden shadow-sm">
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <CardDescription className="text-sm truncate">{item.description}</CardDescription>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="flex justify-between w-full text-sm text-muted-foreground mb-2">
              <span>{item.fileCount} archivos</span>
              <span>{item.totalSize}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  className={`text-${getContrastColor(item.color)}`}
                  style={{
                    backgroundColor: item.color,
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function getContrastColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'black' : 'white';
}

