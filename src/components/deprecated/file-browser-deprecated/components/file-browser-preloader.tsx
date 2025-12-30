import gsap from 'gsap';
import { Box, Database, FileAudio, FileText, Image, Loader2, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Skeletons inline (se eliminaron componentes legacy)
type SkeletonProps = { count?: number; itemSize?: number; className?: string };

function SkeletonGrid({ count = 12, itemSize = 150, className }: SkeletonProps) {
	const size = Math.max(80, itemSize);
	const items = Array.from({ length: count });
	return (
		<div
			className={cn('h-full w-full', className)}
			style={{
				display: 'grid',
				gap: 8,
				gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`,
				alignContent: 'start',
			}}
		>
			{items.map((_, i) => (
				<div key={i} style={{ height: size, borderRadius: 8, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
			))}
		</div>
	);
}

function SkeletonList({ count = 8, className }: SkeletonProps) {
	const items = Array.from({ length: count });
	return (
		<div className={cn('h-full w-full', className)} style={{ padding: 8 }}>
			{items.map((_, i) => (
				<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
					<div style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					<div style={{ flex: 1 }}>
						<div style={{ height: 10, width: '40%', borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					</div>
					<div style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					<div style={{ width: 100, height: 8, borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
				</div>
			))}
		</div>
	);
}

function SkeletonTable({ count = 10, className }: SkeletonProps) {
	const items = Array.from({ length: count });
	return (
		<div className={cn('h-full w-full', className)}>
			{items.map((_, i) => (
				<div
					key={i}
					style={{
						display: 'grid',
						gridTemplateColumns: '60px 1fr 120px 120px',
						gap: 12,
						alignItems: 'center',
						padding: '8px 12px',
						borderBottom: '1px solid hsl(var(--border) / 0.5)',
					}}
				>
					<div style={{ width: 40, height: 28, borderRadius: 6, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					<div style={{ height: 10, width: '60%', borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					<div style={{ height: 10, width: '70%', borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
					<div style={{ height: 10, width: '60%', borderRadius: 4, backgroundColor: 'hsl(var(--muted) / 0.5)' }} />
				</div>
			))}
		</div>
	);
}

interface PreloaderProps {
	isLoading: boolean;
	itemCount: number;
	viewMode?: 'grid' | 'list' | 'table' | 'cards' | 'masonry' | 'canvas' | 'single' | 'simple-grid';
	itemSize?: number;
	className?: string;
}

interface LoadingProgress {
	currentCount: number;
	targetCount: number;
	stage: 'initial' | 'loading' | 'finalizing' | 'complete';
}

const ENTITY_ICONS = {
	image: Image,
	video: Video,
	audio: FileAudio,
	document: FileText,
	jsonFile: Database,
	file3d: Box,
};

/**
 * Preloader suave para el file-browser que evita el 'pop' visual
 * Muestra estados de carga progresivos y animaciones suaves
 */
export function FileBrowserPreloader({
	isLoading,
	itemCount,
	viewMode = 'grid',
	itemSize = 150,
	className,
}: PreloaderProps) {
	// Refs para GSAP
	const rootRef = useRef<HTMLDivElement | null>(null);
	const initialProgressRef = useRef<HTMLDivElement | null>(null);
	const headerProgressRef = useRef<HTMLDivElement | null>(null);
	const [progress, setProgress] = useState<LoadingProgress>({
		currentCount: 0,
		targetCount: 0,
		stage: 'initial',
	});

	const [displayedCount, setDisplayedCount] = useState(0);
	const [showSkeletons, setShowSkeletons] = useState(false);
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		if (!isLoading && itemCount > 0) {
			// Cuando la carga está completa, actualizar suavemente
			setProgress({
				currentCount: itemCount,
				targetCount: itemCount,
				stage: 'complete',
			});

			// Animar el contador progresivamente
			let currentCount = displayedCount;
			const increment = Math.max(1, Math.floor((itemCount - displayedCount) / 20));

			const animate = () => {
				currentCount += increment;
				if (currentCount >= itemCount) {
					setDisplayedCount(itemCount);
					return;
				}
				setDisplayedCount(currentCount);
				requestAnimationFrame(animate);
			};

			if (itemCount > displayedCount) {
				requestAnimationFrame(animate);
			}
		} else if (isLoading) {
			// Durante la carga, mostrar estados intermedios
			setProgress((prev) => ({
				...prev,
				stage: itemCount === 0 ? 'initial' : 'loading',
			}));

			setDisplayedCount(itemCount);

			// Mostrar skeletons después de un pequeño delay
			if (!showSkeletons && itemCount === 0) {
				const timer = setTimeout(() => {
					setShowSkeletons(true);
					setShowContent(true);
				}, 500);
				return () => clearTimeout(timer);
			}
		}
	}, [isLoading, itemCount, displayedCount, showSkeletons]);

	// Animación: actualizar barras de progreso con GSAP
	useEffect(() => {
		const percent = Math.min(100, (displayedCount / Math.max(itemCount, 1)) * 100);
		const targets: HTMLDivElement[] = [];
		if (initialProgressRef.current) targets.push(initialProgressRef.current);
		if (headerProgressRef.current) targets.push(headerProgressRef.current);
		if (targets.length > 0) {
			gsap.to(targets, { width: `${percent}%`, duration: 0.3, ease: 'power1.out' });
		}
	}, [displayedCount, itemCount]);

	// Animaciones del spinner, pulsos y éxito con GSAP
	useEffect(() => {
		if (!rootRef.current) return;
		const ctx = gsap.context(() => {
			// Limpiar tweens previos
			gsap.killTweensOf('[data-ring]');
			gsap.killTweensOf('[data-center]');
			gsap.killTweensOf('[data-stage-icon]');
			gsap.killTweensOf('[data-success]');
			gsap.killTweensOf('[data-skel-type]');

			if (progress.stage !== 'complete') {
				// Spinners
				gsap.to('[data-ring="outer"]', {
					rotate: 360,
					duration: 2,
					ease: 'none',
					repeat: -1,
					transformOrigin: '50% 50%',
				});
				gsap.to('[data-ring="mid"]', {
					rotate: -360,
					duration: 1.5,
					ease: 'none',
					repeat: -1,
					transformOrigin: '50% 50%',
				});
				gsap.to('[data-ring="inner"]', {
					rotate: 360,
					duration: 1,
					ease: 'none',
					repeat: -1,
					transformOrigin: '50% 50%',
				});

				// Pulso del centro
				gsap.to('[data-center]', {
					scale: 1.1,
					duration: 1.2,
					yoyo: true,
					repeat: -1,
					ease: 'sine.inOut',
				});

				// Bounce del icono en etapa finalizando
				if (progress.stage === 'finalizing') {
					gsap.to('[data-stage-icon="finalizing"]', {
						y: -4,
						duration: 0.6,
						yoyo: true,
						repeat: -1,
						ease: 'sine.inOut',
					});
				}

				// Pulso sutil de iconos de tipos
				if (showSkeletons) {
					gsap.fromTo(
						'[data-skel-type]',
						{ opacity: 0.5, scale: 0.98 },
						{ opacity: 1, scale: 1.02, duration: 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.1 }
					);
				}
			} else {
				// Animación de éxito (ping controlado por GSAP)
				gsap.fromTo(
					'[data-success]',
					{ scale: 0.6, opacity: 0.6 },
					{ scale: 1.2, opacity: 1, duration: 0.9, ease: 'power2.out' }
				);
				gsap.to('[data-success]', { opacity: 0, scale: 1.5, duration: 0.8, ease: 'power2.out', delay: 0.6 });
			}
		}, rootRef);
		return () => ctx.revert();
	}, [progress.stage, showSkeletons]);

	// Si no estamos cargando y no hay items, no mostrar preloader
	if (!isLoading && itemCount === 0) {
		return null;
	}

	// Si completó la carga, no mostrar preloader
	if (!isLoading && progress.stage === 'complete' && displayedCount === itemCount) {
		return null;
	}

	const getStageMessage = () => {
		switch (progress.stage) {
			case 'initial':
				return 'Iniciando carga...';
			case 'loading':
				return `Cargando archivos (${displayedCount})...`;
			case 'finalizing':
				return 'Finalizando...';
			case 'complete':
				return `${itemCount} archivos cargados`;
			default:
				return 'Cargando...';
		}
	};

	const renderSkeletonLayout = () => {
		if (!showContent) return null;

		switch (viewMode) {
			case 'list':
				return <SkeletonList className="flex-1" count={8} />;
			case 'table':
				return <SkeletonTable className="flex-1" count={10} />;
			default:
				// grid, cards, masonry, canvas all use grid
				return <SkeletonGrid className="flex-1" count={12} itemSize={itemSize} />;
		}
	};

	// Si estamos en loading inicial o con pocos items, mostrar preloader completo
	if (progress.stage === 'initial' || displayedCount < 5) {
		return (
			<div className={cn('flex h-full flex-col items-center justify-center gap-6 p-8', className)} ref={rootRef}>
				{/* Spinner sofisticado con múltiples capas */}
				<div className="relative">
					{/* Spinner principal */}
					<div className={cn('relative h-16 w-16')}>
						{/* Anillo exterior - rotación lenta */}
						<div
							className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/30"
							data-ring="outer"
						/>

						{/* Anillo intermedio - rotación media */}
						<div
							className="absolute inset-2 rounded-full border-2 border-transparent border-r-primary/50"
							data-ring="mid"
						/>

						{/* Anillo interior - rotación rápida */}
						<div
							className="absolute inset-4 rounded-full border-2 border-transparent border-b-primary"
							data-ring="inner"
						/>

						{/* Centro pulsante */}
						<div className="absolute inset-6 rounded-full bg-primary/20" data-center />

						{/* Icono de estado */}
						<div className="absolute inset-0 flex items-center justify-center">
							{progress.stage === 'initial' && <Loader2 className="h-4 w-4 text-primary" />}
							{progress.stage === 'loading' && <Database className="h-4 w-4 text-primary" />}
							{progress.stage === 'finalizing' && <Box className="h-4 w-4 text-primary" data-stage-icon="finalizing" />}
						</div>
					</div>

					{/* Efecto de éxito */}
					{progress.stage === 'complete' && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className={cn('h-12 w-12 rounded-full border-2 border-green-500 bg-green-500/10')} data-success>
								<div className="absolute inset-2 rounded-full bg-green-500/20" />
							</div>
						</div>
					)}
				</div>

				{/* Mensaje de estado */}
				<div className="space-y-2 text-center">
					<p
						style={{
							fontSize: '0.875rem',
							fontWeight: 500,
							color: 'hsl(var(--foreground) / 0.8)',
						}}
					>
						{getStageMessage()}
					</p>

					{/* Barra de progreso visual controlada por GSAP */}
					{progress.stage === 'loading' && itemCount > 0 && (
						<div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
							<div className="h-full bg-primary" ref={initialProgressRef} style={{ width: '0%' }} />
						</div>
					)}
				</div>

				{/* Skeletons de iconos de tipos de archivos */}
				{showSkeletons && progress.stage !== 'complete' && (
					<div className="flex gap-4 opacity-30">
						{Object.entries(ENTITY_ICONS).map(([type, Icon]) => (
							<div className="flex flex-col items-center gap-1" data-skel-type key={type}>
								<Icon className="h-5 w-5 text-muted-foreground/50" />
								<div className="h-2 w-8 rounded bg-muted-foreground/20" />
							</div>
						))}
					</div>
				)}

				{/* Indicador de tipos encontrados */}
				{itemCount > 0 && progress.stage === 'loading' && (
					<div className="flex max-w-md flex-wrap justify-center gap-2">
						{Object.entries(ENTITY_ICONS).map(([type, Icon]) => (
							<div
								className={cn(
									'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
									'bg-muted/50 text-muted-foreground transition-all duration-300',
									'hover:bg-muted/80'
								)}
								key={type}
							>
								<Icon className="h-3 w-3" />
								<span className="capitalize">{type === 'jsonFile' ? 'JSON' : type}</span>
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	// Si tenemos algunos items pero aún cargando, mostrar skeleton
	return (
		<div className={cn('flex h-full flex-col', className)}>
			{/* Header con estado de carga */}
			<div className="flex items-center justify-between border-b bg-background/50 p-4 backdrop-blur-sm">
				<div className="flex items-center gap-3">
					<Loader2 className="h-4 w-4 text-primary" />
					<span className="font-medium text-sm">{getStageMessage()}</span>
				</div>

				{/* Mini progress bar */}
				<div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
					<div className="h-full bg-primary" ref={headerProgressRef} style={{ width: '0%' }} />
				</div>
			</div>

			{/* Skeleton  */}
			{renderSkeletonLayout()}
		</div>
	);
}
