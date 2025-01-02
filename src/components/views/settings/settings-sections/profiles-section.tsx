'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Trash2, Check, Smile } from "lucide-react"
import { useSettingsContext } from "@/context/settings-context"
import type { ThemeMode, Language } from "@/types/settings"
import { cn } from "@/lib/utils"
import { GithubPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EmojiPicker } from "@/components/ui/emoji-picker"

export function ProfilesSection() {
  const { settings, updateProfile, setActiveProfile, deleteProfile } = useSettingsContext()
  const { profiles, activeProfile } = settings
  const activeProfileData = profiles.find(p => p.id === activeProfile)

  const handleUpdateActiveProfile = async (updates: Partial<typeof activeProfileData>) => {
    if (activeProfileData) {
      await updateProfile(activeProfileData.id, updates)
    }
  }

  const handleAddProfile = async () => {
    await updateProfile(null, {
      name: "Nuevo Perfil",
      emoji: "👤",
      color: "#3b82f6",
      theme: "system" as ThemeMode,
      language: "es" as Language
    })
  }

  const handleDeleteProfile = async (id: string) => {
    if (profiles.length === 1) {
      return // No permitir eliminar el último perfil
    }
    await deleteProfile(id)
  }

  return (
    <div className="space-y-6">
      {/* Perfil Activo */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  style={{ backgroundColor: activeProfileData?.color }}
                >
                  <span className="text-xl">{activeProfileData?.emoji}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <EmojiPicker onEmojiSelect={(emoji) => handleUpdateActiveProfile({ emoji })} />
              </PopoverContent>
            </Popover>
            <div className="flex-1">
              <Input
                value={activeProfileData?.name}
                onChange={(e) => handleUpdateActiveProfile({ name: e.target.value })}
                className="text-lg font-medium"
                placeholder="Nombre del perfil"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: activeProfileData?.color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <GithubPicker
                  color={activeProfileData?.color}
                  onChange={(color) => handleUpdateActiveProfile({ color: color.hex })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Tema</Label>
              <Select
                value={activeProfileData?.theme}
                onValueChange={(value) => handleUpdateActiveProfile({ theme: value as ThemeMode })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Idioma</Label>
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Otros Perfiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Otros Perfiles</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddProfile}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Perfil
          </Button>
        </div>

        <div className="grid gap-2">
          {profiles
            .filter((profile) => profile.id !== activeProfile)
            .map((profile) => (
              <Card
                key={profile.id}
                className={cn(
                  "p-4 transition-colors hover:bg-muted/50",
                  profile.isActive && "border-primary"
                )}
              >
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        style={{ backgroundColor: profile.color }}
                      >
                        <span className="text-lg">{profile.emoji}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <EmojiPicker
                        onEmojiSelect={(emoji) =>
                          updateProfile(profile.id, { emoji })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1">
                    <Input
                      value={profile.name}
                      onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                      >
                        <div
                          className="h-5 w-5 rounded-full"
                          style={{ backgroundColor: profile.color }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <GithubPicker
                        color={profile.color}
                        onChange={(color) =>
                          updateProfile(profile.id, { color: color.hex })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveProfile(profile.id)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Activar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}