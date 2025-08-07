import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
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
		<DocumentCard className="h-full" document={document} onClick={onDocumentClick} />
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
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && (!documents || documents.length === 0)) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Documentos</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Subir Documento'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Documento</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="documentName">Nombre</Label>
							<Input
								id="documentName"
								onChange={(e) => setNewDocumentName(e.target.value)}
								placeholder="Nombre del documento"
								value={newDocumentName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="documentFile">Archivo de Documento</Label>
							<Input
								accept=".pdf,.doc,.docx,.txt,.md"
								id="documentFile"
								onChange={handleFileChange} // Aceptar tipos de documentos comunes
								type="file"
							/>
						</div>
						<Button onClick={handleCreateDocument}>Guardar Documento</Button>
					</div>
				)}

				{(!documents || documents.length === 0) && !isLoading && !showForm ? (
					<EmptyState
						description="Sube documentos para comenzar a usar el visor y editor."
						icon={FileText}
						title="No hay documentos"
					/>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{documents?.map((document: DocumentWithStats, index: number) => {
							const onDocumentClick = () => handleDocumentClick(document);
							return (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="perspective-1000"
									initial={{ opacity: 0, y: 20 }}
									key={document.id}
									transition={{ delay: index * 0.1 }}
								>
									<div
										className="h-full w-full transition-all duration-300 ease-in-out hover:z-10 hover:scale-[1.03] active:scale-[0.98]"
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
