import { Box, Edit2, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateFile3D, useDeleteFile3D, useFile3Ds, useUpdateFile3D } from '@/lib/api/file3ds';
import { toastService } from '@/lib/ui/toast';
import type { File3DCreateInput, File3DWithStats } from '@/types/entities/file3d';

export function File3DSettings() {
	const { data, isLoading, error } = useFile3Ds();
	const createFile3D = useCreateFile3D();
	const updateFile3D = useUpdateFile3D();
	const deleteFile3D = useDeleteFile3D();

	const [search, setSearch] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<File3DWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const file3ds = data ?? [];
	const filtered = useMemo(
		() => file3ds.filter((f: File3DWithStats) => f.name.toLowerCase().includes(search.toLowerCase())),
		[file3ds, search]
	);

	const handleCreate = async () => {
		try {
			if (!nameInput.trim()) return;
			const createData: File3DCreateInput = {
				name: nameInput.trim(),
				path: `virtual:${Date.now()}.obj`,
				size: 0,
				hash: `${Date.now()}`,
				mimeType: 'model/obj',
				extension: 'obj',
				folderId: 'root',
				isFavorite: false,
				isArchived: false,
				format: 'obj',
				version: null,
				vertices: null,
				faces: null,
				triangles: null,
				materials: null,
				textures: null,
				animations: null,
				bones: null,
				scenes: null,
				cameras: null,
				lights: null,
				hasUV: false,
				hasNormals: false,
				hasColors: false,
				boundingBox: null,
			};
			await createFile3D.mutateAsync(createData);
			setNameInput('');
			setShowCreate(false);
			toastService.success('Archivo 3D creado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al crear archivo 3D', { description: msg });
		}
	};

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateFile3D.mutateAsync({
				id: editing.id,
				data: {
					name: nameInput.trim(),
				},
			});
			setEditing(null);
			setNameInput('');
			toastService.success('Archivo 3D actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar archivo 3D', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteFile3D.mutateAsync(id);
			toastService.success('Archivo 3D eliminado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar archivo 3D', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Box className="h-4 w-4" />
						<span>Archivos 3D</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar archivos 3D..." value={search} />
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
							{filtered.map((f: File3DWithStats) => (
								<Card className="p-3" key={f.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{f.name}</div>
											<div className="text-muted-foreground text-xs">
												{f.size ? `${(f.size / 1024).toFixed(1)}KB` : 'Sin tamaño'}
											</div>
											{f.format && (
												<div className="text-muted-foreground text-xs">Formato: {f.format.toUpperCase()}</div>
											)}
											{f.vertices && (
												<div className="text-muted-foreground text-xs">{f.vertices.toLocaleString()} vértices</div>
											)}
											{f.faces && <div className="text-muted-foreground text-xs">{f.faces.toLocaleString()} caras</div>}
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(f);
													setNameInput(f.name);
												}}
												size="icon"
												title="Editar"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(f.id)}
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
						<DialogTitle>Nuevo archivo 3D</DialogTitle>
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
						<DialogTitle>Editar archivo 3D</DialogTitle>
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
