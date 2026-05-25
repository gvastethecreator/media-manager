import { AlertCircle, ArrowLeft, Download, Heart, Box as BoxIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThreeDViewer } from '@/components/features/file-viewer/viewers/three-d-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useFavorite } from '@/hooks/use-favorite';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { File3DWithStats } from '@/types/entities/file3d';

const logger = clientLogger.withContext('File3DContentView');

function formatBytes(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
	return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function File3DContentView() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const getFile3DById = useFile3DStore((s) => s.getFile3DById);
	const fetchFile3D = useFile3DStore((s) => s.fetchFile3D);
	const loading = useFile3DStore((s) => s.loading);
	const storeError = useFile3DStore((s) => s.error);

	const [file3D, setFile3D] = useState<File3DWithStats | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { isFavorite, isLoading: isFavoriteLoading, toggleFavorite } = useFavorite({
		entityId: file3D?.id ?? id ?? '',
		entityType: 'file3d',
		initialIsFavorite: file3D?.isFavorite ?? false,
	});

	useEffect(() => {
		if (!id) {
			setError('ID de archivo 3D no proporcionado');
			return;
		}

		let isCancelled = false;

		const loadFile3D = async () => {
			try {
				setError(null);
				let currentFile3D = getFile3DById(id);

				if (!currentFile3D) {
					currentFile3D = await fetchFile3D(id);
				}

				if (!(currentFile3D || isCancelled)) {
					setError('No se encontró el archivo 3D solicitado');
					return;
				}

				if (!isCancelled) {
					setFile3D(currentFile3D ?? null);
				}
			} catch (loadError) {
				if (!isCancelled) {
					const message = loadError instanceof Error ? loadError.message : 'Error desconocido cargando el archivo 3D';
					logger.error('Error cargando detalle 3D', { id, error: message });
					setError(message);
				}
			}
		};

		loadFile3D();

		return () => {
			isCancelled = true;
		};
	}, [fetchFile3D, getFile3DById, id]);

	const contentUrl = useMemo(() => {
		if (!file3D?.path) {
			return null;
		}

		return `/api/files/content?path=${encodeURIComponent(file3D.path)}`;
	}, [file3D?.path]);

	const headerControls = (
		<>
			<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
				<ArrowLeft className="h-4 w-4" />
				Volver
			</Button>
			{file3D && contentUrl && (
				<>
					<Button
						className="gap-2"
						onClick={() => window.open(contentUrl, '_blank', 'noopener,noreferrer')}
						size="sm"
						variant="outline"
					>
						<Download className="h-4 w-4" />
						Descargar
					</Button>
					<Button
						className="gap-2"
						disabled={isFavoriteLoading}
						onClick={async () => {
							if (!(id && file3D)) {
								return;
							}

							try {
								toggleFavorite();
							} catch (toggleError) {
								logger.error('Error alternando favorito en archivo 3D', {
									id,
									error: toggleError instanceof Error ? toggleError.message : toggleError,
								});
							}
						}}
						size="sm"
						variant={isFavorite ? 'default' : 'outline'}
					>
						<Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
						{isFavorite ? 'En favoritos' : 'Favorito'}
					</Button>
				</>
			)}
		</>
	);

	if (loading && !file3D) {
		return (
			<BaseContentView
				description="Cargando archivo 3D..."
				headerControls={headerControls}
				icon="🧊"
				title="Detalle 3D"
			>
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
						<p className="text-muted-foreground">Cargando archivo 3D...</p>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (error || storeError || !file3D) {
		return (
			<BaseContentView
				description={error || storeError || 'No se pudo cargar el archivo 3D'}
				headerControls={headerControls}
				icon="❌"
				title="Detalle 3D"
			>
				<div className="flex h-full items-center justify-center p-6">
					<Card className="max-w-lg p-6">
						<div className="mb-4 flex items-start gap-3">
							<AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
							<div>
								<h3 className="font-semibold">No se pudo cargar el detalle 3D</h3>
								<p className="mt-1 text-muted-foreground text-sm">{error || storeError}</p>
							</div>
						</div>
						<Button onClick={() => navigate(-1)} variant="outline">
							Volver
						</Button>
					</Card>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={`${(file3D.format || file3D.extension).toUpperCase()} · ${formatBytes(file3D.size)}`}
			headerControls={headerControls}
			icon="🧊"
			title={file3D.name}
		>
			<div className="grid h-full min-h-0 gap-4 p-4 xl:grid-cols-[minmax(0,2fr)_340px]">
				<div className="min-h-105 overflow-hidden rounded-xl border bg-card/40 p-3">
					{contentUrl ? (
						<ThreeDViewer className="h-full min-h-130" fileName={file3D.name} src={contentUrl} />
					) : (
						<div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
							No hay una ruta de archivo accesible para renderizar el modelo.
						</div>
					)}
				</div>

				<ScrollArea className="min-h-0 rounded-xl border bg-card/40">
					<div className="space-y-3 p-4">
						<div className="flex items-center gap-2">
							<BoxIcon className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-semibold">Ficha técnica</h3>
								<p className="text-muted-foreground text-sm">Métricas del modelo y estado del asset.</p>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Formato</p>
								<div className="flex items-center gap-2">
									<Badge variant="secondary">{(file3D.format || file3D.extension).toUpperCase()}</Badge>
									{file3D.version && <Badge variant="outline">v{file3D.version}</Badge>}
								</div>
							</Card>
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Tamaño</p>
								<p className="font-semibold text-lg">{formatBytes(file3D.size)}</p>
							</Card>
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Vértices</p>
								<p className="font-semibold text-lg">{file3D.vertices ?? file3D.stats.vertexCount ?? 0}</p>
							</Card>
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Caras</p>
								<p className="font-semibold text-lg">{file3D.faces ?? file3D.stats.polygonCount ?? 0}</p>
							</Card>
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Materiales</p>
								<p className="font-semibold text-lg">{file3D.materials ?? file3D.stats.materialCount ?? 0}</p>
							</Card>
							<Card className="p-4">
								<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Atributos</p>
								<div className="flex flex-wrap gap-2">
									<Badge variant={file3D.hasUV ? 'default' : 'secondary'}>UV {file3D.hasUV ? 'sí' : 'no'}</Badge>
									<Badge variant={file3D.hasNormals ? 'default' : 'secondary'}>
										Normales {file3D.hasNormals ? 'sí' : 'no'}
									</Badge>
									<Badge variant={file3D.hasColors ? 'default' : 'secondary'}>
										Colores {file3D.hasColors ? 'sí' : 'no'}
									</Badge>
								</div>
							</Card>
						</div>

						<Card className="p-4">
							<p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">Ruta</p>
							<p className="break-all font-mono text-xs text-muted-foreground">{file3D.path}</p>
						</Card>
					</div>
				</ScrollArea>
			</div>
		</BaseContentView>
	);
}

export default File3DContentView;
