import { Edit2, FileText, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateDocument, useDeleteDocument, useDocuments, useUpdateDocument } from '@/lib/api/documents';
import { toastService } from '@/lib/ui/toast';
import type { DocumentCreateInput, DocumentWithStats } from '@/types/entities/document';

export function DocumentSettings() {
	const { data, isLoading, error } = useDocuments();
	const createDocument = useCreateDocument();
	const updateDocument = useUpdateDocument();
	const deleteDocument = useDeleteDocument();

	const [search, setSearch] = useState('');
	const [showCreate, setShowCreate] = useState(false);
	const [editing, setEditing] = useState<DocumentWithStats | null>(null);
	const [nameInput, setNameInput] = useState('');

	const documents = data ?? [];
	const filtered = useMemo(
		() => documents.filter((d: DocumentWithStats) => d.name.toLowerCase().includes(search.toLowerCase())),
		[documents, search]
	);

	const handleCreate = async () => {
		try {
			if (!nameInput.trim()) return;
			const createData: DocumentCreateInput = {
				name: nameInput.trim(),
				path: `virtual:${Date.now()}.txt`,
				size: 0,
				hash: `${Date.now()}`,
				mimeType: 'text/plain',
				extension: 'txt',
				folderId: 'root',
				isFavorite: false,
				isArchived: false,
				pageCount: null,
				wordCount: null,
				language: null,
				title: nameInput.trim(),
				author: null,
				subject: null,
				keywords: null,
				creator: null,
				producer: null,
				creationDate: null,
				modificationDate: null,
				encrypted: false,
				version: null,
				content: '',
				summary: null,
			};
			await createDocument.mutateAsync(createData);
			setNameInput('');
			setShowCreate(false);
			toastService.success('Documento creado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al crear documento', { description: msg });
		}
	};

	const handleUpdate = async () => {
		try {
			if (!editing) return;
			if (!nameInput.trim()) return;
			await updateDocument.mutateAsync({
				id: editing.id,
				data: {
					name: nameInput.trim(),
					title: nameInput.trim(),
				},
			});
			setEditing(null);
			setNameInput('');
			toastService.success('Documento actualizado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al actualizar documento', { description: msg });
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteDocument.mutateAsync(id);
			toastService.success('Documento eliminado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			toastService.error('Error al eliminar documento', { description: msg });
		}
	};

	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<FileText className="h-4 w-4" />
						<span>Documentos</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3">
					<div className="mb-3 flex items-center gap-2">
						<Input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documentos..." value={search} />
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
							{filtered.map((d: DocumentWithStats) => (
								<Card className="p-3" key={d.id}>
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium text-sm">{d.name}</div>
											<div className="text-muted-foreground text-xs">
												{d.size ? `${(d.size / 1024).toFixed(1)}KB` : 'Sin tamaño'}
											</div>
											{d.pageCount && <div className="text-muted-foreground text-xs">{d.pageCount} páginas</div>}
											{d.wordCount && <div className="text-muted-foreground text-xs">{d.wordCount} palabras</div>}
										</div>
										<div className="flex items-center gap-1">
											<Button
												className="h-8 w-8"
												onClick={() => {
													setEditing(d);
													setNameInput(d.name);
												}}
												size="icon"
												title="Editar"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												className="h-8 w-8 hover:text-destructive"
												onClick={() => handleDelete(d.id)}
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
						<DialogTitle>Nuevo documento</DialogTitle>
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
						<DialogTitle>Editar documento</DialogTitle>
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
