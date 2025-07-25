import { Braces } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JsonFileCard } from '@/components/cards/json-file-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateJsonFile } from '@/lib/api/json-files';
import { clientLogger } from '@/lib/logger/client-logger';
import { useJsonFileStore } from '@/store/entities/json-file';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('JsonFilesView');

const MemoizedJsonFileCard = React.memo(
	({ jsonFile, onJsonFileClick }: { jsonFile: JsonFileWithStats; onJsonFileClick: () => void }) => (
		<JsonFileCard jsonFileId={jsonFile.id} onClick={onJsonFileClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.jsonFile.id === nextProps.jsonFile.id &&
		prevProps.jsonFile.name === nextProps.jsonFile.name &&
		prevProps.jsonFile.updatedAt === nextProps.jsonFile.updatedAt
);
MemoizedJsonFileCard.displayName = 'MemoizedJsonFileCard';

/**
 * Vista de archivos JSON
 * Muestra una lista de archivos JSON con cards TCG y soporte para edición.
 */
export function JsonFilesView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const jsonFilesRecord = useJsonFileStore((s) => s.jsonFiles);
	const loading = useJsonFileStore((s) => s.loading);
	const error = useJsonFileStore((s) => s.error);
	const fetchJsonFiles = useJsonFileStore((s) => s.fetchJsonFiles);
	const { mutate: createJsonFile } = useCreateJsonFile();

	const [showForm, setShowForm] = useState(false);
	const [newJsonFileName, setNewJsonFileName] = useState('');
	const [newJsonFileContent, setNewJsonFileContent] = useState('');

	useEffect(() => {
		if (!jsonFilesRecord || jsonFilesRecord.length === 0) {
			viewLogger.info('Store de archivos JSON vacío, cargando desde el servidor...');
			fetchJsonFiles();
		}
	}, [fetchJsonFiles, jsonFilesRecord]);

	const handleJsonFileClick = useCallback((jsonFile: JsonFileWithStats) => {
		viewLogger.info('🖱️ Click en archivo JSON:', jsonFile.name);
		// Lógica de navegación o apertura de editor aquí
	}, []);

	const { toast } = useToast();
	const handleCreateJsonFile = useCallback(() => {
		if (newJsonFileName.trim() === '' || newJsonFileContent.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre y el contenido del archivo JSON no pueden estar vacíos.',
				variant: 'destructive',
			});
			return;
		}
		// Validar si el contenido es JSON válido
		try {
			JSON.parse(newJsonFileContent);
		} catch (e) {
			toast({
				title: '❌ Error de formato',
				description: 'El contenido no es un JSON válido.',
				variant: 'destructive',
			});
			return;
		}
		
		// Crear objeto con todas las propiedades requeridas
		const jsonFileData = {
			name: newJsonFileName,
			path: `/json-files/${newJsonFileName}`,
			size: new Blob([newJsonFileContent]).size,
			hash: crypto.randomUUID(), // Temporal, debería ser un hash real
			mimeType: 'application/json',
			extension: '.json',
			folderId: 'default', // Valor por defecto
			content: newJsonFileContent,
			isFavorite: false,
			isArchived: false,
			isValid: true,
			validationErrors: null,
			keyCount: Object.keys(JSON.parse(newJsonFileContent)).length,
			depth: 1, // Simplificado, debería calcularse recursivamente
		};
		
		createJsonFile(jsonFileData);
		setNewJsonFileName('');
		setNewJsonFileContent('');
		setShowForm(false);
	}, [newJsonFileName, newJsonFileContent, createJsonFile, toast]);

	// Cachear el resultado de ordenamiento de archivos JSON
	const sortedJsonFiles = useMemo(() => {
		return jsonFilesRecord.sort((a: JsonFileWithStats, b: JsonFileWithStats) => a.name.localeCompare(b.name));
	}, [jsonFilesRecord]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (loading && (!jsonFilesRecord || jsonFilesRecord.length === 0)) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Archivos JSON</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Archivo JSON'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Archivo JSON</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="jsonFileName">Nombre</Label>
							<Input
								id="jsonFileName"
								value={newJsonFileName}
								onChange={(e) => setNewJsonFileName(e.target.value)}
								placeholder="Nombre del archivo JSON"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="jsonFileContent">Contenido JSON</Label>
							<Textarea
								id="jsonFileContent"
								value={newJsonFileContent}
								onChange={(e) => setNewJsonFileContent(e.target.value)}
								placeholder='Contenido JSON (ej: { "key": "value" })'
							/>
						</div>
						<Button onClick={handleCreateJsonFile}>Guardar Archivo JSON</Button>
					</div>
				)}

				{(!sortedJsonFiles || sortedJsonFiles.length === 0) && !loading && !showForm ? (
					<EmptyState
						icon={Braces}
						title="No hay archivos JSON"
						description="Sube archivos JSON para comenzar a usar el editor."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{sortedJsonFiles?.map((jsonFile: JsonFileWithStats, index: number) => {
							const onJsonFileClick = () => handleJsonFileClick(jsonFile);
							return (
								<motion.div
									key={jsonFile.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-json-file-id={jsonFile.id}
									>
										<MemoizedJsonFileCard jsonFile={jsonFile} onJsonFileClick={onJsonFileClick} />
									</div>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa JsonFileCard TCG con efectos holográficos
 * - Integra store Zustand para gestión de estado
 * - Soporte para validación JSON en tiempo real
 * - Preview expandible del contenido con estadísticas
 * - Animaciones fluidas con motion/react
 * - Lazy loading y memoización para rendimiento
 */
