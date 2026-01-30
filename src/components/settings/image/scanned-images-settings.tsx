import { Edit2, Image as ImageIcon, Loader2, Trash, Star, StarOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImages, useDeleteImage, useUpdateImage, useToggleFavorite } from '@/lib/api/images';
import { toastService } from '@/lib/ui/toast';
import type { ImageWithStats } from '@/types/entities/image/base';
import { Badge } from '@/components/ui/badge';

export function ScannedImagesSettings() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 50;

    // Fetch real images
    const { data, isLoading, error } = useImages({
        search: search || undefined,
        limit,
        offset: (page - 1) * limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const updateImage = useUpdateImage();
    const deleteImage = useDeleteImage();
    const toggleFavorite = useToggleFavorite();

    const [editing, setEditing] = useState<ImageWithStats | null>(null);
    const [nameInput, setNameInput] = useState('');

    const images = data?.data ?? [];
    const pagination = data?.pagination;

    const handleUpdate = async () => {
        try {
            if (!editing) return;
            if (!nameInput.trim()) return;
            await updateImage.mutateAsync({ id: editing.id, data: { name: nameInput.trim() } });
            setEditing(null);
            setNameInput('');
            toastService.success('Imagen actualizada');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            toastService.error('Error al actualizar imagen', { description: msg });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer.')) return;
        try {
            await deleteImage.mutateAsync(id);
            toastService.success('Imagen eliminada');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            toastService.error('Error al eliminar imagen', { description: msg });
        }
    };

    const handleToggleFavorite = async (image: ImageWithStats) => {
        try {
            await toggleFavorite.mutateAsync({ id: image.id, isFavorite: !image.isFavorite });
            toastService.success(image.isFavorite ? 'Quitado de favoritos' : 'Añadido a favoritos');
        } catch (e) {
            toastService.error('Error al actualizar favoritos');
        }
    };

    return (
        <ScrollArea className="h-[calc(100vh-8rem)] w-full">
            <Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="flex items-center justify-between font-medium text-base text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Biblioteca de Imágenes ({pagination?.total || 0})</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="mb-3 flex items-center gap-2">
                        <Input
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Buscar imágenes..."
                            value={search}
                            className="max-w-md"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando biblioteca...
                        </div>
                    ) : error ? (
                        <div className="text-destructive text-sm p-4 text-center">
                            Error al cargar imágenes: {error.message}
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="flex justify-center mb-2">
                                <ImageIcon className="h-10 w-10 opacity-20" />
                            </div>
                            <p>No se encontraron imágenes</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {images.map((img) => (
                                    <Card className="group overflow-hidden relative" key={img.id}>
                                        <div className="aspect-square bg-muted/50 relative">
                                            {img.thumbnailUrl ? (
                                                <img
                                                    src={img.thumbnailUrl}
                                                    alt={img.name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                                </div>
                                            )}

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    className="h-8 w-8 bg-background/80 hover:bg-background text-foreground"
                                                    onClick={() => {
                                                        setEditing(img);
                                                        setNameInput(img.name);
                                                    }}
                                                    size="icon"
                                                    title="Editar nombre"
                                                    variant="ghost"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    className={cn("h-8 w-8 hover:bg-background/80", img.isFavorite ? "text-yellow-400" : "text-white/70 hover:text-white")}
                                                    onClick={() => handleToggleFavorite(img)}
                                                    size="icon"
                                                    title={img.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                                                    variant="ghost"
                                                >
                                                    {img.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <div className="font-medium text-xs truncate" title={img.name}>{img.name}</div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-muted-foreground text-[10px] uppercase">{(img as any).extension?.replace('.', '') || 'IMG'}</span>
                                                <Button
                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive p-0"
                                                    onClick={() => handleDelete(img.id)}
                                                    size="sm"
                                                    title="Eliminar"
                                                    variant="ghost"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination - Simple Implementation */}
                            {pagination && pagination.total > limit && (
                                <div className="flex justify-center gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.hasPrev}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                                        Página {page} de {Math.ceil(pagination.total / limit)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.hasNext}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                onOpenChange={(o) => {
                    if (!o) {
                        setEditing(null);
                        setNameInput('');
                    }
                }}
                open={Boolean(editing)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar imagen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input onChange={(e) => setNameInput(e.target.value)} placeholder="Nombre" value={nameInput} />
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => {
                                    setEditing(null);
                                    setNameInput('');
                                }}
                                variant="outline"
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleUpdate}>Guardar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ScrollArea>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
