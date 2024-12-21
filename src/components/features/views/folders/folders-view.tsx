'use client';

import { useEffect, useState } from 'react';
import { ViewProps } from '../types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImageIcon, FolderIcon, Clock, ArrowUpRight, RefreshCcw, Eye, Settings2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface FolderWithStats {
  id: string;
  name: string;
  path: string;
  isWatched: boolean;
  totalFiles: number;
  totalSize: number;
  lastIndexed: string;
  recentImages?: string[];
  usedSpace?: number;
  totalSpace?: number;
}

interface FolderCardProps {
  folder: FolderWithStats;
  onClick: () => void;
}

function getRandomGradient() {
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-yellow-500 to-orange-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
    'from-teal-500 to-green-500',
    'from-orange-500 to-amber-500',
    'from-cyan-500 to-blue-500'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-[300px] h-[300px] relative mb-8">
        <Image
          src="/empty-folders.svg"
          alt="No hay carpetas"
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-2xl font-bold mb-2">No hay carpetas indexadas</h3>
      <p className="text-muted-foreground max-w-[500px]">
        Agrega carpetas desde el panel de configuración para comenzar a indexar tus imágenes.
      </p>
    </div>
  );
}

function FolderCard({ folder, onClick }: FolderCardProps) {
  const router = useRouter();

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.promise(
        fetch(`/api/folders/${folder.id}/refresh`, { method: 'POST' }),
        {
          loading: 'Actualizando carpeta...',
          success: 'Carpeta actualizada',
          error: 'Error al actualizar la carpeta'
        }
      );
    } catch (error) {
      console.error('Error refreshing folder:', error);
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/settings/folders');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card
        className={cn(
          "w-full h-full cursor-pointer overflow-hidden group",
          "transition-all duration-200 hover:shadow-lg",
          "border-2 flex flex-col"
        )}
      >
        <CardHeader className="relative p-4 pb-2 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderIcon className="w-8 h-8 text-blue-500" />
              <div>
                <CardTitle className="text-xl">{folder.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {folder.path}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSettings}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClick}
              >
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 flex-1 flex flex-col">
          {/* Grid de imágenes recientes */}
          <div className="relative group/grid flex-1">
            <div className="grid grid-cols-3 gap-2 h-full bg-background/50 rounded-lg p-2">
              {folder.recentImages && folder.recentImages.length > 0 ? (
                folder.recentImages.map((src, i) => (
                  <div key={i} className="relative rounded-md overflow-hidden aspect-square">
                    {src ? (
                      <Image
                        src={src}
                        alt={`Imagen ${i + 1}`}
                        fill
                        className="object-cover transition-transform group-hover/grid:scale-105"
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-full flex items-center justify-center bg-gradient-to-br",
                        getRandomGradient()
                      )}>
                        <ImageIcon className="w-5 h-5 text-white/80" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative rounded-md overflow-hidden aspect-square",
                      "flex items-center justify-center",
                      "bg-gradient-to-br transition-transform hover:scale-105",
                      getRandomGradient()
                    )}
                  >
                    <ImageIcon className="w-5 h-5 text-white/80" />
                  </div>
                ))
              )}
            </div>

            {/* Overlay con hover */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover/grid:opacity-100 transition-opacity rounded-lg flex items-end justify-center p-4"
              onClick={onClick}
            >
              <Button variant="secondary" size="sm" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Ver contenido
              </Button>
            </div>
          </div>

          {/* Footer con stats */}
          <div className="mt-4 space-y-3">
            {/* Uso de espacio */}
            {folder.usedSpace && folder.totalSpace && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Espacio usado</span>
                  <span>{Math.round((folder.usedSpace / folder.totalSpace) * 100)}%</span>
                </div>
                <Progress value={(folder.usedSpace / folder.totalSpace) * 100} />
              </div>
            )}

            {/* Estadísticas */}
            <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <ImageIcon className="w-4 h-4" />
                      <span>{folder.totalFiles}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="text-sm">
                    Total de imágenes en la carpeta
                  </HoverCardContent>
                </HoverCard>

                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(folder.lastIndexed).toLocaleDateString()}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="text-sm">
                    Última actualización
                  </HoverCardContent>
                </HoverCard>
              </div>

              <Badge variant={folder.isWatched ? "default" : "secondary"}>
                {folder.isWatched ? "Monitoreada" : "No monitoreada"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {Array(4).fill(0).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[4/3]" />
      ))}
    </div>
  );
}

export function FoldersView({ isResizing }: ViewProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/folders');
        if (!response.ok) throw new Error('Error al obtener carpetas');
        const data = await response.json();
        setFolders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const handleFolderClick = (folder: FolderWithStats) => {
    router.push(`/folders/${folder.id}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (folders.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onClick={() => handleFolderClick(folder)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
