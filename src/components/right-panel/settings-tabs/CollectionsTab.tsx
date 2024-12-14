import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const collections = [
  { name: "Vacaciones 2023", emoji: "🏖️", count: 145 },
  { name: "Cumpleaños", emoji: "🎂", count: 67 },
  { name: "Mascotas", emoji: "🐾", count: 89 },
  { name: "Trabajo", emoji: "💼", count: 203 },
]

const emojiOptions = ["🏖️", "🎂", "🐾", "💼", "📚", "🎵", "🎨", "🍔", "🚗"]

export function CollectionsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select>
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="🏷️" />
          </SelectTrigger>
          <SelectContent>
            {emojiOptions.map((emoji) => (
              <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Nombre de la colección" />
        <Button>Agregar</Button>
      </div>
      <div className="space-y-2">
        {collections.map((collection) => (
          <div key={collection.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{collection.emoji}</span>
              <span>{collection.name}</span>
              <span className="text-xs text-muted-foreground">({collection.count} items)</span>
            </div>
            <Button variant="ghost" size="sm">Eliminar</Button>
          </div>
        ))}
      </div>
    </div>
  )
}

