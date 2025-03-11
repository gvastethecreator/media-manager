'use client';

import * as thumbnailActions from '@/app/actions/thumbnails/thumbnails.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { useThumbnailEvents } from '@/lib/hooks/use-thumbnail-events';
import { cn, formatBytes } from '@/lib/utils';
import type { ProcessOptions } from '@/services/thumbnail.service';
import { useThumbnailStore } from '@/store/thumbnails.store';
import type {
	CleanResult,
	LastProcessedThumbnail,
	OptimizeResult,
	ReprocessResult,
	ThumbnailCallbacks,
} from '@/types/thumbnails';
import { AlertCircle, Settings2, Trash2, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import * as React from 'react';

const thumbnailQualityOptions: { value: ThumbnailQuality; label: string }[] = [
	{
		value: ThumbnailQuality.LOW,
		label: 'Baja (balance entre calidad y espacio)',
	},
	{ value: ThumbnailQuality.MEDIUM, label: 'Media (recomendado)' },
	{ value: ThumbnailQuality.HIGH, label: 'Alta (mejor calidad, más espacio)' },
];

// ThumbnailItem component
function ThumbnailItem({
	image,
	index,
}: {
	image: LastProcessedThumbnail;
	index: number;
}) {
	const [thumbnail, setThumbnail] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const loadThumbnail = async () => {
			try {
				setIsLoading(true);
				const data = await thumbnailActions.getThumbnail(image.id, ThumbnailQuality.MEDIUM);
				setThumbnail(`data:${data.mimeType || 'image/webp'};base64,${data.thumbnail}`);
			} catch (err) {
				console.error('Error cargando thumbnail:', err);
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setIsLoading(false);
			}
		};

		loadThumbnail();
	}, [image.id]);

	return (
		<motion.div
			key={image.id}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={{ delay: index * 0.1 }}
			className="relative aspect-square rounded-md overflow-hidden bg-muted group"
		>
			{isLoading ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
				</div>
			) : error ? (
				<div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">Error</div>
			) : (
				thumbnail && (
					<>
						<Image
							src={thumbnail}
							alt={image.path}
							fill
							className="object-cover transition-transform group-hover:scale-105"
						/>
						<motion.div
							initial={{ opacity: 0 }}
							whileHover={{ opacity: 1 }}
							className="absolute inset-0 bg-black/60 p-1.5"
						>
							<p className="text-[10px] text-white truncate">{image.path}</p>
							<p className="text-[10px] text-white/70 absolute bottom-1.5 left-1.5">
								{new Date(image.processedAt).toLocaleTimeString()}
							</p>
						</motion.div>
					</>
				)
			)}
		</motion.div>
	);
}

