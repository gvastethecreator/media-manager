'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewProps } from "../types";
import { useFilesStore } from "@/store/files";
import { useStatsStore } from "@/store/stats";
import { Image, FolderOpen, Tag, BookmarkIcon } from "lucide-react";

export function DashboardView({ isResizing }: ViewProps) {
  const stats = useStatsStore(state => state.stats);

  const cards = [
    {
      title: "Total de Imágenes",
      value: stats?.totalImages || 0,
      icon: Image,
    },
    {
      title: "Carpetas",
      value: stats?.totalFolders || 0,
      icon: FolderOpen,
    },
    {
      title: "Etiquetas",
      value: stats?.totalTags || 0,
      icon: Tag,
    },
    {
      title: "Colecciones",
      value: stats?.totalCollections || 0,
      icon: BookmarkIcon,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aquí irán más secciones como:
          - Gráficos de uso de espacio
          - Actividad reciente
          - Estadísticas de etiquetas más usadas
          - etc. */}
    </div>
  );
}
