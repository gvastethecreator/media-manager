import { Edit2, Image as ImageIcon, Loader2, Star, StarOff, Trash } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteImage, useImages, useToggleFavorite, useUpdateImage } from '@/lib/api/images';
import { toastService } from '@/lib/ui/toast';
import type { ImageWithStats } from '@/types/entities/image/base';

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
		sortOrder: 'desc',
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
							className="max-w-md"
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Buscar imágenes..."
							value={search}
						/>
					</div>

					{isLoading ? (
						<div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Cargando biblioteca...
						</div>
					) : error ? (
						<div className="p-4 text-center text-destructive text-sm">Error al cargar imágenes: {error.message}</div>
					) : images.length === 0 ? (
						<div className="py-6 text-center text-muted-foreground">
							<div className="mb-2 flex justify-center">
								<ImageIcon className="h-10 w-10 opacity-20" />
							</div>
							<p>No se encontraron imágenes</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
								{images.map((img) => (
									<Card className="group relative overflow-hidden" key={img.id}>
										<div className="relative aspect-square bg-muted/50">
											{img.thumbnailUrl ? (
												<img
													alt={img.name}
													className="h-full w-full object-cover transition-transform group-hover:scale-105"
													loading="lazy"
													src={img.thumbnailUrl}
												/>
											) : (
												<div className="flex h-full items-center justify-center">
													<ImageIcon className="h-8 w-8 text-muted-foreground/30" />
												</div>
											)}

											{/* Actions Overlay */}
											<div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
												<Button
													className="h-8 w-8 bg-background/80 text-foreground hover:bg-background"
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
													className={cn(
														'h-8 w-8 hover:bg-background/80',
														img.isFavorite ? 'text-warning' : 'text-muted-foreground/70 hover:text-foreground'
													)}
													onClick={() => handleToggleFavorite(img)}
													size="icon"
													title={img.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
													variant="ghost"
												>
													{img.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
												</Button>
											</div>
										</div>
										<div className="p-2">
											<div className="truncate font-medium text-xs" title={img.name}>
												{img.name}
											</div>
											<div className="mt-1 flex items-center justify-between">
												<span className="text-[10px] text-muted-foreground uppercase">
													{(img as any).extension?.replace('.', '') || 'IMG'}
												</span>
												<Button
													className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
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
										disabled={!pagination.hasPrev}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										size="sm"
										variant="outline"
									>
										Anterior
									</Button>
									<span className="flex items-center px-4 text-muted-foreground text-sm">
										Página {page} de {Math.ceil(pagination.total / limit)}
									</span>
									<Button
										disabled={!pagination.hasNext}
										onClick={() => setPage((p) => p + 1)}
										size="sm"
										variant="outline"
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
