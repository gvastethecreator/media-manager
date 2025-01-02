'use client';

import { useEffect, useState } from 'react';
import { ViewProps } from '../types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collectionService, CollectionWithStats } from '@/services/collection.service';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImageIcon, FolderIcon, TagIcon, ArrowUpRight, Download, Heart, Settings2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { toast } from 'sonner';

interface CollectionCardProps {
  collection: CollectionWithStats & {
    recentImages?: string[];
    topTags?: { name: string; count: number }[];
  };
  onClick: () => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-[300px] h-[300px] relative mb-8">
        <Image
          src="/empty-collections.svg"
          alt="No hay colecciones"
          fill
          className="object-contain"
        />
      </div>
      <h3 className="text-2xl font-bold mb-2">No hay colecciones</h3>
      <p className="text-muted-foreground max-w-[500px]">
        Las colecciones te ayudan a organizar tus imágenes. Crea una nueva colección desde el panel de configuración.
      </p>
    </div>
  );
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

function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const bgColor = collection.color || '#3b82f6';
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.promise(
        fetch(`/api/collections/${collection.id}/download`),
        {
          loading: 'Preparando descarga...',
          success: 'Descarga iniciada',
          error: 'Error al descargar la colección'
        }
      );
    } catch (error) {
      console.error('Error downloading collection:', error);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/settings/collections');
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
          borderColor: `${bgColor}50`,
          background: `linear-gradient(160deg, ${bgColor}10 0%, ${bgColor}05 100%)`,
        }}
      >
        <CardHeader className="relative p-4 pb-2 flex-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{collection.emoji}</span>
              <div>
                <CardTitle className="text-xl">{collection.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {collection.description || 'Sin descripción'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isFavorite && "text-red-500"
                )}
                onClick={handleFavorite}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
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
              {collection.recentImages && collection.recentImages.length > 0 ? (
                collection.recentImages.map((src, i) => (
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
                // Mostrar 9 placeholders cuando no hay imágenes
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
                {collection.recentImages && collection.recentImages.length > 0
                  ? "Ver todas las imágenes"
                  : "Colección vacía"}
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
                      <FolderIcon className="w-4 h-4" />
                      <span>{collection.count}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="text-sm">
                    Esta colección contiene {collection.count} imágenes
                  </HoverCardContent>
                </HoverCard>

                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <TagIcon className="w-4 h-4" />
                      <span>{collection.topTags?.length || 0}</span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="text-sm">
                    Etiquetas más usadas en esta colección
                  </HoverCardContent>
                </HoverCard>
              </div>

              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <span>{collection.size}</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="text-sm">
                  Espacio total usado por las imágenes
                </HoverCardContent>
              </HoverCard>
            </div>

            {collection.topTags && collection.topTags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1">
                  {collection.topTags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs hover:bg-accent transition-colors"
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </>
            )}
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

export function CollectionsView({ isResizing }: ViewProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        const data = await collectionService.getCollections();
        setCollections(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleCollectionClick = (collection: CollectionWithStats) => {
    router.push(`/collections/${collection.id}`);
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

  if (collections.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onClick={() => handleCollectionClick(collection)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
