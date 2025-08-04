/**
 * @file GenericFileViewer component for general file preview and information
 * @module components/features/file-viewer/viewers/generic-file-viewer
 */

import {
	Archive,
	ChevronLeft,
	ChevronRight,
	Code,
	Copy,
	Database,
	Download,
	ExternalLink,
	Eye,
	EyeOff,
	File,
	FileText,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatFileSize } from '@/lib/utils';
import type { FileWithStats } from '@/types/entities/file/base';

interface GenericFileViewerProps {
	file: FileWithStats;
	onClose: () => void;
	onNext: () => void;
	onPrevious: () => void;
}

const FILE_TYPE_ICONS = {
	// Archive files
	zip: Archive,
	rar: Archive,
	'7z': Archive,
	tar: Archive,
	gz: Archive,

	// Code files
	js: Code,
	ts: Code,
	jsx: Code,
	tsx: Code,
	py: Code,
	java: Code,
	cpp: Code,
	c: Code,
	cs: Code,
	php: Code,
	rb: Code,
	go: Code,
	rs: Code,
	swift: Code,
	kt: Code,

	// Data files
	json: Database,
	xml: Database,
	csv: Database,
	sql: Database,
	db: Database,
	sqlite: Database,

	// Text files
	txt: FileText,
	md: FileText,
	readme: FileText,
	log: FileText,

	// Default
	default: File,
};

const FILE_TYPE_CATEGORIES = {
	archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
	code: [
		'js',
		'ts',
		'jsx',
		'tsx',
		'py',
		'java',
		'cpp',
		'c',
		'cs',
		'php',
		'rb',
		'go',
		'rs',
		'swift',
		'kt',
		'html',
		'css',
		'scss',
		'less',
	],
	data: ['json', 'xml', 'csv', 'sql', 'db', 'sqlite', 'yaml', 'yml', 'toml', 'ini'],
	text: ['txt', 'md', 'readme', 'log', 'rtf'],
	config: ['config', 'conf', 'cfg', 'env', 'properties'],
	executable: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage'],
};