export function ThumbnailsSection() {
	const { toast } = useToast();
	const { settings, updateSettings } = useSettings();
	const {
		stats: thumbnailStats,
		isLoading: isThumbnailLoading,
		isProcessing: isThumbnailProcessing,
		processStatus: thumbnailProcessStatus,
		initialize: initializeThumbnails,
		setProcessing: setThumbnailProcessing,
	} = useThumbnailStore();

	const [showErrors, setShowErrors] = React.useState(false);
	const [lastProcessedThumbnails, setLastProcessedThumbnails] = React.useState<LastProcessedThumbnail[]>([]);

	// Cargar últimas miniaturas procesadas
	React.useEffect(() => {
		const loadLastProcessed = async () => {
			try {
				const thumbnails = await thumbnailActions.getLastProcessedThumbnails();
				setLastProcessedThumbnails(thumbnails);
			} catch (error) {
				console.error('Error cargando últimas miniaturas:', error);
			}
		};

		loadLastProcessed();
		// No es necesario recargar cuando cambie isThumbnailProcessing
	}, []);

	// Inicializar eventos SSE y cargar estadísticas iniciales
	React.useEffect(() => {
		initializeThumbnails();
	}, [initializeThumbnails]);

	// Manejador común para procesos de miniaturas
	const handleThumbnailProcess = async (
		processFunction: (options: ThumbnailCallbacks) => Promise<void>,
		processName: string
	) => {
		if (isThumbnailProcessing) {
			toast({
				title: 'Proceso en curso',
				description: 'Ya hay un proceso de miniaturas en ejecución',
				variant: 'default',
			});
			return;
		}

		try {
			setThumbnailProcessing(true);
			await processFunction({
				onProgress: (status) => {
					if (status?.lastProcessed) {
						setLastProcessedThumbnails((prev) => [status.lastProcessed as LastProcessedThumbnail, ...prev.slice(0, 4)]);
					}
				},
				onError: (error: unknown) => {
					console.error(`Error en ${processName}:`, error);
					toast({
						title: 'Error',
						description:
							error instanceof Error
								? `Error: ${error.message}`
								: typeof error === 'object' && error && 'message' in error
									? String(error.message)
									: `Error desconocido en ${processName}`,
						variant: 'destructive',
					});
				},
				onComplete: (data) => {
					let message = '';
					if ('optimized' in data && 'totalSaved' in data) {
						message = `Se optimizaron ${data.optimized} miniaturas, ahorrando ${formatBytes(data.totalSaved)}`;
					} else if ('cleaned' in data && 'totalFreed' in data) {
						message = `Se limpiaron ${data.cleaned} miniaturas, liberando ${formatBytes(data.totalFreed)}`;
					} else if ('processed' in data) {
						message = `Se reprocesaron ${data.processed} miniaturas`;
					}

					if (message) {
						toast({
							title: `${processName} completado`,
							description: message,
						});
					}

					initializeThumbnails();
				},
			});
		} catch (error: unknown) {
			console.error(`Error en ${processName}:`, error);
			toast({
				title: 'Error',
				description:
					error instanceof Error
						? `Error: ${error.message}`
						: typeof error === 'object' && error && 'message' in error
							? String(error.message)
							: `Error desconocido en ${processName}`,
				variant: 'destructive',
			});
		} finally {
			setThumbnailProcessing(false);
		}
	};

	const handleQualityChange = async (quality: ThumbnailQuality) => {
		try {
			await updateSettings({ thumbnailQuality: quality });
			toast({
				title: 'Calidad actualizada',
				description: 'La calidad de las miniaturas se ha actualizado correctamente',
			});
		} catch (error) {
			console.error('Error actualizando calidad:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la calidad de las miniaturas',
				variant: 'destructive',
			});
		}
	};

	const handleVideoAnimationToggle = async (enabled: boolean) => {
		try {
			await updateSettings({ videoThumbnailAnimation: enabled });
			toast({
				title: 'Animación actualizada',
				description: `La animación de videos se ha ${enabled ? 'activado' : 'desactivado'} correctamente`,
			});
		} catch (error) {
			console.error('Error actualizando animación:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la configuración de animación',
				variant: 'destructive',
			});
		}
	};

	const handleOptimizeThumbnails = () =>
		handleThumbnailProcess(
			(callbacks) => thumbnailActions.optimizeThumbnails(callbacks as unknown as ProcessOptions),
			'Optimización'
		);

	const handleReprocessThumbnails = () =>
		handleThumbnailProcess(
			(callbacks) => thumbnailActions.reprocessThumbnails(callbacks as unknown as ProcessOptions),
			'Reprocesamiento'
		);

	const handleCleanThumbnails = () =>
		handleThumbnailProcess(
			(callbacks) => thumbnailActions.cleanThumbnails(callbacks as unknown as ProcessOptions),
			'Limpieza'
		);

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Settings2 className="h-5 w-5" /> Miniaturas
					</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-sm">Calidad de Miniaturas</Label>
							<Select value={settings.thumbnailQuality} onValueChange={handleQualityChange}>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Selecciona la calidad" />
								</SelectTrigger>
								<SelectContent>
									{thumbnailQualityOptions.map((option) => (
										<SelectItem key={option.value} value={option.value} className="text-xs">
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Una calidad más alta resultará en miniaturas más nítidas pero ocupará más espacio
							</p>
						</div>

						<div className="flex items-center justify-between space-x-4 py-1">
							<div className="space-y-0.5">
								<Label htmlFor="video-animation" className="text-sm">
									Animación en videos
								</Label>
								<p className="text-xs text-muted-foreground">
									Mostrar un preview animado al pasar el cursor sobre videos
								</p>
							</div>
							<Switch
								id="video-animation"
								checked={settings.videoThumbnailAnimation}
								onCheckedChange={handleVideoAnimationToggle}
								className="scale-90"
							/>
						</div>
					</div>

					<div className="flex flex-wrap gap-1.5 pt-2">
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleOptimizeThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Zap className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Optimizando...
								</>
							) : (
								<>
									<Zap className="h-3.5 w-3.5 mr-1.5" />
									Optimizar
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleReprocessThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Settings2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Procesando...
								</>
							) : (
								<>
									<Settings2 className="h-3.5 w-3.5 mr-1.5" />
									Reprocesar
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={handleCleanThumbnails}
							disabled={isThumbnailLoading || isThumbnailProcessing}
						>
							{isThumbnailProcessing ? (
								<>
									<Trash2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
									Limpiando...
								</>
							) : (
								<>
									<Trash2 className="h-3.5 w-3.5 mr-1.5" />
									Limpiar
								</>
							)}
						</Button>

						{isThumbnailProcessing && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setThumbnailProcessing(false)}
								className="h-7 text-xs text-red-500 hover:text-red-600"
							>
								Cancelar
							</Button>
						)}
					</div>

					<Separator className="my-2" />
					<div className="grid grid-cols-2 gap-3">
						{thumbnailStats && (
							<>
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className="space-y-1.5"
								>
									<div className="flex items-center justify-between">
										<Label className="text-sm">Miniaturas</Label>
										<Badge variant="secondary" className="text-xs">
											{formatBytes(thumbnailStats.totalSize || 0)}
										</Badge>
									</div>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">{thumbnailStats.totalFiles || 0} totales</span>
										<span className="text-sm text-muted-foreground">{thumbnailStats.pending} pendientes</span>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2 }}
									className="space-y-1.5"
								>
									<div className="flex items-center justify-between">
										<Label className="text-sm">Estado</Label>
										{thumbnailStats.errors.length > 0 && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 text-xs text-red-500 hover:text-red-600"
												onClick={() => setShowErrors(true)}
											>
												<AlertCircle className="h-3.5 w-3.5 mr-1" />
												Ver errores
											</Button>
										)}
									</div>
									<div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
										<span className="text-sm font-medium">{thumbnailStats.errors.length} errores</span>
										<Badge
											variant="secondary"
											className={cn('text-xs', thumbnailStats.pending === 0 && 'bg-green-500/20 text-green-500')}
										>
											{thumbnailStats.pending === 0 ? 'Al día' : 'Pendiente'}
										</Badge>
									</div>
								</motion.div>
							</>
						)}
					</div>

					{isThumbnailProcessing && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="space-y-1.5 bg-muted/30 p-3 rounded-lg mt-3"
						>
							<div className="flex justify-between text-xs">
								<span>
									{thumbnailProcessStatus.current || 0} de {thumbnailProcessStatus.total || 0} (
									{Math.round(thumbnailProcessStatus.progress || 0)}%)
								</span>
								<span className="text-muted-foreground">{thumbnailProcessStatus.status || 'Procesando...'}</span>
							</div>
							<Progress value={thumbnailProcessStatus.progress} className="h-1.5" />
							{thumbnailProcessStatus.currentFile && (
								<p className="text-xs text-muted-foreground truncate">{thumbnailProcessStatus.currentFile}</p>
							)}
						</motion.div>
					)}

					{lastProcessedThumbnails.length > 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="space-y-1.5 mt-3"
						>
							<Label className="text-sm">Últimas Procesadas</Label>
							<div className="grid grid-cols-3 gap-1.5 bg-muted/30 p-2 rounded-lg">
								<AnimatePresence>
									{lastProcessedThumbnails.map((image, index) => (
										<ThumbnailItem key={image.id} image={image} index={index} />
									))}
								</AnimatePresence>
							</div>
						</motion.div>
					)}
				</div>
			</CardContent>

			<Dialog open={showErrors} onOpenChange={setShowErrors}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Errores en Miniaturas</DialogTitle>
					</DialogHeader>
					<ScrollArea className="h-[400px] mt-4">
						<div className="space-y-4">
							{thumbnailStats?.errors.map((error) => (
								<motion.div
									key={error.imageId}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="p-4 rounded-lg border bg-muted/50"
								>
									<div className="flex justify-between items-start mb-2">
										<span className="font-medium">{error.imagePath}</span>
										<span className="text-sm text-muted-foreground">{new Date(error.timestamp).toLocaleString()}</span>
									</div>
									<p className="text-sm text-red-500">{error.error}</p>
								</motion.div>
							))}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
