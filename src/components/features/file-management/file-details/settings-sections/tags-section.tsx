'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Palette } from "lucide-react"
import { useSettingsContext } from "@/context/settings-context"
import type { FileProperty, FilterCondition } from "@/types/settings"
import { Compact } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const colorOptions = [
  { value: "blue", label: "Azul" },
  { value: "red", label: "Rojo" },
  { value: "green", label: "Verde" },
  { value: "yellow", label: "Amarillo" },
  { value: "purple", label: "Morado" },
  { value: "pink", label: "Rosa" },
  { value: "orange", label: "Naranja" },
  { value: "cyan", label: "Cian" },
  { value: "indigo", label: "Índigo" },
  { value: "teal", label: "Verde azulado" }
]

export function TagsSection() {
  const { settings, updateTag } = useSettingsContext()
  const { tags } = settings
  const [newTag, setNewTag] = React.useState({
    name: "",
    color: "#3b82f6",
    property: "name" as FileProperty,
    condition: "contains" as FilterCondition,
    value: ""
  })

  const handleColorChange = (color: { hex: string }) => {
    setNewTag({ ...newTag, color: color.hex })
  }

  const handleAddTag = async () => {
    if (!newTag.name) return
    const newTagData = {
      id: Date.now().toString(),
      ...newTag,
      count: 0
    }
    await updateTag(newTagData.id, newTagData)
    setNewTag({
      name: "",
      color: "#3b82f6",
      property: "name",
      condition: "contains",
      value: ""
    })
  }

  const handleRemoveTag = async (id: string) => {
    await updateTag(id, { id, count: 0 })
  }

  const handleUpdateTag = async (id: string, updates: Partial<typeof tags[0]>) => {
    await updateTag(id, updates)
  }

  const getConditionText = (tag: typeof tags[0]) => {
    switch (tag.condition) {
      case "contains":
        return `${tag.property} contiene "${tag.value}"`
      case "exact":
        return `${tag.property} exactamente igual a "${tag.value}"`
      case "starts":
        return `${tag.property} empieza con "${tag.value}"`
      case "ends":
        return `${tag.property} termina con "${tag.value}"`
      case "regex":
        return `${tag.property} coincide con "${tag.value}"`
      case "greater":
        return `${tag.property} mayor a ${tag.value}`
      case "less":
        return `${tag.property} menor a ${tag.value}`
      default:
        return `${tag.property} ${tag.condition} ${tag.value}`
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Nueva Etiqueta</h4>

          <div className="grid gap-4">
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: newTag.color }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Compact
                      color={newTag.color}
                      onChange={handleColorChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Nombre de la etiqueta"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Propiedad a filtrar</Label>
              <Select
                value={newTag.property}
                onValueChange={(value) => setNewTag({ ...newTag, property: value as FileProperty })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre del archivo</SelectItem>
                  <SelectItem value="path">Ruta del archivo</SelectItem>
                  <SelectItem value="size">Tamaño del archivo</SelectItem>
                  <SelectItem value="type">Tipo de archivo</SelectItem>
                  <SelectItem value="date">Fecha de modificación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condición</Label>
              <Select
                value={newTag.condition}
                onValueChange={(value) => setNewTag({ ...newTag, condition: value as FilterCondition })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una condición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contiene</SelectItem>
                  <SelectItem value="exact">Exactamente igual</SelectItem>
                  <SelectItem value="starts">Empieza con</SelectItem>
                  <SelectItem value="ends">Termina con</SelectItem>
                  <SelectItem value="regex">Expresión regular</SelectItem>
                  <SelectItem value="greater">Mayor que</SelectItem>
                  <SelectItem value="less">Menor que</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                placeholder="Valor a filtrar"
                value={newTag.value}
                onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleAddTag}>
              Crear Etiqueta
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Etiquetas Existentes</h4>

        <div className="grid gap-4">
          {tags.map((tag) => (
            <Card key={tag.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Compact
                          color={tag.color}
                          onChange={(color) =>
                            handleUpdateTag(tag.id, { color: color.hex })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1">
                      <Input
                        value={tag.name}
                        className="h-8 font-medium"
                        onChange={(e) => handleUpdateTag(tag.id, { name: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pl-10 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getConditionText(tag)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {tag.count} archivos
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}