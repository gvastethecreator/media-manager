'use client';

import { getEntityTextureSystem, saveEntityTextureSystem } from '@/app/actions/entities-cards/entities-cards.actions';
import type { TextureConfig, TextureSystem } from '@/components/features/entity-cards/types/base-card-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toastService } from '@/lib/services/toast.service';
import { Palette, Plus, Save } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TextureEditor } from './texture-editor';
import { TextureList } from './texture-list';

interface TextureManagerProps {
	entityType: string;
	onTexturesChange?: (textures: TextureSystem) => void;
	onTextureSelect?: (texture: TextureConfig) => void;
}

// Interfaz para una textura
interface TextureItem {
	id: string;
	name: string;
	imageUrl?: string;
	patternType?: string;
	color: string;
	opacity: number;
	description?: string;
	blendMode?: string;
	noiseType?: string;
	animated?: boolean;
	animationSpeed?: number;
	density?: number;
	contrast?: number;
	visibleOnHover?: boolean;
	layerOrder?: number;
	scale?: number;
}

export function TextureManager({ entityType, onTexturesChange, onTextureSelect }: TextureManagerProps) {
	// Estado para el sistema de texturas
	const [textureSystem, setTextureSystem] = useState<TextureSystem>({
		enabled: false,
		textures: [],
	});

	// Estado para indicar si está guardando
	const [isSaving, setIsSaving] = useState(false);

	// Estado para el diálogo de edición
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentTexture, setCurrentTexture] = useState<TextureItem | null>(null);

	// Lista de patrones SVG predefinidos
	const svgPatterns = useMemo(
		() => [
			{
				id: 'dots',
				name: 'Puntos',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<circle cx="5" cy="5" r="1.5" fill="currentColor" />
				<circle cx="15" cy="5" r="1.5" fill="currentColor" />
				<circle cx="5" cy="15" r="1.5" fill="currentColor" />
				<circle cx="15" cy="15" r="1.5" fill="currentColor" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternDots">
						<title id="patternDots">Patrón de puntos</title>
						<circle cx="5" cy="5" r="1.5" fill={color} />
						<circle cx="15" cy="5" r="1.5" fill={color} />
						<circle cx="5" cy="15" r="1.5" fill={color} />
						<circle cx="15" cy="15" r="1.5" fill={color} />
					</svg>
				),
			},
			{
				id: 'lines',
				name: 'Líneas',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<line x1="0" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="1" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternLines">
						<title id="patternLines">Patrón de líneas</title>
						<line x1="0" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1" />
					</svg>
				),
			},
			{
				id: 'grid',
				name: 'Cuadrícula',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<line x1="0" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="0.5" />
				<line x1="10" y1="0" x2="10" y2="20" stroke="currentColor" stroke-width="0.5" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternGrid">
						<title id="patternGrid">Patrón de cuadrícula</title>
						<line x1="0" y1="10" x2="20" y2="10" stroke={color} strokeWidth="0.5" />
						<line x1="10" y1="0" x2="10" y2="20" stroke={color} strokeWidth="0.5" />
					</svg>
				),
			},
			{
				id: 'diagonal',
				name: 'Diagonal',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<line x1="0" y1="0" x2="20" y2="20" stroke="currentColor" stroke-width="0.5" />
				<line x1="20" y1="0" x2="0" y2="20" stroke="currentColor" stroke-width="0.5" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternDiagonal">
						<title id="patternDiagonal">Patrón diagonal</title>
						<line x1="0" y1="0" x2="20" y2="20" stroke={color} strokeWidth="0.5" />
						<line x1="20" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" />
					</svg>
				),
			},
			{
				id: 'waves',
				name: 'Ondas',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<path d="M0,10 Q5,5 10,10 T20,10" stroke="currentColor" fill="none" stroke-width="0.5" />
				<path d="M0,15 Q5,10 10,15 T20,15" stroke="currentColor" fill="none" stroke-width="0.5" />
				<path d="M0,5 Q5,0 10,5 T20,5" stroke="currentColor" fill="none" stroke-width="0.5" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternWaves">
						<title id="patternWaves">Patrón de ondas</title>
						<path d="M0,10 Q5,5 10,10 T20,10" stroke={color} fill="none" strokeWidth="0.5" />
						<path d="M0,15 Q5,10 10,15 T20,15" stroke={color} fill="none" strokeWidth="0.5" />
						<path d="M0,5 Q5,0 10,5 T20,5" stroke={color} fill="none" strokeWidth="0.5" />
					</svg>
				),
			},
			{
				id: 'hexagons',
				name: 'Hexágonos',
				svg: `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				<polygon points="10,1 17,5 17,15 10,19 3,15 3,5" fill="none" stroke="currentColor" stroke-width="0.5" />
			</svg>`,
				renderSvg: (color: string) => (
					<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="patternHexagons">
						<title id="patternHexagons">Patrón de hexágonos</title>
						<polygon points="10,1 17,5 17,15 10,19 3,15 3,5" fill="none" stroke={color} strokeWidth="0.5" />
					</svg>
				),
			},
		],
		[]
	);

	// Cargar el sistema de texturas
	const loadTextureSystem = useCallback(async () => {
		try {
			const response = await getEntityTextureSystem(entityType);

			if (response.success && response.data) {
				setTextureSystem(response.data as TextureSystem);
				onTexturesChange?.(response.data as TextureSystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error('Error al cargar el sistema de texturas:', error);
			toastService.error('No se pudo cargar el sistema de texturas');
		}
	}, [entityType, onTexturesChange]);

	// Efecto para cargar las texturas al montar el componente
	useEffect(() => {
		loadTextureSystem();
	}, [loadTextureSystem]);

	// Función para guardar el sistema de texturas
	const handleSaveTextureSystem = async () => {
		try {
			setIsSaving(true);
			const response = await saveEntityTextureSystem(entityType, textureSystem);

			if (response.success) {
				toastService.success(response.message);
				onTexturesChange?.(textureSystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error('Error al guardar el sistema de texturas:', error);
			toastService.error('No se pudo guardar el sistema de texturas');
		} finally {
			setIsSaving(false);
		}
	};

	// Función para manejar el cambio en enabled
	const handleEnabledChange = (enabled: boolean) => {
		setTextureSystem((prev) => ({
			...prev,
			enabled,
		}));
	};

	// Función para agregar una nueva textura
	const handleAddTexture = () => {
		// Generar un ID único
		const id = `texture_${Date.now()}`;

		// Crear un objeto de textura predeterminado
		const newTexture: TextureItem = {
			id,
			name: 'Nueva Textura',
			color: '#3b82f6',
			opacity: 0.5,
			patternType: 'dots',
			blendMode: 'normal',
			animated: false,
			visibleOnHover: false,
		};

		// Abrir el diálogo de edición
		setCurrentTexture(newTexture);
		setEditDialogOpen(true);
	};

	// Función para editar una textura
	const handleEditTexture = (texture: TextureItem) => {
		setCurrentTexture(texture);
		setEditDialogOpen(true);
	};

	// Manejador para eliminar una textura
	const handleDeleteTexture = (textureId: string) => {
		setTextureSystem((prev) => {
			return {
				...prev,
				textures: prev.textures.filter((t) => t.id !== textureId),
			};
		});
	};

	// Función para guardar los cambios en una textura
	const handleSaveTexture = (updatedTexture: TextureItem) => {
		// Guardar la textura actualizada en el sistema
		setTextureSystem((prev) => {
			const existingIndex = prev.textures.findIndex((t) => t.id === updatedTexture.id);
			let updatedTextures: TextureItem[] = [];

			if (existingIndex >= 0) {
				updatedTextures = [...prev.textures];
				updatedTextures[existingIndex] = updatedTexture;
			} else {
				updatedTextures = [...prev.textures, updatedTexture];
			}

			return {
				...prev,
				textures: updatedTextures,
			};
		});

		// Cerrar el diálogo
		setEditDialogOpen(false);
		setCurrentTexture(null);
		toastService.success(`Textura "${updatedTexture.name}" guardada correctamente`);
	};

	// Función para agregar presets de texturas
	const handleAddPresets = () => {
		const presets = [
			{
				id: 'none',
				name: 'Ninguna',
				color: '#ffffff',
				opacity: 0,
				patternType: 'none',
				blendMode: 'normal',
				animated: false,
				visibleOnHover: false,
				layerOrder: 0,
			},
			{
				id: 'dots',
				name: 'Puntos',
				color: '#3b82f6',
				opacity: 0.2,
				patternType: 'dots',
				blendMode: 'multiply',
				animated: false,
				visibleOnHover: false,
				density: 0.8,
				scale: 1,
				layerOrder: 1,
			},
			{
				id: 'lines',
				name: 'Líneas',
				color: '#8b5cf6',
				opacity: 0.2,
				patternType: 'lines',
				blendMode: 'overlay',
				animated: false,
				visibleOnHover: false,
				layerOrder: 1,
			},
			{
				id: 'grid',
				name: 'Cuadrícula',
				color: '#f59e0b',
				opacity: 0.15,
				patternType: 'grid',
				blendMode: 'overlay',
				animated: false,
				visibleOnHover: false,
				layerOrder: 1,
			},
			{
				id: 'waves',
				name: 'Ondas',
				color: '#06b6d4',
				opacity: 0.25,
				patternType: 'waves',
				blendMode: 'screen',
				animated: true,
				animationSpeed: 0.5,
				visibleOnHover: false,
				layerOrder: 1,
			},
			{
				id: 'noise',
				name: 'Ruido',
				color: '#9ca3af',
				opacity: 0.3,
				patternType: 'noise',
				blendMode: 'overlay',
				animated: true,
				animationSpeed: 0.2,
				visibleOnHover: false,
				noiseType: 'light',
				density: 0.7,
				contrast: 1.2,
				layerOrder: 1,
			},
			{
				id: 'diagonal',
				name: 'Diagonal',
				color: '#ef4444',
				opacity: 0.18,
				patternType: 'diagonal',
				blendMode: 'overlay',
				animated: false,
				visibleOnHover: false,
				layerOrder: 1,
			},
			{
				id: 'holographic',
				name: 'Holográfico',
				color: '#3b82f6',
				opacity: 0.4,
				patternType: 'grid',
				blendMode: 'screen',
				animated: true,
				animationSpeed: 0.8,
				visibleOnHover: true,
				layerOrder: 3,
			},
		];

		// Verificar si ya existen presets para no duplicarlos
		const existingIds = new Set(textureSystem.textures.map((t) => t.id));
		const newPresets = presets.filter((p) => !existingIds.has(p.id));

		if (newPresets.length === 0) {
			toastService.info('Los presets ya están agregados');
			return;
		}

		setTextureSystem((prev) => ({
			...prev,
			textures: [...prev.textures, ...newPresets],
		}));

		toastService.success(`Se agregaron ${newPresets.length} presets de texturas`);
	};

	// Función para agregar previsualización
	const handlePreviewTexture = (texture: TextureItem) => {
		if (onTextureSelect) {
			const textureConfig: TextureConfig = {
				name: texture.name,
				patternType: texture.patternType || 'none',
				imageUrl: texture.imageUrl,
				color: texture.color,
				opacity: texture.opacity,
				scale: texture.scale,
				blend: texture.blendMode,
			};
			onTextureSelect(textureConfig);
			toastService.success(`Textura "${texture.name}" aplicada`);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Palette className="h-4 w-4 text-primary" />
					<h3 className="text-sm font-medium">Sistema de texturas</h3>
				</div>
				<Switch checked={textureSystem.enabled} onCheckedChange={handleEnabledChange} />
			</div>

			<div className={textureSystem.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
				<div className="flex justify-between mb-2">
					<div className="flex gap-2">
						<Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAddTexture}>
							<Plus className="h-3.5 w-3.5 mr-1" /> Agregar
						</Button>

						<Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAddPresets}>
							<Palette className="h-3.5 w-3.5 mr-1" /> Presets
						</Button>
					</div>

					<Button
						variant="default"
						size="sm"
						className="text-xs h-7"
						onClick={handleSaveTextureSystem}
						disabled={isSaving}
					>
						<Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? 'Guardando...' : 'Guardar'}
					</Button>
				</div>

				<TextureList
					textures={textureSystem.textures}
					onEditTexture={handleEditTexture}
					onDeleteTexture={handleDeleteTexture}
					onPreviewTexture={handlePreviewTexture}
				/>

				<div className="mt-2 text-xs text-muted-foreground">
					<p className="italic">Las texturas pueden aplicarse a las entidades para darles un aspecto único.</p>
				</div>
			</div>

			{/* Diálogo de edición de textura */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{currentTexture?.id ? 'Editar textura' : 'Nueva textura'}</DialogTitle>
						<DialogDescription>
							{currentTexture?.id
								? 'Actualiza los detalles de la textura existente'
								: 'Crea una nueva textura para usar en tus tarjetas'}
						</DialogDescription>
					</DialogHeader>

					<TextureEditor
						texture={currentTexture}
						svgPatterns={svgPatterns}
						onSave={handleSaveTexture}
						onCancel={() => setEditDialogOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
