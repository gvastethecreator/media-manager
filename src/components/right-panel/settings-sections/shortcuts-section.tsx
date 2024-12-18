'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSettingsContext } from "@/context/settings-context"

export function ShortcutsSection() {
  const { settings, updateShortcut } = useSettingsContext()
  const { shortcuts } = settings

  const handleUpdateShortcut = async (id: string, keys: string) => {
    await updateShortcut(id, { keys })
  }

  const renderShortcutSection = (title: string, category: 'navigation' | 'files' | 'collections' | 'view') => {
    const categoryShortcuts = shortcuts.filter(s => s.category === category)

    return (
      <Card>
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium">{title}</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-4">
            {categoryShortcuts.map((shortcut) => (
              <div key={shortcut.id} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.action}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      // Implementar editor de atajo
                      // Por ahora solo mostramos el atajo actual
                      console.log("Editar atajo:", shortcut.action)
                    }}
                  >
                    {shortcut.keys}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          {renderShortcutSection("Navegación", "navigation")}
          {renderShortcutSection("Archivos", "files")}
          {renderShortcutSection("Colecciones", "collections")}
          {renderShortcutSection("Vista", "view")}
        </div>
      </div>
    </div>
  )
}