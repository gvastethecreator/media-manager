'use client';

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ViewProps } from "../types";
import { useStatsStore } from "@/store/stats";
import * as Icons from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Función auxiliar para obtener el icono dinámicamente
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (Icons as any)[name.charAt(0).toUpperCase() + name.slice(1)]
  return Icon ? <Icon className={className} /> : null
}

export function DashboardView({ isResizing }: ViewProps) {
  const { stats, isLoading, error, initialize } = useStatsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const mainStats = [
    {
      title: "Total de Imágenes",
      value: stats?.totalImages || 0,
      description: "Imágenes indexadas",
      icon: "Image",
      color: "text-blue-500",
    },
    {
      title: "Carpetas",
      value: stats?.totalFolders || 0,
      description: "Carpetas monitoreadas",
      icon: "FolderOpen",
      color: "text-orange-500",
    },
    {
      title: "Etiquetas",
      value: stats?.totalTags || 0,
      description: "Etiquetas creadas",
      icon: "Tag",
      color: "text-green-500",
    },
    {
      title: "Colecciones",
      value: stats?.totalCollections || 0,
      description: "Colecciones organizadas",
      icon: "Bookmark",
      color: "text-purple-500",
    },
  ];

  const additionalStats = [
    {
      title: "Favoritos",
      value: stats?.totalFavorites || 0,
      icon: "Star",
      color: "text-yellow-500",
    },
    {
      title: "Vistas",
      value: stats?.totalViews || 0,
      icon: "Eye",
      color: "text-cyan-500",
    },
    {
      title: "Descargas",
      value: stats?.totalDownloads || 0,
      icon: "Download",
      color: "text-indigo-500",
    },
    {
      title: "Espacio Usado",
      value: formatBytes(stats?.totalSize || 0),
      icon: "HardDrive",
      color: "text-rose-500",
    },
  ];

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>
              No se pudieron cargar las estadísticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <motion.div
        className="p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Estadísticas Principales */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          <AnimatePresence mode="wait">
            {mainStats.map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <DynamicIcon name={stat.icon} className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Skeleton className="h-8 w-20" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Estadísticas Adicionales */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          <AnimatePresence mode="wait">
            {additionalStats.map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <DynamicIcon name={stat.icon} className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="skeleton"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Skeleton className="h-8 w-20" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-2xl font-bold">{stat.value}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Uso de Espacio por Carpeta */}
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          variants={containerVariants}
        >
          <Card>
            <CardHeader>
              <CardTitle>Uso de Espacio por Carpeta</CardTitle>
              <CardDescription>
                Distribución del espacio utilizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : (
                stats?.folderStats?.map((folder, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{folder.name}</span>
                      <span className="text-muted-foreground">{formatBytes(folder.size)}</span>
                    </div>
                    <Progress value={folder.percentage} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Etiquetas Más Usadas */}
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas Más Usadas</CardTitle>
              <CardDescription>
                Top etiquetas por número de imágenes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[50px]" />
                  </div>
                ))
              ) : (
                stats?.topTags?.map((tag, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {tag.count} imágenes
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actividad Reciente */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas acciones realizadas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                      <Skeleton className="h-4 w-4" />
                    </div>
                  ))
                ) : (
                  stats?.recentActivity?.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                      <DynamicIcon
                        name={activity.iconName}
                        className="h-4 w-4 text-muted-foreground"
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
