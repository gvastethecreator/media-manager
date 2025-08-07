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
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
						<p className="text-muted-foreground">Cargando documento...</p>
					</div>
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<p className="mb-4 text-red-500">{error}</p>
						<Button onClick={handleDownload} variant="outline">
							<Download className="mr-2 h-4 w-4" />
							Descargar archivo
						</Button>
					</div>
				</div>
			);
		}

		if (!canRender) {
			return (
				<div className="flex h-full items-center justify-center">
					<div className="max-w-md text-center">
						<FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">Vista previa no disponible</h3>
						<p className="mb-6 text-muted-foreground">
							Este tipo de archivo ({fileExtension.toUpperCase()}) no se puede previsualizar en el navegador.
						</p>
						<div className="flex justify-center gap-2">
							<Button onClick={handleDownload} variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Descargar
							</Button>
							<Button onClick={handleOpenExternal} variant="outline">
								<ExternalLink className="mr-2 h-4 w-4" />
								Abrir en nueva pestaña
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (isPDF) {
			return (
				<div className="flex h-full items-center justify-center">
					<iframe
						className="h-full w-full border-0"
						onError={() => setError('Error al cargar el documento PDF')}
						onLoad={() => setIsLoading(false)}
						ref={iframeRef}
						src={`${documentSrc}#page=${currentPage}&zoom=${zoom}`}
						style={{
							transform: `rotate(${rotation}deg)`,
							transformOrigin: 'center center',
						}}
					/>
				</div>
			);
		}

		if (isTextFile) {
			return (
				<div className="h-full overflow-auto p-4">
					<iframe
						className="h-full w-full rounded-lg border"
						onError={() => setError('Error al cargar el archivo de texto')}
						onLoad={() => setIsLoading(false)}
						ref={iframeRef}
						src={documentSrc}
						style={{
							fontSize: `${zoom}%`,
							transform: `rotate(${rotation}deg)`,
							transformOrigin: 'center center',
						}}
					/>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b p-4">
				<div className="flex items-center space-x-4">
					<Button onClick={onPrevious} size="sm" variant="ghost">
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button onClick={onNext} size="sm" variant="ghost">
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex items-center space-x-2">
					<h2 className="max-w-md truncate font-semibold text-lg">{document.name}</h2>
				</div>

				<Button onClick={onClose} size="sm" variant="ghost">
					✕
				</Button>
			</div>

			{/* Toolbar */}
			{canRender && !isLoading && !error && (
				<div className="flex items-center justify-between border-b bg-muted/50 p-2">
					<div className="flex items-center space-x-2">
						{/* Zoom Controls */}
						<Button onClick={handleZoomOut} size="sm" variant="ghost">
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="min-w-[60px] text-center font-medium text-sm">{zoom}%</span>
						<Button onClick={handleZoomIn} size="sm" variant="ghost">
							<ZoomIn className="h-4 w-4" />
						</Button>

						{/* Rotation */}
						<Button onClick={handleRotate} size="sm" variant="ghost">
							<RotateCw className="h-4 w-4" />
						</Button>
					</div>

					{/* Page Navigation (for PDFs) */}
					{isPDF && totalPages > 1 && (
						<div className="flex items-center space-x-2">
							<Button
								disabled={currentPage <= 1}
								onClick={() => handlePageChange(currentPage - 1)}
								size="sm"
								variant="ghost"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm">
								Página {currentPage} de {totalPages}
							</span>
							<Button
								disabled={currentPage >= totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
								size="sm"
								variant="ghost"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}

					{/* Search */}
					<div className="flex items-center space-x-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 transform text-muted-foreground" />
							<Input
								className="w-48 pl-8"
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Buscar en documento..."
								size="sm"
								value={searchTerm}
							/>
						</div>
						<Button onClick={handleDownload} size="sm" variant="ghost">
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 overflow-hidden">{renderDocumentContent()}</div>

			{/* Metadata Panel */}
			<div className="border-t p-4">
				<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
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
