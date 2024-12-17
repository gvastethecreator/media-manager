'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, UserIcon, Trash2 } from "lucide-react"
import { useSettingsContext } from "@/contexts/SettingsContext"
import type { ThemeMode, Language } from "@/types/settings"

const emojiOptions = ["👤", "💼", "🏠", "🎮", "📚", "🎨", "🎵", "🎬", "📷", "🖥️"]
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

export function ProfilesSection() {
  const { settings, updateProfile, setActiveProfile } = useSettingsContext()
  const { profiles, activeProfile } = settings
  const activeProfileData = profiles.find(p => p.id === activeProfile)

  const handleUpdateActiveProfile = async (updates: Partial<typeof activeProfileData>) => {
    if (activeProfileData) {
      await updateProfile(activeProfileData.id, updates)
    }
  }

  const handleAddProfile = async () => {
    const newProfile = {
      id: Date.now().toString(),
      name: "Nuevo Perfil",
      emoji: "👤",
      color: "blue",
      theme: "system" as ThemeMode,
      language: "es" as Language,
      syncSettings: false,
      notifications: false,
      customSettings: {
        appearance: {},
        folders: [],
        collections: [],
        tags: [],
        shortcuts: []
      }
    }
    await updateProfile(newProfile.id, newProfile)
  }

  const handleRemoveProfile = async (id: string) => {
    // No permitir eliminar el perfil activo o el perfil por defecto
    if (id === activeProfile || id === "default") return
    await updateProfile(id, { id })
  }

  const handleUpdateProfile = async (id: string, updates: Partial<typeof profiles[0]>) => {
    await updateProfile(id, updates)
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Perfil Activo</h4>

          <div className="flex gap-2">
            <div className="flex-shrink-0 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  if (!activeProfileData) return
                  const currentIndex = emojiOptions.indexOf(activeProfileData.emoji)
                  const nextIndex = (currentIndex + 1) % emojiOptions.length
                  handleUpdateActiveProfile({ emoji: emojiOptions[nextIndex] })
                }}
              >
                <span className="text-lg">{activeProfileData?.emoji}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  if (!activeProfileData) return
                  const currentIndex = colorOptions.findIndex(c => c.value === activeProfileData.color)
                  const nextIndex = (currentIndex + 1) % colorOptions.length
                  handleUpdateActiveProfile({ color: colorOptions[nextIndex].value })
                }}
              >
                <span className={`h-4 w-4 rounded-full bg-${activeProfileData?.color}-500`} />
              </Button>
            </div>
            <div className="flex-1">
              <Input
                value={activeProfileData?.name}
                className="h-9"
                onChange={(e) => handleUpdateActiveProfile({ name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tema del perfil</Label>
            <Select
              value={activeProfileData?.theme}
              onValueChange={(value) => handleUpdateActiveProfile({ theme: value as ThemeMode })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select
              value={activeProfileData?.language}
              onValueChange={(value) => handleUpdateActiveProfile({ language: value as Language })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sync-settings" className="flex flex-col gap-1">
              <span>Sincronizar ajustes</span>
              <span className="text-sm text-muted-foreground">
                Mantener configuración entre dispositivos
              </span>
            </Label>
            <Switch
              id="sync-settings"
              checked={activeProfileData?.syncSettings}
              onCheckedChange={(checked) => handleUpdateActiveProfile({ syncSettings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex flex-col gap-1">
              <span>Notificaciones</span>
              <span className="text-sm text-muted-foreground">
                Recibir alertas y notificaciones
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={activeProfileData?.notifications}
              onCheckedChange={(checked) => handleUpdateActiveProfile({ notifications: checked })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Perfiles Adicionales</h4>

          <div className="grid gap-4">
            {profiles
              .filter(profile => profile.id !== activeProfile)
              .map((profile) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="text-lg">{profile.emoji}</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className={`h-4 w-4 rounded-full bg-${profile.color}-500`} />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={profile.name}
                        className="h-8"
                        onChange={(e) => handleUpdateProfile(profile.id, { name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveProfile(profile.id)}
                    >
                      Activar
                    </Button>
                    {profile.id !== "default" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveProfile(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <Button
            className="w-full flex items-center gap-2"
            onClick={handleAddProfile}
          >
            <UserIcon className="h-4 w-4" />
            Agregar Perfil
          </Button>
        </div>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Los perfiles te permiten mantener diferentes configuraciones para distintos usos.
        </AlertDescription>
      </Alert>
    </div>
  )
}