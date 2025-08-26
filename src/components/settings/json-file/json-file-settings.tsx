import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileText, PlusCircle, Trash, Edit2 } from 'lucide-react';
import { useJsonFiles, useCreateJsonFile, useDeleteJsonFile, useUpdateJsonFile } from '@/lib/api/json-files';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { toastService } from '@/lib/ui/toast';

export function JsonFileSettings() {
	const { data, isLoading, error } = useJsonFiles();
	const createJsonFile = useCreateJsonFile();
	const updateJsonFile = useUpdateJsonFile();
	const deleteJsonFile = useDeleteJsonFile();

	const [search, setSearch] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<JsonFileWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const jsonFiles = data?.data ?? [];
	const filtered = useMemo(
		() => jsonFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
		[jsonFiles, search]
	);

	const handleCreate = async () => {
		try {
			if (!nameInput.trim()) return;
			// Crear entrada mínima con datos requeridos por schema
			await createJsonFile.mutateAsync({
				name: nameInput.trim(),
				path: `virtual:${Date.now()}.json`,
				size: 0,
				hash: `${Date.now()}`,
				mimeType: 'application/json',
				extension: 'json',
				folderId: 'root',
				isFavorite: false,
				isArchived: false,
				content: '{}',
				isValid: true,
			});
			setNameInput('');
			setShowCreate(false);
			toastService.success('Archivo JSON creado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al crear archivo JSON', { description: msg });
		}
	};

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateJsonFile.mutateAsync({ id: editing.id, data: { name: nameInput.trim() } });
			setEditing(null);
			setNameInput('');
			toastService.success('Archivo JSON actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar archivo JSON', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteJsonFile.mutateAsync(id);
			toastService.success('Archivo JSON eliminado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar archivo JSON', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<FileText className="h-4 w-4" />
						<span>Archivos JSON</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input placeholder="Buscar archivos JSON..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
							{filtered.map((f) => (
								<Card key={f.id} className="p-3">
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{f.name}</div>
											<div className="text-muted-foreground text-xs">
												{f.size ? `${(f.size / 1024).toFixed(1)}KB` : 'Sin tamaño'}
											</div>
											{f.isValid !== undefined && (
												<div className={`text-xs ${f.isValid ? 'text-green-600' : 'text-red-600'}`}>
													{f.isValid ? 'JSON válido' : 'JSON inválido'}
												</div>
											)}
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
						<DialogTitle>Nuevo archivo JSON</DialogTitle>
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
						<DialogTitle>Editar archivo JSON</DialogTitle>
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
