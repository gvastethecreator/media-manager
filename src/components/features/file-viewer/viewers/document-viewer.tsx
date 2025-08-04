/**
 * @file DocumentViewer component for document preview and navigation
 * @module components/features/file-viewer/viewers/document-viewer
 */

import {
	ChevronLeft,
	ChevronRight,
	Download,
	ExternalLink,
	FileText,
	RotateCw,
	Search,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatFileSize } from '@/lib/utils';
import type { DocumentWithStats } from '@/types/entities/document';

interface DocumentViewerProps {
	document: DocumentWithStats;
	onClose: () => void;
	onNext: () => void;
	onPrevious: () => void;
}

export function DocumentViewer({ document, onClose, onNext, onPrevious }: DocumentViewerProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [zoom, setZoom] = useState(100);
	const [rotation, setRotation] = useState(0);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [canRender, setCanRender] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	// Document source URL
	const documentSrc = document.path || `/api/documents/${document.id}/view`;
	const fileExtension = document.path?.split('.').pop()?.toLowerCase() || '';
	const isPDF = fileExtension === 'pdf';
	const isTextFile = ['txt', 'md', 'json', 'xml', 'csv'].includes(fileExtension);
	const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

	useEffect(() => {
		// Simulate loading and check if document can be rendered
		const timer = setTimeout(() => {
			setIsLoading(false);
			setCanRender(isPDF || isTextFile);
			if (document.stats?.pageCount) {
				setTotalPages(document.stats.pageCount);
			}
		}, 1000);

		return () => clearTimeout(timer);
	}, [documentSrc, isPDF, isTextFile, document.stats?.pageCount]);

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 25, 300));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 25, 25));
	};

	const handleRotate = () => {
		setRotation((prev) => (prev + 90) % 360);
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = documentSrc;
		link.download = document.name || 'document';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleOpenExternal = () => {
		window.open(documentSrc, '_blank');
	};

	const renderDocumentContent = () => {
		if (isLoading) {
			return (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
						<p className="text-muted-foreground">Cargando documento...</p>
					</div>
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
						<p className="text-red-500 mb-4">{error}</p>
						<Button onClick={handleDownload} variant="outline">
							<Download className="h-4 w-4 mr-2" />
							Descargar archivo
						</Button>
					</div>
				</div>
			);
		}

		if (!canRender) {
			return (
				<div className="flex items-center justify-center h-full">
					<div className="text-center max-w-md">
						<FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">Vista previa no disponible</h3>
						<p className="text-muted-foreground mb-6">
							Este tipo de archivo ({fileExtension.toUpperCase()}) no se puede previsualizar en el navegador.
						</p>
						<div className="flex gap-2 justify-center">
							<Button onClick={handleDownload} variant="outline">
								<Download className="h-4 w-4 mr-2" />
								Descargar
							</Button>
							<Button onClick={handleOpenExternal} variant="outline">
								<ExternalLink className="h-4 w-4 mr-2" />
								Abrir en nueva pestaña
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (isPDF) {
			return (
				<div className="h-full flex items-center justify-center">
					<iframe
						ref={iframeRef}
						src={`${documentSrc}#page=${currentPage}&zoom=${zoom}`}
						className="w-full h-full border-0"
						style={{
							transform: `rotate(${rotation}deg)`,
							transformOrigin: 'center center',
						}}
						onLoad={() => setIsLoading(false)}
						onError={() => setError('Error al cargar el documento PDF')}
					/>
				</div>
			);
		}

		if (isTextFile) {
			return (
				<div className="h-full p-4 overflow-auto">
					<iframe
						ref={iframeRef}
						src={documentSrc}
						className="w-full h-full border rounded-lg"
						style={{
							fontSize: `${zoom}%`,
							transform: `rotate(${rotation}deg)`,
							transformOrigin: 'center center',
						}}
						onLoad={() => setIsLoading(false)}
						onError={() => setError('Error al cargar el archivo de texto')}
					/>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="sm" onClick={onPrevious}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={onNext}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex items-center space-x-2">
					<h2 className="text-lg font-semibold truncate max-w-md">{document.name}</h2>
				</div>

				<Button variant="ghost" size="sm" onClick={onClose}>
					✕
				</Button>
			</div>

			{/* Toolbar */}
			{canRender && !isLoading && !error && (
				<div className="flex items-center justify-between p-2 border-b bg-muted/50">
					<div className="flex items-center space-x-2">
						{/* Zoom Controls */}
						<Button variant="ghost" size="sm" onClick={handleZoomOut}>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
						<Button variant="ghost" size="sm" onClick={handleZoomIn}>
							<ZoomIn className="h-4 w-4" />
						</Button>

						{/* Rotation */}
						<Button variant="ghost" size="sm" onClick={handleRotate}>
							<RotateCw className="h-4 w-4" />
						</Button>
					</div>

					{/* Page Navigation (for PDFs) */}
					{isPDF && totalPages > 1 && (
						<div className="flex items-center space-x-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage <= 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm">
								Página {currentPage} de {totalPages}
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage >= totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}

					{/* Search */}
					<div className="flex items-center space-x-2">
						<div className="relative">
							<Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Buscar en documento..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8 w-48"
								size="sm"
							/>
						</div>
						<Button variant="ghost" size="sm" onClick={handleDownload}>
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 overflow-hidden">{renderDocumentContent()}</div>

			{/* Metadata Panel */}
			<div className="border-t p-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<span className="font-medium">Tipo:</span>
						<span className="ml-2 text-muted-foreground">{fileExtension.toUpperCase()}</span>
					</div>
					<div>
						<span className="font-medium">Tamaño:</span>
						<span className="ml-2 text-muted-foreground">{formatFileSize(document.size || 0)}</span>
					</div>
					{document.stats?.pageCount && (
						<div>
							<span className="font-medium">Páginas:</span>
							<span className="ml-2 text-muted-foreground">{document.stats.pageCount}</span>
						</div>
					)}
					<div>
						<span className="font-medium">Creado:</span>
						<span className="ml-2 text-muted-foreground">{new Date(document.createdAt).toLocaleDateString()}</span>
					</div>
					{document.stats?.wordCount && (
						<div>
							<span className="font-medium">Palabras:</span>
							<span className="ml-2 text-muted-foreground">{document.stats.wordCount.toLocaleString()}</span>
						</div>
					)}
					{document.stats?.author && (
						<div>
							<span className="font-medium">Autor:</span>
							<span className="ml-2 text-muted-foreground">{document.stats.author}</span>
						</div>
					)}
					{document.description && (
						<div className="col-span-2">
							<span className="font-medium">Descripción:</span>
							<span className="ml-2 text-muted-foreground">{document.description}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
