'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { memo, useCallback, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { FileItem } from '@/types/file-item';

// 📊 Logger específico para FileBrowser2
const gridLogger = clientLogger.withContext('FileBrowser2');

// 🎯 **FileBrowser2: Versión Minimalista**
//
// **Objetivos:**
// - Resolver el problema de containerWidth = 0 de forma definitiva
// - Arquitectura simple sin hooks complejos interdependientes
// - Medición directa del contenedor con fallback inmediato
// - Virtualización simple y directa
//
// **Cambios principales:**
// - Sin useGridView hook (medición directa en el componente)
// - Sin estados complejos de medición (solo containerWidth)
// - Callback ref con estrategias progresivas de medición
// - Fallback inmediato a 1200px si falla la medición
// - GridItem simplificado sin dependencias pesadas

// 📝 Extensión local del tipo FileItem para soportar miniaturas
// Esto es necesario porque el tipo canónico FileItem no incluye 'thumbnail',
// pero los objetos recibidos desde el backend sí la traen.
// Cuando se unifique el tipo, eliminar esta extensión.
type FileBrowserFileItem = FileItem & { thumbnail?: string };

interface FileBrowser2Props {
	items: FileBrowserFileItem[];
	viewMode?: 'grid' | 'list' | 'masonry' | 'cards';
	onItemSelect?: (item: FileItem) => void;
	onItemDoubleClick?: (item: FileItem) => void;
	className?: string;
	/**
	 * Indica si la carpeta está cargando o reindexando
	 */
	isLoading?: boolean;
	/**
	 * Indica si la carpeta está siendo reindexada
	 */
	isReindexing?: boolean;
	/**
	 * Progreso de reindexado (0-100)
	 */
	reindexProgress?: number;
}

const FALLBACK_WIDTH = 1200;
const ITEM_HEIGHT = 220;
const ITEM_WIDTH = 200;
const GAP = 16;

