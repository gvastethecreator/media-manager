'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, AlertCircle } from "lucide-react"
import { useSettingsContext } from "@/context/settings-context"

const thumbnailQualityOptions = [
  { value: "compressed", label: "Comprimida (más rápido, menos espacio)" },
  { value: "low", label: "Baja (balance entre calidad y espacio)" },
  { value: "mid", label: "Media (recomendado)" },
  { value: "high", label: "Alta (mejor calidad, más espacio)" }
]

export function ThumbnailsSection() {
  const { settings, updateSettings } = useSettingsContext()
  const [processingProgress, setProcessingProgress] = React.useState(0)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleQualityChange = (value: string) => {
    updateSettings({ thumbnailQuality: value })
  }

  const handleVideoAnimationToggle = () => {
    updateSettings({ videoThumbnailAnimation: !settings.videoThumbnailAnimation })
  }

  const handleReprocessThumbnails = async () => {
    setIsProcessing(true)
    // Simular progreso
    for (let i = 0; i <= 100; i += 10) {
      setProcessingProgress(i)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    setIsProcessing(false)
    setProcessingProgress(0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Configuración de Miniaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Calidad de Miniaturas</Label>
              <Select 
                value={settings.thumbnailQuality} 
                onValueChange={handleQualityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la calidad" />
                </SelectTrigger>
                <SelectContent>
                  {thumbnailQualityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Una calidad más alta resultará en miniaturas más nítidas pero ocupará más espacio
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="video-animation">Animación en videos</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar un preview animado al pasar el cursor sobre videos
                </p>
              </div>
              <Switch
                id="video-animation"
                checked={settings.videoThumbnailAnimation}
                onCheckedChange={handleVideoAnimationToggle}
              />
            </div>

            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={handleReprocessThumbnails}
                disabled={isProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Procesando...' : 'Reprocesar todas las miniaturas'}
              </Button>
              {isProcessing && (
                <div className="mt-2 space-y-2">
                  <Progress value={processingProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {processingProgress}% completado
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Estado de Miniaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Miniaturas</Label>
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm font-medium">1,234</span>
                <Badge variant="secondary">100%</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Peso en Base de Datos</Label>
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm font-medium">500 MB</span>
                <Badge variant="secondary">Optimizado</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pendientes</Label>
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm font-medium">0</span>
                <Badge variant="secondary" className="bg-green-500">Al día</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Con Error</Label>
              <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                <span className="text-sm font-medium">2</span>
                <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Ver detalles
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
