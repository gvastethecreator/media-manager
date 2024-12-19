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
import { thumbnailService, type ThumbnailStats } from "@/services/thumbnail.service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

const thumbnailQualityOptions = [
  { value: "compressed", label: "Comprimida (más rápido, menos espacio)" },
  { value: "low", label: "Baja (balance entre calidad y espacio)" },
  { value: "mid", label: "Media (recomendado)" },
  { value: "high", label: "Alta (mejor calidad, más espacio)" }
]

export function ThumbnailsSection() {
  const { settings, updateSettings } = useSettingsContext()
  const { toast } = useToast()
  const [processingProgress, setProcessingProgress] = React.useState(0)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [stats, setStats] = React.useState<ThumbnailStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showErrors, setShowErrors] = React.useState(false)

  const loadStats = React.useCallback(async () => {
    try {
      const data = await thumbnailService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de miniaturas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleQualityChange = (value: string) => {
    updateSettings({ thumbnailQuality: value })
  }

  const handleVideoAnimationToggle = () => {
    updateSettings({ videoThumbnailAnimation: !settings.videoThumbnailAnimation })
  }

  const handleReprocessThumbnails = async () => {
    try {
      setIsProcessing(true)
      await thumbnailService.reprocessAll((progress) => {
        setProcessingProgress(progress)
      })
      
      // Recargar estadísticas
      await loadStats()
      
      toast({
        title: "Éxito",
        description: "Las miniaturas han sido reprocesadas correctamente"
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al reprocesar las miniaturas",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
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
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Miniaturas</Label>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">{stats.total}</span>
                  <Badge variant="secondary">
                    {stats.total > 0 
                      ? `${Math.round(((stats.total - stats.pending) / stats.total) * 100)}%` 
                      : '0%'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Peso en Base de Datos</Label>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">{thumbnailService.formatSize(stats.totalSize)}</span>
                  <Badge variant="secondary">Optimizado</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pendientes</Label>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">{stats.pending}</span>
                  <Badge 
                    variant="secondary" 
                    className={stats.pending === 0 ? "bg-green-500" : undefined}
                  >
                    {stats.pending === 0 ? 'Al día' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Con Error</Label>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">{stats.errors.length}</span>
                  {stats.errors.length > 0 ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-red-500 hover:text-red-600"
                      onClick={() => setShowErrors(true)}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Ver detalles
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500">Sin errores</Badge>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={showErrors} onOpenChange={setShowErrors}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Errores en Miniaturas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-4">
              {stats?.errors.map((error) => (
                <div 
                  key={error.imageId} 
                  className="p-4 rounded-lg border bg-muted"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">
                      {error.imagePath}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-500">{error.error}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