export function GenericFileViewer({ file, onClose, onNext, onPrevious }: GenericFileViewerProps) {
	const [fileContent, setFileContent] = useState<string | null>(null);
	const [isLoadingContent, setIsLoadingContent] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fileExtension = file.path?.split('.').pop()?.toLowerCase() || '';
	const fileName = file.name || 'Archivo sin nombre';
	const fileSize = file.size || 0;

	// Determine file category and icon
	const getFileCategory = () => {
		for (const [category, extensions] of Object.entries(FILE_TYPE_CATEGORIES)) {
			if (extensions.includes(fileExtension)) {
				return category;
			}
		}
		return 'unknown';
	};

	const getFileIcon = () => {
		const IconComponent = FILE_TYPE_ICONS[fileExtension as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default;
		return IconComponent;
	};

	const fileCategory = getFileCategory();
	const FileIcon = getFileIcon();
	const isTextFile = ['text', 'code', 'data', 'config'].includes(fileCategory);
	const canPreview = isTextFile && fileSize < 1024 * 1024; // Only preview files smaller than 1MB

	const loadFileContent = async () => {
		if (!canPreview || !file.path) return;

		setIsLoadingContent(true);
		setError(null);

		try {
			// In a real implementation, this would fetch the file content from the server
			const response = await fetch(`/api/files/${file.id}/content`);
			if (!response.ok) {
				throw new Error('Error al cargar el contenido del archivo');
			}
			const content = await response.text();
			setFileContent(content);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			// Fallback: try to read as text if it's a small file
			if (fileSize < 10000) {
				try {
					const fallbackResponse = await fetch(file.path);
					const fallbackContent = await fallbackResponse.text();
					setFileContent(fallbackContent);
					setError(null);
				} catch {
					setError('No se pudo cargar el contenido del archivo');
				}
			}
		} finally {
			setIsLoadingContent(false);
		}
	};

	const handleToggleContent = () => {
		if (!showContent && !fileContent && canPreview) {
			loadFileContent();
		}
		setShowContent(!showContent);
	};

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = file.path || `/api/files/${file.id}/download`;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleOpenExternal = () => {
		if (file.path) {
			window.open(file.path, '_blank');
		}
	};

	const handleCopyContent = async () => {
		if (fileContent) {
			try {
				await navigator.clipboard.writeText(fileContent);
				toast.success('Contenido copiado al portapapeles');
			} catch {
				toast.error('Error al copiar el contenido');
			}
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			archive: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			code: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			data: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			text: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			config: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			executable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
		};
		return colors[category as keyof typeof colors] || colors.unknown;
	};

	const getFileDescription = () => {
		const descriptions = {
			archive: 'Archivo comprimido',
			code: 'Archivo de código fuente',
			data: 'Archivo de datos',
			text: 'Archivo de texto',
			config: 'Archivo de configuración',
			executable: 'Archivo ejecutable',
			unknown: 'Archivo genérico',
		};
		return descriptions[fileCategory as keyof typeof descriptions] || descriptions.unknown;
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
					<h2 className="text-lg font-semibold truncate max-w-md">{fileName}</h2>
				</div>

				<Button variant="ghost" size="sm" onClick={onClose}>
					✕
				</Button>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-4xl mx-auto">
					{/* File Icon and Basic Info */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-4">
							<FileIcon className="h-12 w-12 text-muted-foreground" />
						</div>
						<h1 className="text-2xl font-bold mb-2">{fileName}</h1>
						<div className="flex items-center justify-center space-x-2 mb-4">
							<Badge className={getCategoryColor(fileCategory)}>{fileExtension.toUpperCase()}</Badge>
							<Badge variant="outline">{formatFileSize(fileSize)}</Badge>
						</div>
						<p className="text-muted-foreground">{getFileDescription()}</p>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-center space-x-4 mb-8">
						<Button onClick={handleDownload}>
							<Download className="h-4 w-4 mr-2" />
							Descargar
						</Button>
						<Button variant="outline" onClick={handleOpenExternal}>
							<ExternalLink className="h-4 w-4 mr-2" />
							Abrir externamente
						</Button>
						{canPreview && (
							<Button variant="outline" onClick={handleToggleContent}>
								{showContent ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
								{showContent ? 'Ocultar contenido' : 'Ver contenido'}
							</Button>
						)}
					</div>

					{/* File Content Preview */}
					{showContent && canPreview && (
						<div className="mb-8">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">Contenido del archivo</h3>
								{fileContent && (
									<Button variant="ghost" size="sm" onClick={handleCopyContent}>
										<Copy className="h-4 w-4 mr-2" />
										Copiar
									</Button>
								)}
							</div>

							{isLoadingContent && (
								<div className="flex items-center justify-center p-8">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
									<span className="ml-2">Cargando contenido...</span>
								</div>
							)}

							{error && (
								<div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
									<p className="text-red-600 dark:text-red-400">{error}</p>
								</div>
							)}

							{fileContent && (
								<div className="border rounded-lg overflow-hidden">
									<Textarea
										value={fileContent}
										readOnly
										className="min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0"
										placeholder="Contenido del archivo..."
									/>
								</div>
							)}
						</div>
					)}

					{/* File Metadata */}
					<div className="border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Información del archivo</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<span className="font-medium">Nombre:</span>
								<span className="ml-2 text-muted-foreground">{fileName}</span>
							</div>
							<div>
								<span className="font-medium">Tamaño:</span>
								<span className="ml-2 text-muted-foreground">{formatFileSize(fileSize)}</span>
							</div>
							<div>
								<span className="font-medium">Tipo:</span>
								<span className="ml-2 text-muted-foreground">{fileExtension.toUpperCase()}</span>
							</div>
							<div>
								<span className="font-medium">Categoría:</span>
								<span className="ml-2 text-muted-foreground">
									{fileCategory.charAt(0).toUpperCase() + fileCategory.slice(1)}
								</span>
							</div>
							<div>
								<span className="font-medium">Creado:</span>
								<span className="ml-2 text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>
							</div>
							<div>
								<span className="font-medium">Modificado:</span>
								<span className="ml-2 text-muted-foreground">{new Date(file.updatedAt).toLocaleDateString()}</span>
							</div>
							{file.path && (
								<div className="md:col-span-2">
									<span className="font-medium">Ruta:</span>
									<span className="ml-2 text-muted-foreground font-mono text-sm break-all">{file.path}</span>
								</div>
							)}
							{file.description && (
								<div className="md:col-span-2">
									<span className="font-medium">Descripción:</span>
									<span className="ml-2 text-muted-foreground">{file.description}</span>
								</div>
							)}
							{file.stats?.checksum && (
								<div className="md:col-span-2">
									<span className="font-medium">Checksum:</span>
									<span className="ml-2 text-muted-foreground font-mono text-sm">{file.stats.checksum}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
