import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDocumentStore } from '@/store/entities/document';
import type { DocumentWithStats } from '@/types/entities/document';
import type { ViewProps } from '../types';
import DocumentsContentView from './documents-content-view';

const viewLogger = clientLogger.withContext('DocumentsView');

/**
 * Vista de documentos (Markdown, PDF, etc.)
 * Muestra una lista de documentos con cards TCG y soporte para previsualización.
 */
export function DocumentsView(_props: ViewProps) {
	const navigate = useNavigate();

	// Usar selectores individuales para evitar recrear objetos
	const documentsRecord = useDocumentStore((s) => s.documents);
	const isLoading = useDocumentStore((s) => s.isLoading);
	const error = useDocumentStore((s) => s.error);
	const loadDocuments = useDocumentStore((s) => s.loadDocuments);
	const createDocument = useDocumentStore((s) => s.createDocument); // Obtener la función createDocument
	// 🔥 No existe getSortedDocuments en el store, usar los documentos y ordenarlos aquí
	const documents = Object.values(documentsRecord);
	// Ordenar por updatedAt descendente (más reciente primero)
	const sortedDocuments = useMemo(() => {
		return documents.slice().sort((a, b) => {
			const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
			const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
			return dateB - dateA;
		});
	}, [documents]);

	const [showForm, setShowForm] = useState(false);
	const [newDocumentName, setNewDocumentName] = useState('');
	const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);

	useEffect(() => {
		if (Object.keys(documentsRecord).length === 0) {
			viewLogger.info('Store de documentos vacío, cargando desde el servidor...');
			loadDocuments();
		}
	}, [loadDocuments, documentsRecord]);

	const handleDocumentClick = useCallback(
		(document: DocumentWithStats) => {
			viewLogger.info('🖱️ Click en documento:', document.name);
			// Navegar a la vista de contenido específica del documento
			navigate(`/documents/${document.id}`);
		},
		[navigate]
	);

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewDocumentFile(event.target.files[0]);
		}
	}, []);

	const handleCreateDocument = useCallback(async () => {
		if (newDocumentName.trim() === '' || !newDocumentFile) {
			// toast({
			// 	title: '❌ Error',
			// 	description: 'El nombre y el archivo de documento no pueden estar vacíos.',
			// 	variant: 'destructive',
			// });
			return;
		}
		// Aquí deberías manejar la subida del archivo.
		// Por ahora, solo simularemos la creación con el nombre.
		// En una implementación real, enviarías el archivo al backend.
		await createDocument({
			name: newDocumentName,
			path: newDocumentFile.name,
			size: newDocumentFile.size,
			hash: 'temp-hash', // TODO: Calcular hash real del archivo
			mimeType: newDocumentFile.type || 'application/octet-stream',
			extension: newDocumentFile.name.split('.').pop() || '',
			folderId: 'default-folder', // TODO: Obtener folder actual
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
		});
		setNewDocumentName('');
		setNewDocumentFile(null);
		setShowForm(false);
	}, [newDocumentName, newDocumentFile, createDocument]);

	return (
		<DocumentsContentView
			documents={sortedDocuments}
			isLoading={isLoading}
			error={error}
			showForm={showForm}
			newDocumentName={newDocumentName}
			newDocumentFile={newDocumentFile}
			setShowForm={setShowForm}
			setNewDocumentName={setNewDocumentName}
			setNewDocumentFile={setNewDocumentFile}
			handleDocumentClick={handleDocumentClick}
			handleFileChange={handleFileChange}
			handleCreateDocument={handleCreateDocument}
		/>
	);
}
