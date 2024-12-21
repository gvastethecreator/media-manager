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
import { ImageIcon, TagIcon, ArrowUpRight, Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { toast } from 'sonner';

interface TagWithStats {
  id: string;
  name: string;
  color: string;
  description?: string;
  count: number;
  recentImages?: string[];
  usageStats?: {
    collections: number;
    folders: number;
  };
}

interface TagCardProps {
  tag: TagWithStats;
  onClick: () => void;
}

function getRandomGradient() {
  const gradients = [
    'from-rose-500 to-indigo-500',
    'from-emerald-500 to-sky-500',
    'from-amber-500 to-pink-500',
    'from-violet-500 to-orange-500',
    'from-cyan-500 to-yellow-500',
    'from-fuchsia-500 to-lime-500',
    'from-purple-500 to-teal-500',
    'from-blue-500 to-red-500',
    'from-green-500 to-purple-500'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-[300px] h-[300px] relative mb-8">
        <Image
          src="/empty-tags.svg"
          alt="No hay etiquetas"
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-2xl font-bold mb-2">No hay etiquetas</h3>
      <p className="text-muted-foreground max-w-[500px]">
        Las etiquetas te ayudan a organizar y encontrar tus imágenes. Crea una nueva etiqueta desde el panel de configuración.
      </p>
    </div>
  );
}

function TagCard({ tag, onClick }: TagCardProps) {
  const router = useRouter();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/settings/tags');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.promise(
        fetch(`/api/tags/${tag.id}`, { method: 'DELETE' }),
        {
          loading: 'Eliminando etiqueta...',
          success: 'Etiqueta eliminada',
          error: 'Error al eliminar la etiqueta'
        }
      );
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
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
        style={{
          borderColor: `${tag.color}50`,
          background: `linear-gradient(160deg, ${tag.color}10 0%, ${tag.color}05 100%)`,
        }}
      >
        <CardHeader className="relative p-4 pb-2 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tag.color }}
              >
                <TagIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{tag.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {tag.description || 'Sin descripción'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
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
              {tag.recentImages && tag.recentImages.length > 0 ? (
                tag.recentImages.map((src, i) => (
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
                Ver imágenes con esta etiqueta
              </Button>
            </div>
          </div>

          {/* Footer con stats */}
          <div className="mt-4 space-y-3">
            {/* Estadísticas */}
            <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <ImageIcon className="w-4 h-4" />
                      <span>{tag.count}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="text-sm">
                    Imágenes con esta etiqueta
                  </HoverCardContent>
                </HoverCard>

                {tag.usageStats && (
                  <>
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help">
                          <TagIcon className="w-4 h-4" />
                          <span>{tag.usageStats.collections}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="text-sm">
                        Colecciones que usan esta etiqueta
                      </HoverCardContent>
                    </HoverCard>

                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help">
                          <TagIcon className="w-4 h-4" />
                          <span>{tag.usageStats.folders}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="text-sm">
                        Carpetas que contienen esta etiqueta
                      </HoverCardContent>
                    </HoverCard>
                  </>
                )}
              </div>

              <Badge
                variant="outline"
                className="border-2"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.count} imágenes
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

export function TagsView({ isResizing }: ViewProps) {
  const router = useRouter();
  const [tags, setTags] = useState<TagWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Error al obtener etiquetas');
        const data = await response.json();
        setTags(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tag: TagWithStats) => {
    router.push(`/tags/${tag.id}`);
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

  if (tags.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {tags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            onClick={() => handleTagClick(tag)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
