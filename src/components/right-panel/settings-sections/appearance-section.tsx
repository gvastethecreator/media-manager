'use client'

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsContext } from "@/context/settings-context"
import type { SortBy, StartPage } from "@/types/settings"

export function AppearanceSection() {
  const { settings, updateAppearance } = useSettingsContext()
  const { appearance } = settings

  const handleUpdateAppearance = async <K extends keyof typeof appearance>(
    key: K,
    value: typeof appearance[K]
  ) => {
    await updateAppearance({ [key]: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="flex flex-col gap-1">
            <span>Modo oscuro</span>
            <span className="text-sm text-muted-foreground">
              Cambia entre tema claro y oscuro
            </span>
          </Label>
          <Switch
            id="dark-mode"
            checked={appearance.darkMode}
            onCheckedChange={(checked) => handleUpdateAppearance('darkMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="compact-mode" className="flex flex-col gap-1">
            <span>Modo compacto</span>
            <span className="text-sm text-muted-foreground">
              Reduce el espacio entre elementos
            </span>
          </Label>
          <Switch
            id="compact-mode"
            checked={appearance.compactMode}
            onCheckedChange={(checked) => handleUpdateAppearance('compactMode', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="potato-mode" className="flex flex-col gap-1">
            <span>Modo potato</span>
            <span className="text-sm text-muted-foreground">
              Desactiva transiciones y animaciones
            </span>
          </Label>
          <Switch
            id="potato-mode"
            checked={appearance.potatoMode}
            onCheckedChange={(checked) => handleUpdateAppearance('potatoMode', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail-size">Tamaño de miniaturas</Label>
          <div className="pt-2">
            <Slider
              id="thumbnail-size"
              value={[appearance.thumbnailSize]}
              onValueChange={([value]) => handleUpdateAppearance('thumbnailSize', value)}
              max={4}
              min={0}
              step={1}
              marks={[
                { value: 0, label: 'XS' },
                { value: 1, label: 'S' },
                { value: 2, label: 'M' },
                { value: 3, label: 'L' },
                { value: 4, label: 'XL' }
              ]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-by">Ordenamiento</Label>
          <Select
            value={appearance.sortBy}
            onValueChange={(value) => handleUpdateAppearance('sortBy', value as SortBy)}
          >
            <SelectTrigger id="sort-by">
              <SelectValue placeholder="Selecciona un criterio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="size">Tamaño</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="collection-pagination" className="flex flex-col gap-1">
              <span>Paginado en colecciones</span>
              <span className="text-sm text-muted-foreground">
                Activar paginación para colecciones
              </span>
            </Label>
            <Switch
              id="collection-pagination"
              checked={appearance.collectionPagination.enabled}
              onCheckedChange={(checked) =>
                handleUpdateAppearance('collectionPagination', {
                  ...appearance.collectionPagination,
                  enabled: checked
                })
              }
            />
          </div>
          <div className="pl-6">
            <Slider
              disabled={!appearance.collectionPagination.enabled}
              value={[appearance.collectionPagination.itemsPerPage]}
              onValueChange={([value]) =>
                handleUpdateAppearance('collectionPagination', {
                  ...appearance.collectionPagination,
                  itemsPerPage: value
                })
              }
              max={200}
              min={10}
              step={10}
              className="w-[60%]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="folder-pagination" className="flex flex-col gap-1">
              <span>Paginado en carpetas</span>
              <span className="text-sm text-muted-foreground">
                Activar paginación para carpetas
              </span>
            </Label>
            <Switch
              id="folder-pagination"
              checked={appearance.folderPagination.enabled}
              onCheckedChange={(checked) =>
                handleUpdateAppearance('folderPagination', {
                  ...appearance.folderPagination,
                  enabled: checked
                })
              }
            />
          </div>
          <div className="pl-6">
            <Slider
              disabled={!appearance.folderPagination.enabled}
              value={[appearance.folderPagination.itemsPerPage]}
              onValueChange={([value]) =>
                handleUpdateAppearance('folderPagination', {
                  ...appearance.folderPagination,
                  itemsPerPage: value
                })
              }
              max={200}
              min={10}
              step={10}
              className="w-[60%]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-page">Página de inicio</Label>
          <Select
            value={appearance.startPage}
            onValueChange={(value) => handleUpdateAppearance('startPage', value as StartPage)}
          >
            <SelectTrigger id="start-page">
              <SelectValue placeholder="Selecciona página inicial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="all-images">Todas las imágenes</SelectItem>
              <SelectItem value="library">Biblioteca</SelectItem>
              <SelectItem value="collections">Colecciones</SelectItem>
              <SelectItem value="folders">Carpetas</SelectItem>
              <SelectItem value="last-view">Última vista</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-update" className="flex flex-col gap-1">
            <span>Actualización automática</span>
            <span className="text-sm text-muted-foreground">
              Actualizar vista con nuevos archivos
            </span>
          </Label>
          <Switch
            id="auto-update"
            checked={appearance.autoUpdate}
            onCheckedChange={(checked) => handleUpdateAppearance('autoUpdate', checked)}
          />
        </div>
      </div>
    </div>
  )
}