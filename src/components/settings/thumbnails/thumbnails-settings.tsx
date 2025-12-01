import { AlertCircle, Settings2, Trash2, Zap } from 'lucide-react';
import React, { useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
	type LastProcessedThumbnail,
	type ProcessOptions,
	useCleanThumbnails,
	useLastProcessedThumbnails,
	useOptimizeThumbnails,
	useReprocessThumbnails,
	useThumbnail,
} from '@/lib/api/thumbnails';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { useThumbnailStore } from '@/store/thumbnails.store';
import { ThumbnailError } from './thumbnail-error';
import { ThumbnailAdvancedSettings } from './thumbnail-advanced-settings';
import { DEFAULT_THUMBNAIL_ADVANCED_CONFIG, type ThumbnailAdvancedConfig } from '@/types/thumbnails-advanced.config';
import { clientLogger } from '@/lib/logger/client-logger';

const thumbnailQualityOptions: { value: ThumbnailQuality; label: string }[] = [
	{
		value: ThumbnailQuality.LOW,
		label: 'Baja (balance entre calidad y espacio)',
	},
	{ value: ThumbnailQuality.MEDIUM, label: 'Media (recomendado)' },
	{ value: ThumbnailQuality.HIGH, label: 'Alta (mejor calidad, más espacio)' },
];

// ThumbnailItem component
function ThumbnailItem({ image, index }: { image: LastProcessedThumbnail; index: number }) {
	const { data: thumbnailData, isLoading, error } = useThumbnail(image.id, ThumbnailQuality.MEDIUM);

	return (
		<motion.div
			animate={{ opacity: 1, scale: 1 }}
			className="group relative aspect-square overflow-hidden rounded-md bg-muted"
			exit={{ opacity: 0, scale: 0.8 }}
			initial={{ opacity: 0, scale: 0.8 }}
			key={image.id}
			transition={{ delay: index * 0.1 }}
		>
			{isLoading ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			) : error ? (
				<div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">Error</div>
			) : (
				thumbnailData?.thumbnailUrl && (
					<>
						<img
							alt={image.path}
							className="object-cover transition-transform group-hover:scale-105"
							src={thumbnailData.thumbnailUrl}
						/>
						<motion.div
							className="absolute inset-0 bg-black/60 p-1.5"
							initial={{ opacity: 0 }}
							whileHover={{ opacity: 1 }}
						>
							<p className="truncate text-[10px] text-white">{image.path}</p>
							<p className="absolute bottom-1.5 left-1.5 text-[10px] text-white/70">
								{new Date(image.processedAt).toLocaleTimeString()}
							</p>
						</motion.div>
					</>
				)
			)}
		</motion.div>
	);
}

