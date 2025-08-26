import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Box, PlusCircle, Trash, Edit2 } from 'lucide-react';
import { useFile3Ds, useCreateFile3D, useDeleteFile3D, useUpdateFile3D } from '@/lib/api/file3ds';
import type { File3DWithStats, File3DCreateInput } from '@/types/entities/file3d';
import { toastService } from '@/lib/ui/toast';

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
						<Input placeholder="Buscar archivos 3D..." value={search} onChange={(e) => setSearch(e.target.value)} />
						<Button size="sm" onClick={() => setShowCreate(true)}>
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
								<Card key={f.id} className="p-3">
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
												size="icon"
												variant="ghost"
												className="h-8 w-8"
												title="Editar"
												onClick={() => {
													setEditing(f);
													setNameInput(f.name);
												}}
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 hover:text-destructive"
												title="Eliminar"
												onClick={() => handleDelete(f.id)}
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
				open={showCreate}
				onOpenChange={(o) => {
					if (!o) {
						setShowCreate(false);
						setNameInput('');
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Nuevo archivo 3D</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input placeholder="Nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowCreate(false);
									setNameInput('');
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleCreate}>Crear</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(editing)}
				onOpenChange={(o) => {
					if (!o) {
						setEditing(null);
						setNameInput('');
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Editar archivo 3D</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input placeholder="Nombre" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setEditing(null);
									setNameInput('');
								}}
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
