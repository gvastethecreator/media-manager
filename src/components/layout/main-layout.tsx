'use client';

import { getNavigationData } from '@/app/actions/navigation/nav.actions';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/panels/nav/nav-panel';
import { NavPanelSkeleton } from '@/components/panels/nav/nav-panel-skeleton';
import { RightPanel } from '@/components/panels/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizablePanel, ResizablePanelGroup, ResizablePanelHandle } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useImageViewer } from '@/store/image-viewer.store';
import { ImageItem } from '@/types/file-item';
import type * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

// Componente visual para depuración
function DebugResizeIndicator({ isResizing }: { isResizing: boolean }) {
	return (
		<div className="fixed top-2 right-2 z-50 bg-red-500 text-white px-2 py-1 rounded text-xs">
			{isResizing ? 'Resizing: ON' : 'Resizing: OFF'}
		</div>
	);
}

export function MainLayout() {
	// Variable para debugging en consola
	const DEBUG = true;

	// Usamos un ref para rastrear si estamos en medio de un resize
	const isResizingRef = useRef(false);
	// El estado visible que controla el cambio en la UI
	const [isResizing, setIsResizing] = useState(false);
	const resizingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);

	// Nueva estrategia para forzar la actualización del ViewContainer
	const contentContainerRef = useRef<HTMLDivElement>(null);

	// Función para limpiar todos los timeouts
	const clearAllTimeouts = useCallback(() => {
		if (resizingTimeoutRef.current) {
			clearTimeout(resizingTimeoutRef.current);
			resizingTimeoutRef.current = null;
		}
	}, []);

	// Manejar inicio de arrastre
	const handleDragStart = useCallback(() => {
		if (DEBUG) {
		}
		clearAllTimeouts();
		isResizingRef.current = true;
		setIsResizing(true);

		// Aplicar clase directamente al contenedor para forzar opacidad
		if (contentContainerRef.current) {
			contentContainerRef.current.style.opacity = '0';
		}
	}, [clearAllTimeouts, DEBUG]);

	// Manejar fin de arrastre con pequeño retraso
	const handleDragEnd = useCallback(() => {
		if (DEBUG) {
		}
		if (isResizingRef.current) {
			isResizingRef.current = false;

			// Limpiar cualquier timeout pendiente
			clearAllTimeouts();

			// Agregar un timeout más largo para asegurar que los eventos se completen
			resizingTimeoutRef.current = setTimeout(() => {
				if (DEBUG) {
				}
				setIsResizing(false);

				// Restaurar opacidad directamente
				if (contentContainerRef.current) {
					contentContainerRef.current.style.opacity = '1';
				}

				resizingTimeoutRef.current = null;
			}, 300); // Tiempo más largo para asegurar que terminen todos los eventos
		}
	}, [clearAllTimeouts, DEBUG]);

	// Añadir listeners globales para asegurar que captemos todos los eventos
	useEffect(() => {
		// Función para manejar cualquier movimiento del mouse
		const handleGlobalMouseMove = () => {
			// Solo actualizamos si estamos en medio de un resize
			if (isResizingRef.current) {
				if (DEBUG) {
				}
				setIsResizing(true);

				// Asegurar que el contenedor esté oculto
				if (contentContainerRef.current) {
					contentContainerRef.current.style.opacity = '0';
				}
			}
		};

		// Función para manejar cuando se suelta el botón del ratón
		const handleGlobalMouseUp = () => {
			// Si estábamos redimensionando, termina el resize
			if (isResizingRef.current) {
				if (DEBUG) {
				}
				handleDragEnd();
			}
		};

		// Añadir listener para la tecla Escape
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isResizingRef.current) {
				if (DEBUG) {
				}
				handleDragEnd();
			}
		};

		// Registramos los listeners
		if (DEBUG) {
		}
		window.addEventListener('mousedown', (_e) => {
			if (DEBUG) {
			}
		});
		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);
		window.addEventListener('keydown', handleKeyDown);

		// Limpieza al desmontar
		return () => {
			if (DEBUG) {
			}
			window.removeEventListener('mousemove', handleGlobalMouseMove);
			window.removeEventListener('mouseup', handleGlobalMouseUp);
			window.removeEventListener('keydown', handleKeyDown);
			clearAllTimeouts();
		};
	}, [handleDragEnd, clearAllTimeouts, DEBUG]);

	// Log de cambios de estado
	useEffect(() => {
		if (DEBUG) {
		}
	}, [isResizing, DEBUG]);

	// Cargar datos de navegación
	useEffect(() => {
		getNavigationData().then(setNavData);
	}, []);

	return (
		<div className="flex h-screen w-full">
			{/* Indicador de depuración */}
			{DEBUG && <DebugResizeIndicator isResizing={isResizing} />}

			<ResizablePanelGroup
				direction="horizontal"
				className="h-full w-full"
				onDragStart={() => {
					if (DEBUG) {
					}
					handleDragStart();
				}}
				onDragEnd={() => {
					if (DEBUG) {
					}
					handleDragEnd();
				}}
			>
				{/* Panel Izquierdo - Default 20% */}
				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background-primary">
					{navData && <NavPanel initialData={navData} />}
				</ResizablePanel>

				<ResizablePanelHandle
					withHandle
					className="cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					onDoubleClick={() => {
						if (DEBUG) {
						}
					}}
					onDrag={() => {
						if (DEBUG) {
						}
					}}
				/>

				{/* Contenido Principal - Default 60% */}
				<ResizablePanel defaultSize={60} minSize={40} className="h-full w-full">
					<div className="flex flex-col h-full">
						<ViewToolbar />

						<div
							ref={contentContainerRef}
							className="flex-1 transition-opacity duration-300 ease-in-out"
							style={{ opacity: isResizing ? 0 : 1 }}
						>
							<ViewContainer />
						</div>
					</div>
				</ResizablePanel>

				<ResizablePanelHandle
					withHandle
					className="cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				/>

				{/* Panel Derecho - Default 20% */}
				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background-primary">
					<RightPanel />
				</ResizablePanel>
			</ResizablePanelGroup>

			{/* Visor de imágenes */}
			<FileViewer
				images={images.map((img) => ({
					...img,
					parsedMetadata: img.metadata ? JSON.parse(img.metadata) : undefined,
				}))}
				initialIndex={currentIndex}
				isOpen={isOpen}
				onClose={closeViewer}
			/>
		</div>
	);
}
