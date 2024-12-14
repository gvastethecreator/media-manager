import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const tags = [
  { name: "Favoritos", color: "red" },
  { name: "Importante", color: "yellow" },
  { name: "Personal", color: "green" },
  { name: "Trabajo", color: "blue" },
  { name: "Archivo", color: "purple" },
]

const colorOptions = [
  { value: 'red', label: 'Rojo' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'purple', label: 'Morado' },
]

export function TagsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input placeholder="Nombre de la etiqueta" />
        <Select>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full bg-${color.value}-500 mr-2`} />
                  {color.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button>Agregar</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge 
            key={tag.name}
            variant="secondary"
            className="cursor-pointer flex items-center gap-2"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 hover:bg-transparent text-white"
            >
              ×
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

