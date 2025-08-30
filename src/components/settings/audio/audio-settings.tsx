import { Edit2, Loader2, Music2, PlusCircle, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudios, useCreateAudio, useDeleteAudio, useUpdateAudio } from '@/lib/api/audio';
import { toastService } from '@/lib/ui/toast';
import type { AudioWithStats } from '@/types/entities/audio';

export function AudioSettings() {
	const { data, isLoading, error } = useAudios();
	const createAudio = useCreateAudio();
	const updateAudio = useUpdateAudio();
	const deleteAudio = useDeleteAudio();

	const [search, setSearch] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<AudioWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const audios = data ?? [];
	const filtered = useMemo(
		() => audios.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
		[audios, search]
	);

	const handleCreate = async () => {
		try {
			if (!nameInput.trim()) return;
			// Crear mínimo viable: nombre y placeholders obligatorios
			// Nota: Estos campos deben existir según el schema base
			await createAudio.mutateAsync({
				name: nameInput.trim(),
				description: null,
				path: `virtual:${Date.now()}`,
				size: 0,
				hash: `${Date.now()}`,
				mimeType: 'audio/mpeg',
				extension: 'mp3',
				folderId: 'root',
				isFavorite: false,
				isArchived: false,
				duration: null,
				bitrate: null,
				sampleRate: null,
				channels: null,
				format: 'mp3',
				codec: 'mp3',
				title: null,
				artist: null,
				album: null,
				year: null,
				genre: null,
				track: null,
				disc: null,
				albumArtist: null,
				composer: null,
				comment: null,
				lyrics: null,
				bpm: null,
				key: null,
				mood: null,
			});
			setNameInput('');
			setShowCreate(false);
			toastService.success('Audio creado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al crear audio', { description: msg });
		}
	};

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateAudio.mutateAsync({ id: editing.id, data: { name: nameInput.trim() } });
			setEditing(null);
			setNameInput('');
			toastService.success('Audio actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar audio', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteAudio.mutateAsync(id);
			toastService.success('Audio eliminado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar audio', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Music2 className="h-4 w-4" />
						<span>Audio</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar audios..." value={search} />
						<Button onClick={() => setShowCreate(true)} size="sm">
							<PlusCircle className="mr-2 h-4 w-4" /> Nuevo
						</Button>
					</div>

					{isLoading ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Cargando...
						</div>
					) : error ? (
						<div className="text-destructive text-sm">{error.message}</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{filtered.map((a) => (
								<Card className="p-3" key={a.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{a.name}</div>
											<div className="text-muted-foreground text-xs">{a.format ?? a.extension}</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(a);
													setNameInput(a.name);
												}}
												size="icon"
												title="Editar"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(a.id)}
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
						setShowCreate(false);
						setNameInput('');
					}
				}}
				open={showCreate}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Nuevo audio</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input onChange={(e) => setNameInput(e.target.value)} placeholder="Nombre" value={nameInput} />
						<div className="flex justify-end gap-2">
							<Button
								onClick={() => {
									setShowCreate(false);
									setNameInput('');
								}}
								variant="outline"
							>
								Cancelar
							</Button>
							<Button onClick={handleCreate}>Crear</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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
						<DialogTitle>Editar audio</DialogTitle>
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