export const FileBrowser2 = memo<FileBrowser2Props>(function FileBrowser2({
	items,
	viewMode = 'grid',
	onItemSelect,
	onItemDoubleClick,
	className,
	isLoading = false,
	isReindexing = false,
	reindexProgress = 0,
}) {
	// 📊 Estados mínimos - Solo lo esencial
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

	// 📐 Refs para medición directa
	const containerRef = useRef<HTMLDivElement>(null);
	const measurementAttemptsRef = useRef(0);

	// 🔧 **Sistema de medición progresivo**
	// Estrategia: inmediato → RAF → timeout → fallback fijo
	const measureContainer = useCallback((element: HTMLDivElement) => {
		const attempt = ++measurementAttemptsRef.current;
		gridLogger.debug(`[FileBrowser2] Intento medición ${attempt}`);

		const measure = () => {
			const width = element.offsetWidth;
			gridLogger.debug(`[FileBrowser2] offsetWidth = ${width}px`);

			if (width > 0) {
				gridLogger.info(`[FileBrowser2] ✅ Medición exitosa: ${width}px`);
				setContainerWidth(width);
				return true;
			}
			return false;
		};

		// Estrategia 1: Medición inmediata
		if (measure()) return;

		// Estrategia 2: requestAnimationFrame
		requestAnimationFrame(() => {
			if (measure()) return;

			// Estrategia 3: setTimeout como última oportunidad
			setTimeout(() => {
				if (measure()) return;

				// Estrategia 4: Fallback fijo (no más intentos)
				gridLogger.warn(`[FileBrowser2] ⚠️ Falló medición después de ${attempt} intentos, usando fallback: ${FALLBACK_WIDTH}px`);
				setContainerWidth(FALLBACK_WIDTH);
			}, 100);
		});
	}, []);

	// 📎 Callback ref para medición del contenedor
	const containerCallbackRef = useCallback((element: HTMLDivElement | null) => {
		if (element && element !== containerRef.current) {
			containerRef.current = element;
			gridLogger.debug('[FileBrowser2] 📎 Nuevo contenedor detectado, iniciando medición');
			measureContainer(element);
		}
	}, [measureContainer]);

	// 📊 Cálculo del grid
	const itemsPerRow = containerWidth > 0 ? Math.floor((containerWidth + GAP) / (ITEM_WIDTH + GAP)) : 0;
	const totalRows = itemsPerRow > 0 ? Math.ceil(items.length / itemsPerRow) : 0;

	// 🎮 Virtualización simple
	const virtualizer = useVirtualizer({
		count: totalRows,
		getScrollElement: () => containerRef.current,
		estimateSize: () => ITEM_HEIGHT + GAP,
		overscan: 2,
	});

	// 🎯 Event handlers
	const handleItemClick = useCallback((item: FileItem) => {
		setSelectedItemId(item.id);
		onItemSelect?.(item);
	}, [onItemSelect]);

	const handleItemDoubleClick = useCallback((item: FileItem) => {
		onItemDoubleClick?.(item);
	}, [onItemDoubleClick]);

	// 🔄 Fallback durante medición o loading/reindex
	if (containerWidth === 0 || isLoading || isReindexing) {
		return (
			<div
				ref={containerCallbackRef}
				className={clsx(
					'flex-1 h-full w-full overflow-hidden relative',
					className
				)}
			>
				<div className="flex flex-col items-center justify-center h-full">
					<Skeleton className="w-full h-40 mb-4" />
					<div className="text-sm text-muted-foreground">
						{isReindexing
							? (
								<>
									<span className="block mb-2">Reindexando carpeta...</span>
									<div className="w-full bg-muted h-2 rounded-full overflow-hidden">
										<div
											className="bg-primary h-full transition-all duration-300 ease-in-out"
											style={{ width: `${Math.round(reindexProgress)}%` }}
										/>
									</div>
									<span className="text-xs mt-2 text-muted-foreground">{Math.round(reindexProgress)}%</span>
								</>
							)
							: 'Calculando dimensiones del contenedor...'}
					</div>
				</div>
				{/* Overlay visual si está reindexando */}
				{isReindexing && (
					<div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
						<span className="text-blue-500 animate-spin text-3xl mb-2">🔄</span>
						<span className="text-xs text-blue-700">Reindexando carpeta...</span>
					</div>
				)}
			</div>
		);
	}

	gridLogger.debug(`[FileBrowser2] 🎯 Renderizando grid: ${itemsPerRow} items/fila, ${totalRows} filas, ${items.length} items`);

	return (
		<div
			ref={containerCallbackRef}
			className={clsx(
				'flex-1 h-full w-full overflow-auto',
				className
			)}
		>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: '100%',
					position: 'relative',
				}}
			>
				{virtualizer.getVirtualItems().map((virtualRow) => (
					<div
						key={virtualRow.index}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: virtualRow.size,
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						<div
							className="flex flex-wrap gap-4 p-4"
							style={{
								justifyContent: 'flex-start',
							}}
						>
							{Array.from({ length: itemsPerRow }, (_, colIndex) => {
								const itemIndex = virtualRow.index * itemsPerRow + colIndex;
								const item = items[itemIndex];

								if (!item) return null;

								return (
									<GridItem
										key={item.id}
										item={item}
										isSelected={selectedItemId === item.id}
										onClick={() => handleItemClick(item)}
										onDoubleClick={() => handleItemDoubleClick(item)}
									/>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	);
});

// 🧩 **GridItem simplificado**
interface GridItemProps {
	item: FileBrowserFileItem;
	isSelected: boolean;
	onClick: () => void;
	onDoubleClick: () => void;
}

const GridItem = memo<GridItemProps>(function GridItem({
	item,
	isSelected,
	onClick,
	onDoubleClick
}) {
	// 🖼️ Estado para manejo de errores de imagen
	const [imageError, setImageError] = useState(false);

	const handleImageError = useCallback(() => {
		gridLogger.warn(`[FileBrowser2] ❌ Error cargando thumbnail para imagen ${item.id}: ${item.name}`);
		setImageError(true);
	}, [item.id, item.name]);

	const handleImageLoad = useCallback(() => {
		gridLogger.debug(`[FileBrowser2] ✅ Thumbnail cargado para imagen ${item.id}: ${item.name}`);
	}, [item.id, item.name]);

	// 🖼️ Compatibilidad: usar item.thumbnail si existe, si no fallback a /api/images/{item.id}/thumbnail
	const thumbnailUrl = item.thumbnail || `/api/images/${item.id}/thumbnail`;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className={clsx(
				'relative group cursor-pointer',
				'w-48 h-52 rounded-lg overflow-hidden',
				'border-2 transition-all duration-200',
				isSelected
					? 'border-blue-500 shadow-lg'
					: 'border-transparent hover:border-gray-300'
			)}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
		>      {/* 🖼️ Miniatura */}
			<div className="w-full h-40 bg-gray-100 rounded-t-lg overflow-hidden">
				{item.type === 'image' ? (
					imageError ? (
						<div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
							<span className="text-2xl mb-1">⚠️</span>
							<span className="text-xs">Error</span>
						</div>
					) : (
						<img
							src={thumbnailUrl}
							alt={item.name}
							className="w-full h-full object-cover"
							loading="lazy"
							onError={handleImageError}
							onLoad={handleImageLoad}
						/>
					)
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gray-200">
						<span className="text-4xl">📄</span>
					</div>
				)}
			</div>

			{/* 📝 Información del archivo */}
			<div className="p-3 bg-white">
				<h3 className="text-sm font-medium text-gray-900 truncate">
					{item.name}
				</h3>
				<p className="text-xs text-gray-500 mt-1">
					{item.type.toUpperCase()}
				</p>
			</div>

			{/* ✨ Overlay de selección */}
			{isSelected && (
				<div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none rounded-lg" />
			)}
		</motion.div>
	);
});

export default FileBrowser2;

/**
 * 📝 Documentación rápida:
 * - Props nuevas: isLoading, isReindexing, reindexProgress
 * - Si isReindexing=true, se muestra overlay de progreso y skeleton
 * - Si isLoading=true, se muestra skeleton de carga
 * - Si containerWidth=0, se muestra skeleton de medición
 * - El overlay es accesible y visible para todos los modos
 *
 * Ejemplo de integración:
 * <FileBrowser2
 *   items={items}
 *   isReindexing={folderStatus.isReindexing}
 *   reindexProgress={folderStatus.progress}
 *   isLoading={isLoading}
 * />
 */