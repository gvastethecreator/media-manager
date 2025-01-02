import { Activity, HardDrive, RefreshCw, Trash2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSettingsContext } from "@/context/settings-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function SystemSection() {
  const { settings } = useSettingsContext()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Monitorea el rendimiento y uso de recursos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">CPU</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {settings.cpuUsage || "0"}%
              </Badge>
            </div>
            <Progress value={settings.cpuUsage || 0} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Memoria</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {settings.memoryUsage || "0"}%
              </Badge>
            </div>
            <Progress value={settings.memoryUsage || 0} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Caché</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {settings.cacheSize || "0"}MB
              </Badge>
            </div>
            <Progress value={(settings.cacheSize || 0) / 10} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Herramientas para mantener el sistema optimizado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 grid gap-2">
          <div className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="text-xs font-medium">Reparar sistema</span>
                <p className="text-[10px] text-muted-foreground">Corrige problemas comunes</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Reparar
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  <div>
                    <span className="text-xs font-medium">Resetear base de datos</span>
                    <p className="text-[10px] text-muted-foreground">Elimina todos los datos</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="h-7 text-xs">
                  Resetear
                </Button>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de la base de datos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
                <AlertDialogAction className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}