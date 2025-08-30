import { FileJson } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateJsonFile, useJsonFiles } from '@/lib/api/json-files';
import { clientLogger } from '@/lib/logger/client-logger';
import { useMultiEntityViewerStore } from '@/stores/multi-entity-viewer.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('JsonFilesView');

export function JsonFilesView(_props: ViewProps) {
	const { data: jsonFiles, isLoading, error } = useJsonFiles();
	const { mutate: createJsonFile } = useCreateJsonFile();
	const { isOpen, entities, currentIndex, openViewer, closeViewer, setCurrentIndex } = useMultiEntityViewerStore();

	const [showForm, setShowForm] = useState(false);
	const [newFileName, setNewFileName] = useState('');
	const [newFileContent, setNewFileContent] = useState('{}');

	useEffect(() => {
		if (jsonFiles?.data && jsonFiles.data.length > 0) {
			viewLogger.info(`✅ ${jsonFiles.data.length} archivos JSON cargados.`);
		}
	}, [jsonFiles]);

	const { toast } = useToast();
	const handleCreateJsonFile = useCallback(async () => {
		if (newFileName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del archivo no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}

		let content: unknown;
		try {
			content = JSON.parse(newFileContent);
		} catch (err) {
			toast({
				title: '❌ Error',
				description: 'El contenido JSON no es válido.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const jsonFileData = {
				name: newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`,
				path: `/json-files/${newFileName}`,
				size: new TextEncoder().encode(newFileContent).length,
				hash: crypto.randomUUID(),
				mimeType: 'application/json',
				extension: '.json',
				folderId: 'default',
				content: newFileContent,
				isFavorite: false,
				isArchived: false,
				isValid: true,
				validationErrors: null,
				keyCount: typeof content === 'object' && content !== null ? Object.keys(content).length : 0,
				depth: 1,
			};

			createJsonFile(jsonFileData);
			toast({
				title: '✅ Éxito',
				description: `Archivo JSON "${jsonFileData.name}" creado.`,
			});
			setNewFileName('');
			setNewFileContent('{}');
			setShowForm(false);
		} catch (err) {
			toast({
				title: '❌ Error',
				description: `Error al crear el archivo "${newFileName}".`,
				variant: 'destructive',
			});
		}
	}, [newFileName, newFileContent, toast, createJsonFile]);

	const handleFileClick = useCallback((item: AnyEntityWithStats) => {
		const jsonFile = item as unknown as JsonFileWithStats;
		viewLogger.info('🖱️ Click en archivo JSON:', jsonFile.name);
		// TODO: Implementar navegación a detalle de archivo
	}, []);

	const handleFileDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			const jsonFile = item as unknown as JsonFileWithStats;
			viewLogger.info('🖱️ Doble click en archivo JSON:', jsonFile.name);

			// Abrir MultiEntityViewer con todos los archivos JSON
			const jsonFileItems = (jsonFiles?.data || []) as unknown as AnyEntityWithStats[];
			const currentIndex = jsonFileItems.findIndex((f) => f.id === jsonFile.id);
			openViewer(jsonFileItems, currentIndex >= 0 ? currentIndex : 0);
		},
		[jsonFiles, openViewer]
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

	const jsonFileItems = (jsonFiles?.data || []) as unknown as AnyEntityWithStats[];

	return (
		<>
			<ScrollArea className="h-full">
				<div className="container mx-auto p-6">
					<h2 className="mb-4 font-bold text-xl">Vista de Archivos JSON</h2>

					<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
						{showForm ? 'Cancelar' : 'Crear Archivo JSON'}
					</Button>

					{showForm && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-6 rounded-lg border p-4 shadow-sm"
							initial={{ opacity: 0, y: -20 }}
						>
							<h3 className="mb-3 font-semibold text-lg">Nuevo Archivo JSON</h3>
							<div className="mb-3 grid gap-2">
								<Label htmlFor="jsonFileName">Nombre del archivo</Label>
								<Input
									id="jsonFileName"
									onChange={(e) => setNewFileName(e.target.value)}
									placeholder="archivo.json"
									value={newFileName}
								/>
							</div>
							<div className="mb-4 grid gap-2">
								<Label htmlFor="jsonFileContent">Contenido JSON</Label>
								<Textarea
									className="h-32 font-mono"
									id="jsonFileContent"
									onChange={(e) => setNewFileContent(e.target.value)}
									placeholder='{"key": "value"}'
									value={newFileContent}
								/>
							</div>
							<Button onClick={handleCreateJsonFile}>Guardar Archivo</Button>
						</motion.div>
					)}

					{(!jsonFileItems || jsonFileItems.length === 0) && !isLoading && !showForm ? (
						<EmptyState
							description="Crea un archivo JSON para almacenar datos estructurados."
							icon={FileJson}
							title="No hay archivos JSON creados"
						/>
					) : (
						<div className="h-[calc(100vh-200px)]">
							<FileBrowser
								isLoading={isLoading}
								items={jsonFileItems}
								onItemClick={handleFileClick}
								onItemDoubleClick={handleFileDoubleClick}
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
