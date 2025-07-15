import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { DocumentCard } from '@/components/cards/document-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { DocumentWithStats } from '@/types/entities/document';

interface DocumentsContentViewProps {
	documents: DocumentWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newDocumentName: string;
	newDocumentFile: File | null;
	setShowForm: (show: boolean) => void;
	setNewDocumentName: (name: string) => void;
	setNewDocumentFile: (file: File | null) => void;
	handleDocumentClick: (document: DocumentWithStats) => void;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleCreateDocument: () => Promise<void>;
}

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

const DocumentsContentView: React.FC<DocumentsContentViewProps> = ({
	documents,
	isLoading,
	error,
	showForm,
	newDocumentName,
	newDocumentFile,
	setShowForm,
	setNewDocumentName,
	setNewDocumentFile,
	handleDocumentClick,
	handleFileChange,
	handleCreateDocument,
}) => {
	const { toast } = useToast();

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && documents.length === 0) {
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

				{documents.length === 0 && !isLoading && !showForm ? (
					<EmptyState
						icon={FileText}
						title="No hay documentos"
						description="Sube documentos para comenzar a usar el visor y editor."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{documents.map((document: DocumentWithStats, index: number) => {
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
};

export default DocumentsContentView;
