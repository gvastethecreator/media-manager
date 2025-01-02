'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Settings2, 
  Keyboard, 
  Command, 
  Search, 
  Home, 
  Folder, 
  Bookmark, 
  Image, 
  Tag, 
  Trash2, 
  Copy, 
  FileUp 
} from "lucide-react"
import { useSettingsContext } from "@/context/settings-context"

const shortcutCategories = [
  {
    name: "General",
    icon: Command,
    shortcuts: [
      { action: "Abrir configuración", keys: "Ctrl + ,", Icon: Settings2 },
      { action: "Buscar", keys: "Ctrl + F", Icon: Search },
      { action: "Recargar vista", keys: "F5", Icon: Command }
    ]
  },
  {
    name: "Navegación",
    icon: Home,
    shortcuts: [
      { action: "Ir a Dashboard", keys: "Alt + H", Icon: Home },
      { action: "Ir a Carpetas", keys: "Alt + F", Icon: Folder },
      { action: "Ir a Colecciones", keys: "Alt + C", Icon: Bookmark },
      { action: "Ir a Galería", keys: "Alt + G", Icon: Image },
      { action: "Ir a Etiquetas", keys: "Alt + T", Icon: Tag }
    ]
  },
  {
    name: "Archivos",
    icon: FileUp,
    shortcuts: [
      { action: "Seleccionar todo", keys: "Ctrl + A", Icon: Command },
      { action: "Copiar", keys: "Ctrl + C", Icon: Copy },
      { action: "Pegar", keys: "Ctrl + V", Icon: FileUp },
      { action: "Eliminar", keys: "Delete", Icon: Trash2 }
    ]
  }
]

export function ShortcutsSection() {
  const { settings, updateSettings } = useSettingsContext()
  const [editingShortcut, setEditingShortcut] = React.useState<string | null>(null)
  const [listeningForKeys, setListeningForKeys] = React.useState(false)

  const handleStartEditing = (action: string) => {
    setEditingShortcut(action)
    setListeningForKeys(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
    if (!listeningForKeys) return

    e.preventDefault()
    const keys = []
    if (e.ctrlKey) keys.push("Ctrl")
    if (e.altKey) keys.push("Alt")
    if (e.shiftKey) keys.push("Shift")
    
    const key = e.key.toUpperCase()
    if (!["CONTROL", "ALT", "SHIFT"].includes(key)) {
      keys.push(key)
    }

    if (keys.length > 0) {
      updateSettings({
        shortcuts: {
          ...settings.shortcuts,
          [action]: keys.join(" + ")
        }
      })
      setEditingShortcut(null)
      setListeningForKeys(false)
    }
  }

  return (
    <div className="space-y-4">
      {shortcutCategories.map((category) => (
        <Card key={category.name} className="overflow-hidden">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Atajos de teclado para {category.name.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            {category.shortcuts.map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-muted">
                    <shortcut.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium">{shortcut.action}</span>
                </div>
                <div className="flex items-center gap-1">
                  {editingShortcut === shortcut.action ? (
                    <Input
                      className="w-24 h-7 text-center text-xs"
                      placeholder="Presiona teclas..."
                      value=""
                      onKeyDown={(e) => handleKeyDown(e, shortcut.action)}
                      autoFocus
                    />
                  ) : (
                    <Badge 
                      variant="outline" 
                      className="px-1.5 py-0.5 text-[10px] font-mono"
                    >
                      {settings.shortcuts?.[shortcut.action] || shortcut.keys}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleStartEditing(shortcut.action)}
                  >
                    <Keyboard className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}