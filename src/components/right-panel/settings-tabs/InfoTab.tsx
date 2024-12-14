import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const generalStats = {
  totalProfiles: 2,
  totalCollections: 4,
  totalFolders: 3,
  totalTags: 9,
  totalImages: 1500,
  totalStorage: "5.2 GB",
  lastBackup: "2023-04-15 14:30:00",
  version: "1.2.3"
}

export function InfoTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas generales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total de perfiles</p>
              <p className="text-lg font-bold">{generalStats.totalProfiles}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total de colecciones</p>
              <p className="text-lg font-bold">{generalStats.totalCollections}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total de carpetas</p>
              <p className="text-lg font-bold">{generalStats.totalFolders}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total de etiquetas</p>
              <p className="text-lg font-bold">{generalStats.totalTags}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total de imágenes</p>
              <p className="text-lg font-bold">{generalStats.totalImages}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Almacenamiento total</p>
              <p className="text-lg font-bold">{generalStats.totalStorage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Información adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Versión de la aplicación</span>
              <span className="text-sm">{generalStats.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Última copia de seguridad</span>
              <span className="text-sm">{generalStats.lastBackup}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

