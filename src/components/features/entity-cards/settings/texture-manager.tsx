'use client';

import {
	type TextureSystem,
	getEntityTextureSystem,
	saveEntityTextureSystem,
} from '@/app/actions/entities-cards/entities-cards.actions';
import type { TextureConfig } from '@/components/features/entity-cards/base/base-card-types';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toastService } from '@/lib/services/toast.service';
import { AlertTriangle, Edit, Eye, ImagePlus, Palette, Plus, Save, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';

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

	// Estado para previsualización de textura actual
	const [previewSvg, setPreviewSvg] = React.useState<string>('');

	// Lista de patrones SVG predefinidos
	const svgPatterns = React.useMemo(
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
		};

		// Actualizar el estado
		setTextureSystem((prev) => ({
			...prev,
			textures: [...prev.textures, newTexture],
		}));

		// Abrir el diálogo de edición
		setCurrentTexture(newTexture);
		setEditDialogOpen(true);
	};

	// Función para editar una textura
	const handleEditTexture = (texture: TextureItem) => {
		setCurrentTexture(texture);
		setEditDialogOpen(true);
		generatePatternPreview(texture);
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
	const handleSaveTexture = () => {
		if (!currentTexture?.name || !currentTexture?.color) {
			toastService.warning('El nombre y el color son obligatorios');
			return;
		}

		// Actualizar textura con el patrón seleccionado
		const updatedTexture: TextureItem = {
			...currentTexture,
			patternType: currentTexture.patternType || 'none',
			opacity: currentTexture.opacity || 0.5,
		};

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
			},
			{
				id: 'dots',
				name: 'Puntos',
				color: '#3b82f6',
				opacity: 0.2,
				patternType: 'dots',
			},
			{
				id: 'lines',
				name: 'Líneas',
				color: '#8b5cf6',
				opacity: 0.2,
				patternType: 'lines',
			},
			{
				id: 'grid',
				name: 'Cuadrícula',
				color: '#f59e0b',
				opacity: 0.15,
				patternType: 'grid',
			},
			{
				id: 'waves',
				name: 'Ondas',
				color: '#06b6d4',
				opacity: 0.25,
				patternType: 'waves',
			},
			{
				id: 'noise',
				name: 'Ruido',
				color: '#9ca3af',
				opacity: 0.3,
				patternType: 'noise',
			},
			{
				id: 'circles',
				name: 'Círculos',
				color: '#ec4899',
				opacity: 0.2,
				patternType: 'circles',
			},
			{
				id: 'squares',
				name: 'Cuadrados',
				color: '#10b981',
				opacity: 0.2,
				patternType: 'squares',
			},
			{
				id: 'diagonal',
				name: 'Diagonal',
				color: '#ef4444',
				opacity: 0.18,
				patternType: 'diagonal',
			},
			{
				id: 'chevron',
				name: 'Chevron',
				color: '#eab308',
				opacity: 0.22,
				patternType: 'chevron',
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

	// Obtener el color con opacidad para la vista previa
	const getColorWithOpacity = (color: string, opacity: number) => {
		// Si el color es en formato hex (#RRGGBB), convertirlo a rgba
		if (color.startsWith('#')) {
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	};

	// Obtener estilo del patrón para la vista previa
	const getPatternStyle = (patternType?: string, color?: string, opacity = 0.5) => {
		const colorWithOpacity = color ? getColorWithOpacity(color, opacity) : 'rgba(59, 130, 246, 0.5)';

		switch (patternType) {
			case 'dots':
				return {
					backgroundImage: `radial-gradient(${colorWithOpacity} 1px, transparent 1px)`,
					backgroundSize: '8px 8px',
				};
			case 'lines':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: '10px 10px',
				};
			case 'grid':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px),
                             linear-gradient(90deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: '10px 10px',
				};
			case 'waves':
				return {
					background: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorWithOpacity} 6px, transparent 10px)`,
				};
			case 'noise':
				return {
					backgroundColor: colorWithOpacity,
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
					backgroundBlendMode: 'overlay',
				};
			case 'circles':
				return {
					backgroundImage: `radial-gradient(circle at 50% 50%, ${colorWithOpacity} 20%, transparent 25%)`,
					backgroundSize: '20px 20px',
				};
			case 'squares':
				return {
					backgroundImage: `linear-gradient(0deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px),
                             linear-gradient(90deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px)`,
					backgroundSize: '15px 15px',
				};
			case 'diagonal':
				return {
					backgroundImage: `repeating-linear-gradient(45deg, ${colorWithOpacity}, ${colorWithOpacity} 1px, transparent 1px, transparent 10px)`,
				};
			case 'chevron':
				return {
					backgroundImage: `
            linear-gradient(135deg, ${colorWithOpacity} 25%, transparent 25%),
            linear-gradient(225deg, ${colorWithOpacity} 25%, transparent 25%)
          `,
					backgroundSize: '20px 20px',
				};
			default:
				return {
					backgroundColor: opacity > 0 ? colorWithOpacity : 'transparent',
				};
		}
	};

	// Función para generar la vista previa de la textura actual
	const generatePatternPreview = React.useCallback(
		(texture: TextureItem) => {
			if (!texture || !texture.patternType) {
				setPreviewSvg('');
				return;
			}

			const pattern = svgPatterns.find((p) => p.id === texture.patternType);
			if (!pattern) {
				setPreviewSvg('');
				return;
			}

			// Reemplazar currentColor con el color real
			const coloredSvg = pattern.svg.replace(/currentColor/g, texture.color || '#000000');
			setPreviewSvg(coloredSvg);
		},
		[svgPatterns]
	);

	// Actualizar vista previa cuando cambia la textura actual
	React.useEffect(() => {
		if (currentTexture) {
			generatePatternPreview(currentTexture);
		}
	}, [currentTexture, generatePatternPreview]);

	// Añadir manejador para vista previa
	const handlePreviewTexture = (texture: TextureItem) => {
		if (onTextureSelect) {
			const textureConfig: TextureConfig = {
				name: texture.name,
				patternType: texture.patternType,
				imageUrl: texture.imageUrl,
				color: texture.color,
				opacity: texture.opacity,
			};
			onTextureSelect(textureConfig);
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

				<div className="bg-card border rounded-md">
					{textureSystem.textures.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay texturas definidas</p>
							<p className="text-xs mt-1">Agrega texturas o usa los presets predefinidos</p>
						</div>
					) : (
						<ScrollArea className="h-64">
							<div className="divide-y">
								{textureSystem.textures.map((texture) => (
									<div key={texture.id} className="p-2 flex items-center justify-between gap-2">
										<div className="flex items-center gap-2 flex-1">
											<div
												className="w-6 h-6 rounded border"
												style={getPatternStyle(texture.patternType, texture.color, texture.opacity)}
											/>
											<span className="text-sm">{texture.name}</span>
										</div>

										<div className="flex gap-1 items-center">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => handleEditTexture(texture)}
											>
												<Edit className="h-3.5 w-3.5" />
											</Button>

											<Button
												size="icon"
												variant="ghost"
												onClick={() => handlePreviewTexture(texture)}
												title="Vista previa"
											>
												<Eye className="h-4 w-4" />
											</Button>

											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
														<Trash className="h-3.5 w-3.5" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Eliminar textura</AlertDialogTitle>
														<AlertDialogDescription>
															¿Estás seguro de que deseas eliminar esta textura? Esta acción no se puede deshacer.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction onClick={() => handleDeleteTexture(texture.id)}>
															Eliminar
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					)}
				</div>

				<div className="mt-2 text-xs text-muted-foreground">
					<p className="italic">Las texturas pueden aplicarse a las entidades para darles un aspecto único.</p>
				</div>
			</div>

			{/* Diálogo de edición de textura */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{currentTexture?.id ? 'Editar textura' : 'Nueva textura'}</DialogTitle>
						<DialogDescription>
							{currentTexture?.id
								? 'Actualiza los detalles de la textura existente'
								: 'Crea una nueva textura para usar en tus tarjetas'}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4">
						<div className="space-y-2">
							<Label htmlFor="texture-name">Nombre</Label>
							<Input
								id="texture-name"
								value={currentTexture?.name || ''}
								onChange={(e) =>
									setCurrentTexture((prev) => {
										if (!prev) {
											return {
												id: `texture-${Date.now()}`,
												name: e.target.value,
												color: '#000000',
												opacity: 0.5,
											};
										}
										return {
											...prev,
											name: e.target.value,
										};
									})
								}
								placeholder="Nombre de la textura"
							/>
						</div>

						{/* Vista previa de la textura */}
						<div className="mt-2">
							<Label>Vista previa</Label>
							<div
								className="w-full aspect-video rounded-md border mt-1 flex items-center justify-center"
								style={{
									backgroundColor: currentTexture?.color || '#ffffff',
									opacity: currentTexture?.opacity || 1,
									backgroundImage: previewSvg
										? `url('data:image/svg+xml;utf8,${encodeURIComponent(previewSvg)}')`
										: undefined,
									backgroundSize: '20px 20px',
								}}
							>
								{!previewSvg && <div className="text-sm text-muted-foreground">Selecciona un patrón</div>}
							</div>
						</div>

						{/* Selector de patrón SVG */}
						<div className="space-y-2">
							<Label htmlFor="pattern-type">Tipo de Patrón</Label>
							<div className="grid grid-cols-3 gap-2">
								{svgPatterns.map((pattern) => (
									<Button
										key={pattern.id}
										type="button"
										variant={currentTexture?.patternType === pattern.id ? 'default' : 'outline'}
										className="aspect-square p-0 flex items-center justify-center"
										onClick={() => {
											setCurrentTexture((prev) => {
												if (!prev) {
													return {
														id: `texture-${Date.now()}`,
														name: 'Nueva textura',
														color: '#000000',
														opacity: 0.5,
														patternType: pattern.id,
													};
												}
												return {
													...prev,
													patternType: pattern.id,
												};
											});
										}}
									>
										<div className="w-full h-full">{pattern.renderSvg(currentTexture?.color || '#000000')}</div>
									</Button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="texture-color">Color</Label>
							<div className="flex gap-2">
								<Input
									id="texture-color"
									type="color"
									className="w-12"
									value={currentTexture?.color || '#000000'}
									onChange={(e) =>
										setCurrentTexture((prev) => {
											if (!prev) {
												return {
													id: `texture-${Date.now()}`,
													name: 'Nueva textura',
													color: e.target.value,
													opacity: 0.5,
												};
											}
											return {
												...prev,
												color: e.target.value,
											};
										})
									}
								/>
								<Input
									value={currentTexture?.color || '#000000'}
									onChange={(e) =>
										setCurrentTexture((prev) => {
											if (!prev) {
												return {
													id: `texture-${Date.now()}`,
													name: 'Nueva textura',
													color: e.target.value,
													opacity: 0.5,
												};
											}
											return {
												...prev,
												color: e.target.value,
											};
										})
									}
									placeholder="Color (hex)"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between">
								<Label htmlFor="texture-opacity">Opacidad: {currentTexture?.opacity?.toFixed(2) || '0.50'}</Label>
							</div>
							<Slider
								id="texture-opacity"
								min={0}
								max={1}
								step={0.05}
								value={[currentTexture?.opacity || 0.5]}
								onValueChange={(values) =>
									setCurrentTexture((prev) => {
										if (!prev) {
											return {
												id: `texture-${Date.now()}`,
												name: 'Nueva textura',
												color: '#000000',
												opacity: values[0],
											};
										}
										return {
											...prev,
											opacity: values[0],
										};
									})
								}
							/>
						</div>

						{/* Editor de código SVG */}
						<details className="mt-2">
							<summary className="cursor-pointer text-sm font-medium">Editor SVG avanzado</summary>
							<div className="space-y-2 mt-2">
								<Label htmlFor="custom-svg">Código SVG personalizado</Label>
								<textarea
									id="custom-svg"
									className="w-full h-24 p-2 border rounded-md font-mono text-xs"
									value={previewSvg}
									onChange={(e) => {
										setPreviewSvg(e.target.value);
										// En una implementación real, guardaríamos este SVG personalizado
										// en los datos de la textura
									}}
									placeholder="<svg>...</svg>"
								/>
								<p className="text-xs text-muted-foreground">
									Edita el código SVG directamente. Ten en cuenta que esto es para usuarios avanzados.
								</p>
							</div>
						</details>

						<div className="space-y-2">
							<Label htmlFor="texture-description">Descripción (opcional)</Label>
							<Input
								id="texture-description"
								value={currentTexture?.description || ''}
								onChange={(e) =>
									setCurrentTexture((prev) => {
										if (!prev) {
											return {
												id: `texture-${Date.now()}`,
												name: 'Nueva textura',
												color: '#000000',
												opacity: 0.5,
												description: e.target.value,
											};
										}
										return {
											...prev,
											description: e.target.value,
										};
									})
								}
								placeholder="Descripción breve..."
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleSaveTexture}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
