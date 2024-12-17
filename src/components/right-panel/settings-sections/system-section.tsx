'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, DatabaseIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useSettingsContext } from "@/contexts/SettingsContext"
import type { BackupFrequency, LogLevel } from "@/types/settings"

export function SystemSection() {
  const { settings, updateSystem } = useSettingsContext()
  const { system } = settings

  const handleUpdateSystem = async (updates: Partial<typeof system>) => {
    await updateSystem(updates)
  }

  const handleCreateBackup = async () => {
    // Implementar creación de respaldo
    console.log("Creando respaldo...")
  }

  const handleRestoreBackup = async () => {
    // Implementar restauración de respaldo
    console.log("Restaurando respaldo...")
  }

  const handleReindex = async () => {
    // Implementar reindexado
    console.log("Reindexando base de datos...")
  }

  const handleOptimize = async () => {
    // Implementar optimización
    console.log("Optimizando base de datos...")
  }

  const handleExportLogs = async () => {
    // Implementar exportación de logs
    console.log("Exportando registros...")
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Información del Sistema</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sistema Operativo</span>
              <span>{system.info.os}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Versión</span>
              <span>{system.info.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Última actualización</span>
              <span>{system.info.lastUpdate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Base de datos</span>
              <Badge variant="outline">{system.info.database}</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Uso de memoria</span>
              <span className="text-sm">{system.info.memory.used} MB</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${system.info.memory.percentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Almacenamiento</span>
              <span className="text-sm">{system.info.storage.used} GB / {system.info.storage.total} GB</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${system.info.storage.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Base de Datos</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup" className="flex flex-col gap-1">
                <span>Respaldo automático</span>
                <span className="text-sm text-muted-foreground">
                  Crear respaldos periódicamente
                </span>
              </Label>
              <Switch
                id="auto-backup"
                checked={system.backup.autoBackup}
                onCheckedChange={(checked) =>
                  handleUpdateSystem({
                    backup: { ...system.backup, autoBackup: checked }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Frecuencia de respaldo</Label>
              <Select
                value={system.backup.frequency}
                onValueChange={(value) =>
                  handleUpdateSystem({
                    backup: { ...system.backup, frequency: value as BackupFrequency }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Cada hora</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCreateBackup}
              >
                Crear Respaldo
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRestoreBackup}
              >
                Restaurar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Mantenimiento</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-clean" className="flex flex-col gap-1">
                <span>Limpieza automática</span>
                <span className="text-sm text-muted-foreground">
                  Eliminar archivos temporales
                </span>
              </Label>
              <Switch
                id="auto-clean"
                checked={system.maintenance.autoClean}
                onCheckedChange={(checked) =>
                  handleUpdateSystem({
                    maintenance: { ...system.maintenance, autoClean: checked }
                  })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex gap-2 flex-1"
                onClick={handleReindex}
              >
                <RefreshCw className="h-4 w-4" />
                Reindexar
              </Button>
              <Button
                variant="outline"
                className="flex gap-2 flex-1"
                onClick={handleOptimize}
              >
                <DatabaseIcon className="h-4 w-4" />
                Optimizar
              </Button>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Las operaciones de mantenimiento pueden tomar varios minutos.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Registro de Eventos</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="debug-mode" className="flex flex-col gap-1">
                <span>Modo debug</span>
                <span className="text-sm text-muted-foreground">
                  Registrar eventos detallados
                </span>
              </Label>
              <Switch
                id="debug-mode"
                checked={system.logging.debugMode}
                onCheckedChange={(checked) =>
                  handleUpdateSystem({
                    logging: { ...system.logging, debugMode: checked }
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Nivel de registro</Label>
              <Select
                value={system.logging.logLevel}
                onValueChange={(value) =>
                  handleUpdateSystem({
                    logging: { ...system.logging, logLevel: value as LogLevel }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Advertencia</SelectItem>
                  <SelectItem value="info">Información</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportLogs}
            >
              Exportar Registros
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}