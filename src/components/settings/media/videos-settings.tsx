/**
 * @file Videos Settings
 * @module components/settings/video/videos-settings
 * @description Configuración y gestión de videos
 */

import { Edit2, Trash, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVideos } from '@/lib/api/videos';
import { toastService } from '@/lib/ui/toast';
import { formatBytes } from '@/lib/utils/format.utils';
import type { VideoWithStats } from '@/types/entities/video';

export function VideosSettings() {
	const { data, isLoading, error } = useVideos({ limit: 1000 });

	const [search, setSearch] = useState('');
	const [editing, setEditing] = useState<VideoWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const videos = data?.data ?? [];
	const filtered = useMemo(
		() => videos.filter((v) => v.name.toLowerCase().includes(search.toLowerCase())),
		[videos, search]
	);

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			// TODO: Implementar useUpdateVideo cuando esté disponible
			// await updateVideo.mutateAsync({ id: editing.id, data: { name: nameInput.trim() } });
			setEditing(null);
			setNameInput('');
			toastService.success('Video actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar video', { description: msg });
		}
	};

	const handleDelete = async (_id: string) => {
		try {
			// TODO: Implementar useDeleteVideo cuando esté disponible
			// await deleteVideo.mutateAsync(id);
			toastService.success('Video eliminado (simulado - API no implementada)');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar video', { description: msg });
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Video className="h-4 w-4" />
						<span>Videos</span>
						<span className="ml-auto text-muted-foreground text-sm">{videos.length} videos</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar videos..." value={search} />
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							Cargando...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((video) => (
								<Card className="p-3" key={video.id}>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-sm">{video.name}</div>
											<div className="text-muted-foreground text-xs">
												{formatDuration(video.duration)} • {formatBytes(video.size)}
												{video.width && video.height && (
													<span>
														{' '}
														• {video.width}x{video.height}
													</span>
												)}
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(video);
													setNameInput(video.name);
												}}
												size="icon"
												title="Editar"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(video.id)}
												size="icon"
												title="Eliminar"
												variant="ghost"
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							))}
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
						<DialogTitle>Editar video</DialogTitle>
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
