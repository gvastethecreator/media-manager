import { AlertCircle, ArrowLeft, Copy, Download, FileJson, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JsonAdvancedViewer } from '@/components/features/file-viewer/viewers/json-advanced-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useFavorite } from '@/hooks/use-favorite';
import { clientLogger } from '@/lib/logger/client-logger';
import { useJsonFileStore } from '@/store/entities/json-file';
import type { JsonFileWithStats } from '@/types/entities/json-file';

const logger = clientLogger.withContext('JsonFileContentView');

function formatBytes(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
	return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function JsonFileContentView() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const getJsonFileById = useJsonFileStore((s) => s.getJsonFileById);
	const fetchJsonFile = useJsonFileStore((s) => s.fetchJsonFile);
	const loading = useJsonFileStore((s) => s.loading);
	const storeError = useJsonFileStore((s) => s.error);

	const [jsonFile, setJsonFile] = useState<JsonFileWithStats | null>(null);
	const [content, setContent] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const {
		isFavorite,
		isLoading: isFavoriteLoading,
		toggleFavorite,
	} = useFavorite({
		entityId: jsonFile?.id ?? id ?? '',
		entityType: 'jsonFile',
		initialIsFavorite: jsonFile?.isFavorite ?? false,
	});

	useEffect(() => {
		if (!id) {
			setError('JSON file ID was not provided');
			return;
		}

		let isCancelled = false;

		const loadJsonFile = async () => {
			try {
				setError(null);
				let currentJsonFile = getJsonFileById(id);

				if (!currentJsonFile) {
					currentJsonFile = await fetchJsonFile(id);
				}

				if (!currentJsonFile) {
					if (!isCancelled) {
						setError('The requested JSON file was not found');
					}
					return;
				}

				if (!isCancelled) {
					setJsonFile(currentJsonFile);
				}

				if (currentJsonFile.content) {
					if (!isCancelled) {
						setContent(currentJsonFile.content);
					}
					return;
				}

				const response = await fetch(
					`/api/files/content?assetType=json&assetId=${encodeURIComponent(currentJsonFile.id)}`
				);
				if (!response.ok) {
					throw new Error('Could not load the JSON file contents');
				}

				const rawContent = await response.text();
				if (!isCancelled) {
					setContent(rawContent);
				}
			} catch (loadError) {
				if (!isCancelled) {
					const message = loadError instanceof Error ? loadError.message : 'Unknown error while loading JSON';
					logger.error('Could not load JSON details', { id, error: message });
					setError(message);
				}
			}
		};

		loadJsonFile();

		return () => {
			isCancelled = true;
		};
	}, [fetchJsonFile, getJsonFileById, id]);

	const headerDescription = useMemo(() => {
		if (!jsonFile) {
			return 'JSON file details';
		}

		return `${jsonFile.extension.toUpperCase()} · ${formatBytes(jsonFile.size)} · ${jsonFile.isValid ? 'valid' : 'has errors'}`;
	}, [jsonFile]);

	const handleDownload = () => {
		if (!jsonFile) {
			return;
		}

		const link = document.createElement('a');
		link.href = `/api/download?assetType=json&assetId=${encodeURIComponent(jsonFile.id)}`;
		link.download = jsonFile.name;
		link.rel = 'noopener noreferrer';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleCopyReference = async () => {
		if (!jsonFile) {
			return;
		}

		await navigator.clipboard.writeText(`json:${jsonFile.id}`);
	};

	const handleToggleFavorite = async () => {
		if (!(jsonFile && id) || isFavoriteLoading) {
			return;
		}

		try {
			toggleFavorite();
		} catch (toggleError) {
			logger.error('Could not toggle JSON favorite', {
				id,
				error: toggleError instanceof Error ? toggleError.message : toggleError,
			});
		}
	};

	const headerControls = (
		<>
			<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
				<ArrowLeft className="h-4 w-4" />
				Back
			</Button>
			{jsonFile && (
				<>
					<Button className="gap-2" onClick={handleCopyReference} size="sm" variant="outline">
						<Copy className="h-4 w-4" />
						Copy reference
					</Button>
					<Button className="gap-2" onClick={handleDownload} size="sm" variant="outline">
						<Download className="h-4 w-4" />
						Download
					</Button>
					<Button
						className="gap-2"
						disabled={isFavoriteLoading}
						onClick={handleToggleFavorite}
						size="sm"
						variant={isFavorite ? 'default' : 'outline'}
					>
						<Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
						{isFavorite ? 'In Favorites' : 'Add to Favorites'}
					</Button>
				</>
			)}
		</>
	);

	if (loading && !jsonFile) {
		return (
			<BaseContentView
				description="Loading JSON file..."
				headerControls={headerControls}
				icon="📋"
				title="JSON Details"
			>
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
						<p className="text-muted-foreground">Loading JSON file...</p>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (error || storeError || !jsonFile) {
		return (
			<BaseContentView
				description={error || storeError || 'Could not load the JSON file'}
				headerControls={headerControls}
				icon="❌"
				title="JSON Details"
			>
				<div className="flex h-full items-center justify-center p-6">
					<Card className="max-w-lg p-6">
						<div className="mb-4 flex items-start gap-3">
							<AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
							<div>
								<h3 className="font-semibold">Could not load JSON details</h3>
								<p className="mt-1 text-muted-foreground text-sm">{error || storeError}</p>
							</div>
						</div>
						<Button onClick={() => navigate(-1)} variant="outline">
							Back
						</Button>
					</Card>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={headerDescription} headerControls={headerControls} icon="📋" title={jsonFile.name}>
			<ScrollArea className="h-full">
				<div className="space-y-4 p-4">
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						<Card className="p-4">
							<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Size</p>
							<p className="font-semibold text-lg">{formatBytes(jsonFile.size)}</p>
						</Card>
						<Card className="p-4">
							<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Depth</p>
							<p className="font-semibold text-lg">{jsonFile.depth ?? jsonFile.stats.nestingDepth ?? 0}</p>
						</Card>
						<Card className="p-4">
							<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Keys</p>
							<p className="font-semibold text-lg">{jsonFile.keyCount ?? jsonFile.stats.keyCount ?? 0}</p>
						</Card>
						<Card className="p-4">
							<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Status</p>
							<div className="flex items-center gap-2">
								<Badge variant={jsonFile.isValid ? 'default' : 'destructive'}>
									{jsonFile.isValid ? 'Valid JSON' : 'Invalid JSON'}
								</Badge>
							</div>
						</Card>
					</div>

					{jsonFile.validationErrors && (
						<Card className="border-destructive/30 p-4">
							<div className="mb-2 flex items-center gap-2 text-destructive">
								<AlertCircle className="h-4 w-4" />
								<h3 className="font-semibold">Validation Errors</h3>
							</div>
							<p className="whitespace-pre-wrap text-muted-foreground text-sm">{jsonFile.validationErrors}</p>
						</Card>
					)}

					<Card className="p-4">
						<div className="mb-4 flex items-center gap-2">
							<FileJson className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-semibold">Content Explorer</h3>
								<p className="text-muted-foreground text-sm">Tree, cards, statistics, and original JSON download.</p>
							</div>
						</div>
						{content ? (
							<JsonAdvancedViewer className="min-h-[560px]" content={content} fileName={jsonFile.name} />
						) : (
							<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
								No embedded JSON content is available to display.
							</div>
						)}
					</Card>
				</div>
			</ScrollArea>
		</BaseContentView>
	);
}

export default JsonFileContentView;
