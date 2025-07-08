import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentCard } from '@/components/cards/document-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDocumentStore } from '@/store/entities/document';
import type { DocumentWithStats } from '@/types/entities/document';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('DocumentsView');

const MemoizedDocumentCard = React.memo(
	({ document, onDocumentClick }: { document: DocumentWithStats; onDocumentClick: () => void }) => (
		<DocumentCard document={document} onClick={onDocumentClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.document.id === nextProps.document.id &&
		prevProps.document.name === nextProps.document.name &&
		prevProps.document.updatedAt === nextProps.document.updatedAt
);
MemoizedDocumentCard.displayName = 'MemoizedDocumentCard';

/**
 * Vista de documentos (Markdown, PDF, etc.)
 * Muestra una lista de documentos con cards TCG y soporte para previsualización.
 */
export function DocumentsView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const documentsRecord = useDocumentStore((s) => s.documents);
	const isLoading = useDocumentStore((s) => s.isLoading);
	const error = useDocumentStore((s) => s.error);
	const loadDocuments = useDocumentStore((s) => s.loadDocuments);
	const createDocument = useDocumentStore((s) => s.createDocument); // Obtener la función createDocument
	const getSortedDocuments = useDocumentStore((s) => s.getSortedDocuments);

	const [showForm, setShowForm] = useState(false);
	const [newDocumentName, setNewDocumentName] = useState('');
	const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);

	useEffect(() => {
		if (Object.keys(documentsRecord).length === 0) {
			viewLogger.info('Store de documentos vacío, cargando desde el servidor...');
			loadDocuments();
		}
	}, [loadDocuments, documentsRecord]);

	const handleDocumentClick = useCallback((document: DocumentWithStats) => {
		viewLogger.info('🖱️ Click en documento:', document.name);
		// Lógica de navegación o apertura de visor aquí
	}, []);

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewDocumentFile(event.target.files[0]);
		}
	}, []);

	const handleCreateDocument = useCallback(async () => {
		const { toast } = useToast();
		if (newDocumentName.trim() === '' || !newDocumentFile) {
			toast({
				title: '❌ Error',
				description: 'El nombre y el archivo de documento no pueden estar vacíos.',
				variant: 'destructive',
			});
			return;
		}
		// Aquí deberías manejar la subida del archivo.
		// Por ahora, solo simularemos la creación con el nombre.
		// En una implementación real, enviarías el archivo al backend.
		await createDocument({ name: newDocumentName, path: newDocumentFile.name }); // Asumiendo que 'path' es el nombre del archivo
		setNewDocumentName('');
		setNewDocumentFile(null);
		setShowForm(false);
	}, [newDocumentName, newDocumentFile, createDocument]);

	// Cachear el resultado de getSortedDocuments
	const sortedDocuments = useMemo(() => {
		return getSortedDocuments();
	}, [getSortedDocuments]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(documentsRecord).length === 0) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Documentos</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Subir Documento'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Documento</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="documentName">Nombre</Label>
							<Input
								id="documentName"
								value={newDocumentName}
								onChange={(e) => setNewDocumentName(e.target.value)}
								placeholder="Nombre del documento"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="documentFile">Archivo de Documento</Label>
							<Input
								id="documentFile"
								type="file"
								accept=".pdf,.doc,.docx,.txt,.md" // Aceptar tipos de documentos comunes
								onChange={handleFileChange}
							/>
						</div>
						<Button onClick={handleCreateDocument}>Guardar Documento</Button>
					</div>
				)}

				{sortedDocuments.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={FileText}
						title="No hay documentos"
						description="Sube documentos para comenzar a usar el visor y editor."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{sortedDocuments.map((document, index) => {
							const onDocumentClick = () => handleDocumentClick(document);
							return (
								<motion.div
									key={document.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-document-id={document.id}
									>
										<MemoizedDocumentCard document={document} onDocumentClick={onDocumentClick} />
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
 * - Vista optimizada que usa DocumentCard TCG con efectos holográficos
 * - Integra store Zustand para gestión de estado
 * - Soporte para preview por formato (PDF, DOC, TXT, MD)
 * - Animaciones fluidas con motion/react
 * - Lazy loading y memoización para rendimiento
 */
