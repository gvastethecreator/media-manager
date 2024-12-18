import { 
  Moon, 
  Sun, 
  Monitor, 
  Laptop2, 
  Layout, 
  ArrowDownAZ, 
  Hash, 
  Home, 
  Image, 
  Folder, 
  Bookmark,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useSettingsContext } from "@/context/settings-context"
import { StartPage } from "@/types/settings"

const startPageOptions: { value: StartPage; label: string; icon: any }[] = [
  { value: "dashboard", label: "Dashboard", icon: Home },
  { value: "all-images", label: "Galería", icon: Image },
  { value: "folders", label: "Carpetas", icon: Folder },
  { value: "collections", label: "Colecciones", icon: Bookmark }
]

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettingsContext()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Tema</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Personaliza la apariencia de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="w-full h-8 text-xs"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-3.5 w-3.5 mr-1" /> Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="w-full h-8 text-xs"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-3.5 w-3.5 mr-1" /> Oscuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="w-full h-8 text-xs"
              onClick={() => setTheme('system')}
            >
              <Laptop2 className="h-3.5 w-3.5 mr-1" /> Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Visualización</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Ajusta cómo se muestran los elementos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Tamaño de miniaturas</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings.thumbnailSize || 150]}
                onValueChange={([value]) => updateSettings({ thumbnailSize: value })}
                max={300}
                min={100}
                step={10}
                className="flex-1"
              />
              <Badge variant="outline" className="text-[10px] font-mono w-12 text-center">
                {settings.thumbnailSize || 150}px
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">Ordenar por nombre</span>
              </div>
              <Switch
                checked={settings.sortByName}
                onCheckedChange={(checked) => updateSettings({ sortByName: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">Modo compacto</span>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Página de inicio</Label>
            <Select
              value={settings.startPage || "dashboard"}
              onValueChange={(value: StartPage) => updateSettings({ startPage: value })}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Selecciona la página de inicio" />
              </SelectTrigger>
              <SelectContent>
                {startPageOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className="h-3.5 w-3.5" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="text-xs">Actualización automática</span>
                <p className="text-[10px] text-muted-foreground">Mantener sincronizado</p>
              </div>
            </div>
            <Switch
              checked={settings.autoUpdate}
              onCheckedChange={(checked) => updateSettings({ autoUpdate: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}