import { FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useCreateDocument, useDocuments } from '@/lib/api/documents';
import { clientLogger } from '@/lib/logger/client-logger';
import { useMultiEntityViewerStore } from '@/stores/multi-entity-viewer.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { DocumentWithStats } from '@/types/entities/document';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('DocumentsView');

export function DocumentsView(_props: ViewProps) {
	const { data: documents, isLoading, error } = useDocuments();
	const { mutate: createDocument } = useCreateDocument();
	const { isOpen, entities, currentIndex, openViewer, closeViewer, setCurrentIndex } = useMultiEntityViewerStore();

	const [showForm, setShowForm] = useState(false);
	const [newDocumentName, setNewDocumentName] = useState('');
	const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);

	useEffect(() => {
		if (documents && documents.length > 0) {
			viewLogger.info(`✅ ${documents.length} documentos cargados.`);
		}
	}, [documents]);

	const { toast } = useToast();

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewDocumentFile(event.target.files[0]);
		}
	}, []);

	const handleCreateDocument = useCallback(async () => {
		if (newDocumentName.trim() === '' || !newDocumentFile) {
			toast({
				title: '❌ Error',
				description: 'El nombre y el archivo de documento no pueden estar vacíos.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const documentData = {
				name: newDocumentName,
				path: newDocumentFile.name,
				size: newDocumentFile.size,
				hash: crypto.randomUUID(),
				mimeType: newDocumentFile.type || 'application/octet-stream',
				extension: newDocumentFile.name.split('.').pop() || '',
				folderId: 'default-folder',
				isFavorite: false,
				isArchived: false,
				pageCount: null,
				wordCount: null,
				language: null,
				title: null,
				author: null,
				subject: null,
				keywords: null,
				creator: null,
				producer: null,
				creationDate: null,
				modificationDate: null,
				encrypted: false,
				version: null,
				content: null,
				summary: null,
			};

			createDocument(documentData);
			toast({
				title: '✅ Éxito',
				description: `Documento "${newDocumentName}" creado.`,
			});
			setNewDocumentName('');
			setNewDocumentFile(null);
			setShowForm(false);
		} catch (err) {
			toast({
				title: '❌ Error',
				description: `Error al crear el documento "${newDocumentName}".`,
				variant: 'destructive',
			});
		}
	}, [newDocumentName, newDocumentFile, toast, createDocument]);

	const handleDocumentClick = useCallback((item: AnyEntityWithStats) => {
		const document = item as unknown as DocumentWithStats;
		viewLogger.info('🖱️ Click en documento:', document.name);
		// TODO: Implementar navegación a detalle de documento
	}, []);

	const handleDocumentDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			const document = item as unknown as DocumentWithStats;
			viewLogger.info('🖱️ Doble click en documento:', document.name);

			// Abrir MultiEntityViewer con todos los documentos
			const documentItems = (documents || []) as unknown as AnyEntityWithStats[];
			const currentIndex = documentItems.findIndex((d) => d.id === document.id);
			openViewer(documentItems, currentIndex >= 0 ? currentIndex : 0);
		},
		[documents, openViewer]
	);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	const documentItems = (documents || []) as unknown as AnyEntityWithStats[];

	return (
		<>
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					<h2 className="mb-4 font-bold text-xl">Vista de Documentos</h2>

					<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
						{showForm ? 'Cancelar' : 'Subir Documento'}
					</Button>

					{showForm && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-6 rounded-lg border p-4 shadow-sm"
							initial={{ opacity: 0, y: -20 }}
						>
							<h3 className="mb-3 font-semibold text-lg">Nuevo Documento</h3>
							<div className="mb-3 grid gap-2">
								<Label htmlFor="documentName">Nombre del documento</Label>
								<Input
									id="documentName"
									onChange={(e) => setNewDocumentName(e.target.value)}
									placeholder="Mi documento"
									value={newDocumentName}
								/>
							</div>
							<div className="mb-4 grid gap-2">
								<Label htmlFor="documentFile">Archivo</Label>
								<Input accept=".pdf,.doc,.docx,.txt,.md" id="documentFile" onChange={handleFileChange} type="file" />
								{newDocumentFile && (
									<p className="text-muted-foreground text-sm">Archivo seleccionado: {newDocumentFile.name}</p>
								)}
							</div>
							<Button onClick={handleCreateDocument}>Subir Documento</Button>
						</motion.div>
					)}

					{(!documentItems || documentItems.length === 0) && !isLoading && !showForm ? (
						<EmptyState
							description="Sube documentos para organizarlos y buscar en su contenido."
							icon={FileText}
							title="No hay documentos"
						/>
					) : (
						<div className="h-[calc(100vh-200px)]">
							<FileBrowser
								isLoading={isLoading}
								items={documentItems}
								onItemClick={handleDocumentClick}
								onItemDoubleClick={handleDocumentDoubleClick}
							/>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* MultiEntityViewer */}
			<MultiEntityViewer
				currentIndex={currentIndex}
				entities={entities}
				isOpen={isOpen}
				onClose={closeViewer}
				onIndexChange={setCurrentIndex}
			/>
		</>
	);
}