export function ThumbnailsSettings() {
	const { settings, updateSettings } = useSettings();
	const {
		stats: thumbnailStats,
		isLoading: isThumbnailLoading,
		isProcessing: isThumbnailProcessing,
		processStatus: thumbnailProcessStatus,
		initialize: initializeThumbnails,
		setProcessing: setThumbnailProcessing,
		error: thumbnailError,
	} = useThumbnailStore();

	// React Query hooks
	const { data: lastProcessedThumbnails = [], refetch: refetchLastProcessed } = useLastProcessedThumbnails(9);
	const optimizeThumbnailsMutation = useOptimizeThumbnails();
	const reprocessThumbnailsMutation = useReprocessThumbnails();
	const cleanThumbnailsMutation = useCleanThumbnails();

	const [showErrors, setShowErrors] = React.useState(false);

	const idVideoAnimation = useId();

	// Inicializar eventos SSE y cargar estadísticas iniciales
	React.useEffect(() => {
		initializeThumbnails();
	}, [initializeThumbnails]);

	// Función para reintentar la inicialización
	const handleRetryInitialize = () => {
		initializeThumbnails();
	};

	// Manejador común para procesos de miniaturas usando React Query
	const handleThumbnailProcess = async (mutation: any, processName: string) => {
		if (isThumbnailProcessing) {
			toastService.info('Ya hay un proceso de miniaturas en ejecución');
			return;
		}

		try {
			setThumbnailProcessing(true);

			const options: ProcessOptions = {
				onProgress: (status) => {
					if (status?.lastProcessed) {
						refetchLastProcessed();
					}
				},
				onError: (error: unknown) => {
					clientLogger.error(`Error en ${processName}:`, error);
					toastService.error(
						error instanceof Error
							? `Error: ${error.message}`
							: typeof error === 'object' && error && 'message' in error
								? String(error.message)
								: `Error desconocido en ${processName}`
					);
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
						toastService.success(message);
					}

					initializeThumbnails();
					refetchLastProcessed();
				},
			};

			await mutation.mutateAsync(options);
		} catch (error: unknown) {
			clientLogger.error(`Error en ${processName}:`, error);
			toastService.error(
				error instanceof Error
					? `Error: ${error.message}`
					: typeof error === 'object' && error && 'message' in error
						? String(error.message)
						: `Error desconocido en ${processName}`
			);
		} finally {
			setThumbnailProcessing(false);
		}
	};

	const handleQualityChange = async (quality: ThumbnailQuality) => {
		try {
			await updateSettings({ thumbnailQuality: quality });
			toastService.success('La calidad de las miniaturas se ha actualizado correctamente');
		} catch (error) {
			clientLogger.error('Error actualizando calidad:', error);
			toastService.error('No se pudo actualizar la calidad de las miniaturas');
		}
	};

	const handleVideoAnimationToggle = async (enabled: boolean) => {
		try {
			await updateSettings({ videoThumbnailAnimation: enabled });
			toastService.success(`La animación de videos se ha ${enabled ? 'activado' : 'desactivado'} correctamente`);
		} catch (error) {
			clientLogger.error('Error actualizando animación:', error);
			toastService.error('No se pudo actualizar la configuración de animación');
		}
	};

	const handleOptimizeThumbnails = () => handleThumbnailProcess(optimizeThumbnailsMutation, 'Optimización');

	const handleReprocessThumbnails = () => handleThumbnailProcess(reprocessThumbnailsMutation, 'Reprocesamiento');

	const handleCleanThumbnails = () => handleThumbnailProcess(cleanThumbnailsMutation, 'Limpieza');

	const handleAdvancedConfigUpdate = async (config: Partial<ThumbnailAdvancedConfig>) => {
		try {
			const currentConfig = settings.thumbnailAdvancedConfig || DEFAULT_THUMBNAIL_ADVANCED_CONFIG;
			const newConfig = { ...currentConfig, ...config };
			await updateSettings({ thumbnailAdvancedConfig: newConfig });
			toastService.success('Configuración avanzada actualizada');
		} catch (error) {
			clientLogger.error('Error actualizando configuración avanzada:', error);
			toastService.error('No se pudo actualizar la configuración');
		}
	};

	return (
		<Card className="flex h-full flex-col gap-2 rounded-sm border-none bg-muted/30">
			<CardHeader className="bg-transparent p-2 pb-0">
				<CardTitle className="flex items-center justify-between pl-1 font-semibold text-base text-muted-foreground">
					<span className="flex h-7 items-center gap-2">
						<Settings2 className="h-5 w-5" /> Miniaturas
					</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="flex-1 overflow-y-auto p-2">
				<ScrollArea className="flex h-full flex-col">
					{thumbnailError && (
						<div className="mb-4">
							<ThumbnailError
								description="No se pudieron cargar las estadísticas de miniaturas. Esto puede deberse a un problema de conexión con la base de datos."
								error={thumbnailError}
								onRetry={handleRetryInitialize}
							/>
						</div>
					)}
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-1">
							<div className="space-y-1.5">
								<Label className="text-sm">Calidad de Miniaturas</Label>
								<Select onValueChange={handleQualityChange} value={settings.thumbnailQuality}>
									<SelectTrigger className="h-8 text-xs">
										<SelectValue placeholder="Selecciona la calidad" />
									</SelectTrigger>
									<SelectContent>
										{thumbnailQualityOptions.map((option) => (
											<SelectItem className="text-xs" key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									Una calidad más alta resultará en miniaturas más nítidas pero ocupará más espacio
								</p>
							</div>

							<div className="flex items-center justify-between space-x-4 py-1">
								<div className="space-y-0.5">
									<Label className="text-sm" htmlFor="video-animation">
										Animación en videos
									</Label>
									<p className="text-muted-foreground text-xs">
										Mostrar un preview animado al pasar el cursor sobre videos
									</p>
								</div>
								<Switch
									checked={settings.videoThumbnailAnimation}
									className="scale-90"
									id={idVideoAnimation}
									onCheckedChange={handleVideoAnimationToggle}
								/>
							</div>
						</div>

						<div className="flex flex-wrap gap-1.5 pt-2">
							<Button
								className="h-7 text-xs"
								disabled={isThumbnailLoading || isThumbnailProcessing}
								onClick={handleOptimizeThumbnails}
								size="sm"
								variant="outline"
							>
								{isThumbnailProcessing ? (
									<>
										<Zap className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										Optimizando...
									</>
								) : (
									<>
										<Zap className="mr-1.5 h-3.5 w-3.5" />
										Optimizar
									</>
								)}
							</Button>
							<Button
								className="h-7 text-xs"
								disabled={isThumbnailLoading || isThumbnailProcessing}
								onClick={handleReprocessThumbnails}
								size="sm"
								variant="outline"
							>
								{isThumbnailProcessing ? (
									<>
										<Settings2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										Procesando...
									</>
								) : (
									<>
										<Settings2 className="mr-1.5 h-3.5 w-3.5" />
										Reprocesar
									</>
								)}
							</Button>
							<Button
								className="h-7 text-xs"
								disabled={isThumbnailLoading || isThumbnailProcessing}
								onClick={handleCleanThumbnails}
								size="sm"
								variant="outline"
							>
								{isThumbnailProcessing ? (
									<>
										<Trash2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										Limpiando...
									</>
								) : (
									<>
										<Trash2 className="mr-1.5 h-3.5 w-3.5" />
										Limpiar
									</>
								)}
							</Button>

							{isThumbnailProcessing && (
								<Button
									className="h-7 text-red-500 text-xs hover:text-red-600"
									onClick={() => setThumbnailProcessing(false)}
									size="sm"
									variant="ghost"
								>
									Cancelar
								</Button>
							)}
						</div>

						<Separator className="my-2" />

						{/* Configuración Avanzada */}
						<ThumbnailAdvancedSettings
							config={settings.thumbnailAdvancedConfig || DEFAULT_THUMBNAIL_ADVANCED_CONFIG}
							onUpdate={handleAdvancedConfigUpdate}
						/>

						<Separator className="my-2" />
						<div className="grid grid-cols-2 gap-3">
							{thumbnailStats && (
								<>
									<motion.div
										animate={{ opacity: 1, x: 0 }}
										className="space-y-1.5"
										initial={{ opacity: 0, x: -20 }}
										transition={{ delay: 0.1 }}
									>
										<div className="flex items-center justify-between">
											<Label className="text-sm">Miniaturas</Label>
											<Badge className="text-xs" variant="secondary">
												{formatBytes(thumbnailStats.totalSize || 0)}
											</Badge>
										</div>
										<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
											<span className="font-medium text-sm">{thumbnailStats.totalFiles || 0} totales</span>
											<span className="text-muted-foreground text-sm">{thumbnailStats.pending} pendientes</span>
										</div>
									</motion.div>

									<motion.div
										animate={{ opacity: 1, x: 0 }}
										className="space-y-1.5"
										initial={{ opacity: 0, x: 20 }}
										transition={{ delay: 0.2 }}
									>
										<div className="flex items-center justify-between">
											<Label className="text-sm">Estado</Label>
											{thumbnailStats.errors.length > 0 && (
												<Button
													className="h-6 text-red-500 text-xs hover:text-red-600"
													onClick={() => setShowErrors(true)}
													size="sm"
													variant="ghost"
												>
													<AlertCircle className="mr-1 h-3.5 w-3.5" />
													Ver errores
												</Button>
											)}
										</div>
										<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
											<span className="font-medium text-sm">{thumbnailStats.errors.length} errores</span>
											<Badge
												className={cn('text-xs', thumbnailStats.pending === 0 && 'bg-green-500/20 text-green-500')}
												variant="secondary"
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
								animate={{ opacity: 1, height: 'auto' }}
								className="mt-3 space-y-1.5 rounded-lg bg-muted/30 p-3"
								exit={{ opacity: 0, height: 0 }}
								initial={{ opacity: 0, height: 0 }}
							>
								<div className="flex justify-between text-xs">
									<span>
										{thumbnailProcessStatus.current || 0} de {thumbnailProcessStatus.total || 0} (
										{Math.round(thumbnailProcessStatus.progress || 0)}%)
									</span>
									<span className="text-muted-foreground">{thumbnailProcessStatus.status || 'Procesando...'}</span>
								</div>
								<Progress className="h-1.5" value={thumbnailProcessStatus.progress} />
								{thumbnailProcessStatus.currentFile && (
									<p className="truncate text-muted-foreground text-xs">{thumbnailProcessStatus.currentFile}</p>
								)}
							</motion.div>
						)}

						{lastProcessedThumbnails.length > 0 && (
							<motion.div
								animate={{ opacity: 1 }}
								className="mt-3 space-y-1.5"
								initial={{ opacity: 0 }}
								transition={{ delay: 0.3 }}
							>
								<Label className="text-sm">Últimas Procesadas</Label>
								<div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/30 p-2">
									<AnimatePresence>
										{lastProcessedThumbnails.map((image, index) => (
											<ThumbnailItem image={image} index={index} key={image.id} />
										))}
									</AnimatePresence>
								</div>
							</motion.div>
						)}
					</div>
				</ScrollArea>
			</CardContent>

			<Dialog onOpenChange={setShowErrors} open={showErrors}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Errores en Miniaturas</DialogTitle>
					</DialogHeader>
					<ScrollArea className="mt-4 h-[400px]">
						<div className="space-y-4">
							{thumbnailStats?.errors.map((error: any) => (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="rounded-lg border bg-muted/50 p-4"
									initial={{ opacity: 0, y: 20 }}
									key={error.imageId}
								>
									<div className="mb-2 flex items-start justify-between">
										<span className="font-medium">{error.imagePath}</span>
										<span className="text-muted-foreground text-sm">{new Date(error.timestamp).toLocaleString()}</span>
									</div>
									<p className="text-red-500 text-sm">{error.error}</p>
								</motion.div>
							))}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
