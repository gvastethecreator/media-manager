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
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toMediaAssetType } from '@/lib/api/authorized-roots';
import { toastService } from '@/lib/ui/toast';
import { formatFileSize } from '@/lib/utils';
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

	const fileExtension = file.extension?.toLowerCase() || file.name?.split('.').pop()?.toLowerCase() || '';
	const fileName = file.name || 'Archivo sin nombre';
	const fileSize = file.size || 0;
	const assetType = toMediaAssetType((file as unknown as { entityType?: unknown }).entityType ?? file.type);
	const contentUrl = assetType
		? `/api/files/content?assetType=${assetType}&assetId=${encodeURIComponent(file.id)}`
		: null;

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
		if (!(canPreview && contentUrl)) {
			return;
		}

		setIsLoadingContent(true);
		setError(null);

		try {
			const response = await fetch(contentUrl);
			if (!response.ok) {
				throw new Error('Error al cargar el contenido del archivo');
			}
			const content = await response.text();
			setFileContent(content);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
		} finally {
			setIsLoadingContent(false);
		}
	};

	const handleToggleContent = () => {
		if (!(showContent || fileContent) && canPreview) {
			loadFileContent();
		}
		setShowContent(!showContent);
	};

	const handleDownload = async () => {
		try {
			if (!assetType) throw new Error('Tipo de asset no compatible');
			const resp = await fetch('/api/download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ asset: { assetId: file.id, assetType } }),
			});
			if (!resp.ok) throw new Error('No se pudo iniciar la descarga');
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toastService.success('Descarga iniciada');
		} catch (e) {
			toastService.error('Error al descargar el archivo');
		}
	};

	const handleOpenExternal = () => {
		if (contentUrl) {
			window.open(contentUrl, '_blank', 'noopener,noreferrer');
		}
	};

	const handleCopyContent = async () => {
		if (fileContent) {
			try {
				await navigator.clipboard.writeText(fileContent);
				toastService.success('Contenido copiado al portapapeles');
			} catch {
				toastService.error('Error al copiar el contenido');
			}
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			archive: 'bg-orange-100 text-warning dark:bg-orange-900 dark:text-orange-200',
			code: 'bg-blue-100 text-primary dark:bg-blue-900 dark:text-blue-200',
			data: 'bg-green-100 text-success dark:bg-green-900 dark:text-green-200',
			text: 'bg-muted text-gray-800 dark:bg-background dark:text-gray-200',
			config: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			executable: 'bg-red-100 text-destructive dark:bg-red-900 dark:text-red-200',
			unknown: 'bg-muted text-gray-800 dark:bg-background dark:text-gray-200',
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
					<h2 className="max-w-md truncate font-semibold text-lg">{fileName}</h2>
				</div>

				<Button onClick={onClose} size="sm" variant="ghost">
					✕
				</Button>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-auto p-6">
				<div className="mx-auto max-w-4xl">
					{/* File Icon and Basic Info */}
					<div className="mb-8 text-center">
						<div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted">
							<FileIcon className="h-12 w-12 text-muted-foreground" />
						</div>
						<h1 className="mb-2 font-bold text-2xl">{fileName}</h1>
						<div className="mb-4 flex items-center justify-center space-x-2">
							<Badge className={getCategoryColor(fileCategory)}>{fileExtension.toUpperCase()}</Badge>
							<Badge variant="outline">{formatFileSize(fileSize)}</Badge>
						</div>
						<p className="text-muted-foreground">{getFileDescription()}</p>
					</div>

					{/* Action Buttons */}
					<div className="mb-8 flex justify-center space-x-4">
						<Button onClick={handleDownload}>
							<Download className="mr-2 h-4 w-4" />
							Descargar
						</Button>
						<Button onClick={handleOpenExternal} variant="outline">
							<ExternalLink className="mr-2 h-4 w-4" />
							Abrir externamente
						</Button>
						{canPreview && (
							<Button onClick={handleToggleContent} variant="outline">
								{showContent ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
								{showContent ? 'Ocultar contenido' : 'Ver contenido'}
							</Button>
						)}
					</div>

					{/* File Content Preview */}
					{showContent && canPreview && (
						<div className="mb-8">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-lg">Contenido del archivo</h3>
								{fileContent && (
									<Button onClick={handleCopyContent} size="sm" variant="ghost">
										<Copy className="mr-2 h-4 w-4" />
										Copiar
									</Button>
								)}
							</div>

							{isLoadingContent && (
								<div className="flex items-center justify-center p-8">
									<div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
									<span className="ml-2">Cargando contenido...</span>
								</div>
							)}

							{error && (
								<div className="rounded-lg border border-ui-error-border bg-ui-error p-4">
									"<p className="text-destructive dark:text-red-400">{error}</p>
								</div>
							)}

							{fileContent && (
								<div className="overflow-hidden rounded-lg border">
									<Textarea
										className="min-h-[400px] resize-none border-0 font-mono text-sm focus:ring-0"
										placeholder="Contenido del archivo..."
										readOnly
										value={fileContent}
									/>
								</div>
							)}
						</div>
					)}

					{/* File Metadata */}
					<div className="rounded-lg border p-6">
						<h3 className="mb-4 font-semibold text-lg">Información del archivo</h3>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
							{file.description && (
								<div className="md:col-span-2">
									<span className="font-medium">Descripción:</span>
									<span className="ml-2 text-muted-foreground">{file.description}</span>
								</div>
							)}
							{file.stats?.checksum && (
								<div className="md:col-span-2">
									<span className="font-medium">Checksum:</span>
									<span className="ml-2 font-mono text-muted-foreground text-sm">{file.stats.checksum}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
