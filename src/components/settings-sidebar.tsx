"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  BookmarkIcon,
  DatabaseIcon,
  EditIcon,
  FolderIcon,
  ImageIcon,
  InfoIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  TagIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { useProfile } from "@/lib/contexts/profile-context"
import { useFiles } from "@/lib/contexts/file-context"
import { useSettings } from "@/lib/contexts/settings-context"
import { MiniDashboard } from "./ui/mini-dashboard"

const colorOptions = [
  { value: "red", label: "Rojo" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "yellow", label: "Amarillo" },
  { value: "purple", label: "Morado" },
  { value: "pink", label: "Rosa" },
  { value: "orange", label: "Naranja" },
  { value: "cyan", label: "Cian" },
  { value: "indigo", label: "Índigo" },
]

const emojiOptions = ["🏖️", "🎂", "🐾", "💼", "📚", "🎵", "🎨", "🍔", "🚗"]

const thumbnailSizes = ["64x64", "128x128", "256x256", "512x512"]

interface SettingsSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SettingsSidebar({
  isOpen,
  onOpenChange,
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const { currentUser, collections, folders, tags } = useProfile()
  const { files } = useFiles()
  const { settings, updateSettings } = useSettings()

  const [newCollection, setNewCollection] = React.useState({
    emoji: "🏖️",
    name: "",
  })

  const [newTag, setNewTag] = React.useState({
    name: "",
    color: "blue",
  })

  const handleAddCollection = () => {
    if (newCollection.name.trim()) {
      // Add collection logic here
      setNewCollection({ emoji: "🏖️", name: "" })
    }
  }

  const handleAddTag = () => {
    if (newTag.name.trim()) {
      // Add tag logic here
      setNewTag({ name: "", color: "blue" })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="profiles">
              <UserIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="folders">
              <FolderIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="collections">
              <BookmarkIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="tags">
              <TagIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="thumbnails">
              <ImageIcon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings2Icon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="info">
              <InfoIcon className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-sm font-medium">
                    {currentUser.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  <div>Collections: {collections.length}</div>
                  <div>Folders: {folders.length}</div>
                  <div>Images: {files.length}</div>
                  <div>Tags: {tags.length}</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <EditIcon className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2Icon className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Select
                value={newCollection.emoji}
                onValueChange={(value) =>
                  setNewCollection({ ...newCollection, emoji: value })
                }
              >
                <SelectTrigger className="w-[60px]">
                  <SelectValue placeholder="🏷️" />
                </SelectTrigger>
                <SelectContent>
                  {emojiOptions.map((emoji) => (
                    <SelectItem key={emoji} value={emoji}>
                      {emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Nombre de la colección"
                value={newCollection.name}
                onChange={(e) =>
                  setNewCollection({ ...newCollection, name: e.target.value })
                }
              />
              <Button onClick={handleAddCollection}>Agregar</Button>
            </div>
            <div className="space-y-2">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{collection.emoji}</span>
                    <span>{collection.title}</span>
                    <span className="text-xs text-muted-foreground">
                      ({collection.itemCount} items)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Nombre de la etiqueta"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
              <Select
                value={newTag.color}
                onValueChange={(value) => setNewTag({ ...newTag, color: value })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddTag}>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: tag.color,
                    color: getContrastColor(tag.color),
                  }}
                >
                  {tag.title}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    updateSettings({ theme: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    updateSettings({ language: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notifications</Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    updateSettings({ notifications: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Quality</Label>
                <Slider
                  value={[settings.thumbnailQuality === "low" ? 0 : settings.thumbnailQuality === "medium" ? 50 : 100]}
                  onValueChange={([value]) =>
                    updateSettings({
                      thumbnailQuality: value <= 33 ? "low" : value <= 66 ? "medium" : "high",
                    })
                  }
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <MiniDashboard
              title="System Information"
              items={[
                { label: "Total Files", value: files.length },
                { label: "Collections", value: collections.length },
                { label: "Folders", value: folders.length },
                { label: "Tags", value: tags.length },
              ]}
            />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Version: {process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
              </p>
              <p className="text-sm text-muted-foreground">
                Build Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? "#000000" : "#ffffff"
}