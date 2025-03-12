'use client';

import {
	type RarityItem,
	type RaritySystem,
	type TextureItem,
	type TextureSystem,
	getEntityRaritySystem,
	getEntityTextureSystem,
	saveEntityRaritySystem,
} from '@/app/actions/entities-cards/entities-cards.actions';
import type { RarityConfig } from '@/components/features/entity-cards/base/base-card-types';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toastService } from '@/lib/services/toast.service';
import { AlertTriangle, Award, Edit, Eye, MoveVertical, Plus, Save, Trash } from 'lucide-react';
import { BadgeCheck, CircleX, PaintBucket, PlusCircle, Star, Trash2 } from 'lucide-react';
import { Reorder, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';

interface RarityManagerProps {
	entityType: string;
	onRaritiesChange?: (rarities: RaritySystem) => void;
	onRaritySelect?: (rarity: RarityConfig) => void;
}

// Interfaz para el tipo de rareza actual en edición
interface CurrentRarityItem {
	id: string;
	name: string;
	color: string;
	borderEffect?: string;
	glowColor?: string;
	description?: string;
	position?: number;
	chance?: number;
	textureId?: string;
}

export function RarityManager({ entityType, onRaritiesChange, onRaritySelect }: RarityManagerProps) {
	// Estado para el sistema de rarezas
	const [raritySystem, setRaritySystem] = useState<RaritySystem>({
		enabled: true,
		rarities: [],
		entityType,
	});

	// Estado para la rareza seleccionada
	const [selectedRarityId, setSelectedRarityId] = useState<string | null>(null);

	// Estado para indicar si está guardando
	const [isSaving, setIsSaving] = useState(false);

	// Estado para el diálogo de edición
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentRarity, setCurrentRarity] = useState<CurrentRarityItem | null>(null);

	// Estado para modo de configuración (manual o automático)
	const [configMode, setConfigMode] = React.useState<'manual' | 'auto'>('manual');

	// Estado para texturas disponibles
	const [availableTextures, setAvailableTextures] = React.useState<TextureItem[]>([]);

	// Cargar el sistema de rarezas
	const loadRaritySystem = useCallback(async () => {
		try {
			const response = await getEntityRaritySystem(entityType);

			if (response.success && response.data) {
				const loadedSystem = response.data as RaritySystem;
				setRaritySystem(loadedSystem);

				// Notificar al componente padre
				onRaritiesChange?.(loadedSystem);

				// Seleccionar la primera rareza si existe
				if (loadedSystem.rarities.length > 0) {
					const firstRarity = loadedSystem.rarities[0];
					setSelectedRarityId(firstRarity.id);
					onRaritySelect?.({
						name: firstRarity.name,
						color: firstRarity.color,
						borderEffect: firstRarity.borderEffect,
						glowColor: firstRarity.glowColor,
					});
				} else {
					// Crear un sistema de rarezas básico
					const basicSystem: RaritySystem = {
						enabled: true,
						rarities: [
							{
								id: 'common',
								name: 'Común',
								color: '#64748b',
								borderEffect: 'solid',
								position: 0,
								chance: 60,
								entityType,
							},
							{
								id: 'uncommon',
								name: 'Poco común',
								color: '#10b981',
								borderEffect: 'solid',
								glowColor: '#10b98133',
								position: 1,
								chance: 25,
								entityType,
							},
							{
								id: 'rare',
								name: 'Raro',
								color: '#3b82f6',
								borderEffect: 'animated',
								glowColor: '#3b82f640',
								position: 2,
								chance: 10,
								entityType,
							},
							{
								id: 'epic',
								name: 'Épico',
								color: '#8b5cf6',
								borderEffect: 'animated',
								glowColor: '#8b5cf650',
								position: 3,
								chance: 4,
								entityType,
							},
							{
								id: 'legendary',
								name: 'Legendario',
								color: '#f59e0b',
								borderEffect: 'animated',
								glowColor: '#f59e0b60',
								position: 4,
								chance: 1,
								entityType,
							},
						],
						entityType,
					};

					setRaritySystem(basicSystem);
					onRaritiesChange?.(basicSystem);

					// Seleccionar la primera rareza
					setSelectedRarityId('common');
					onRaritySelect?.({
						name: 'Común',
						color: '#64748b',
						borderEffect: 'solid',
					});
				}
			}
		} catch (error) {
			console.error('Error al cargar el sistema de rarezas:', error);
			toastService.error('No se pudo cargar el sistema de rarezas.');
		}
	}, [entityType, onRaritySelect, onRaritiesChange]);

	// Cargar rarezas al montar el componente
	useEffect(() => {
		loadRaritySystem();
	}, [loadRaritySystem]);

	// Guardar el sistema de rarezas
	const handleSaveRaritySystem = async () => {
		try {
			setIsSaving(true);
			const response = await saveEntityRaritySystem(entityType, raritySystem);

			if (response.success) {
				toastService.success('Sistema de rarezas guardado correctamente');
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error('Error al guardar el sistema de rarezas:', error);
			toastService.error('No se pudo guardar el sistema de rarezas');
		} finally {
			setIsSaving(false);
		}
	};

	// Seleccionar una rareza
	const handleSelectRarity = (rarityId: string) => {
		setSelectedRarityId(rarityId);

		const rarity = raritySystem.rarities.find((r) => r.id === rarityId);
		if (rarity) {
			onRaritySelect?.({
				name: rarity.name,
				color: rarity.color,
				borderEffect: rarity.borderEffect,
				glowColor: rarity.glowColor,
			});
		}
	};

	// Agregar una nueva rareza
	const handleAddRarity = () => {
		const id = `rarity-${Date.now()}`;
		const newRarity: RarityItem = {
			id,
			name: 'Nueva Rareza',
			color: '#6366f1',
			borderEffect: 'solid',
			position: raritySystem.rarities.length,
			chance: 5,
			entityType,
		};

		const updatedRarities = [...raritySystem.rarities, newRarity];
		const updatedSystem = { ...raritySystem, rarities: updatedRarities };

		setRaritySystem(updatedSystem);
		onRaritiesChange?.(updatedSystem);
		setSelectedRarityId(id);

		onRaritySelect?.({
			name: newRarity.name,
			color: newRarity.color,
			borderEffect: newRarity.borderEffect,
		});
	};

	// Eliminar una rareza
	const handleDeleteRarity = (rarityId: string) => {
		const updatedRarities = raritySystem.rarities.filter((r) => r.id !== rarityId);

		// Actualizar posiciones
		const reorderedRarities = updatedRarities.map((r, index) => ({
			...r,
			position: index,
		}));

		const updatedSystem = { ...raritySystem, rarities: reorderedRarities };
		setRaritySystem(updatedSystem);
		onRaritiesChange?.(updatedSystem);

		// Si se eliminó la rareza seleccionada, seleccionar otra
		if (rarityId === selectedRarityId && reorderedRarities.length > 0) {
			setSelectedRarityId(reorderedRarities[0].id);
			onRaritySelect?.({
				name: reorderedRarities[0].name,
				color: reorderedRarities[0].color,
				borderEffect: reorderedRarities[0].borderEffect,
				glowColor: reorderedRarities[0].glowColor,
			});
		} else if (reorderedRarities.length === 0) {
			setSelectedRarityId(null);
		}
	};

	// Ordenar rarezas por posición
	const sortedRarities = [...raritySystem.rarities].sort((a, b) => a.position - b.position);

	// Función para distribuir las rarezas uniformemente
	const handleDistributeRarities = () => {
		const count = raritySystem.rarities.length;

		if (count < 2) {
			toastService.warning('Se necesitan al menos 2 rarezas para distribuir');
			return;
		}

		// Actualizar colores creando un degradado
		const updatedRarities = raritySystem.rarities.map((rarity, index) => {
			// Desde gris (común) hasta naranja/dorado (legendario)
			let color = '#9ca3af'; // gris para común

			if (count > 1) {
				if (index === 0) {
					color = '#9ca3af'; // común - gris
				} else if (index === count - 1) {
					color = '#f59e0b'; // legendario - naranja/dorado
				} else if (index === 1 && count > 2) {
					color = '#10b981'; // poco común - verde
				} else if (index === 2 && count > 3) {
					color = '#3b82f6'; // raro - azul
				} else if (index === 3 && count > 4) {
					color = '#8b5cf6'; // épico - morado
				} else {
					// Interpolar colores para rarezas intermedias
					const t = index / (count - 1);
					const r = Math.round(155 + t * 100);
					const g = Math.round(150 - t * 50);
					const b = Math.round(246 - t * 100);
					color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
				}
			}

			return {
				...rarity,
				position: index,
				color,
				// Agregar efecto especial para rarezas altas
				borderEffect: index >= count - 2 ? 'animated' : undefined,
				glowColor: index === count - 1 ? '#f97316' : undefined,
			};
		});

		setRaritySystem((prev) => ({
			...prev,
			rarities: updatedRarities,
		}));
	};

	// Función para cargar texturas disponibles
	const loadTextures = useCallback(async () => {
		try {
			const response = await getEntityTextureSystem(entityType);
			if (response.success && response.data) {
				const textureSystem = response.data as TextureSystem;
				setAvailableTextures(textureSystem.textures || []);
			}
		} catch (error) {
			console.error('Error loading textures:', error);
		}
	}, [entityType]);

	// Cargar textures al inicio
	useEffect(() => {
		loadTextures();
	}, [loadTextures]);

	// Manejador para cambiar modo de configuración
	const handleConfigModeChange = (mode: 'manual' | 'auto') => {
		setConfigMode(mode);

		// Si cambiamos a modo automático, distribuir rarezas automáticamente
		if (mode === 'auto') {
			handleDistributeRarities();
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Award className="h-4 w-4 text-primary" />
					<h3 className="text-sm font-medium">Sistema de rarezas</h3>
				</div>
				<Switch
					checked={raritySystem.enabled}
					onCheckedChange={(enabled) => {
						setRaritySystem((prev) => ({
							...prev,
							enabled,
						}));
					}}
				/>
			</div>

			<div className={raritySystem.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
				<div className="flex justify-between mb-2">
					<Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAddRarity}>
						<Plus className="h-3.5 w-3.5 mr-1" /> Agregar Rareza
					</Button>

					<div className="flex gap-2">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="outline" size="sm" className="text-xs h-7">
									<MoveVertical className="h-3.5 w-3.5 mr-1" /> Distribuir
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Distribuir rarezas</AlertDialogTitle>
									<AlertDialogDescription>
										Esto distribuirá las rarezas uniformemente y asignará colores adecuados para cada nivel. Los cambios
										no guardados se perderán.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction onClick={handleDistributeRarities}>Distribuir</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button
							variant="default"
							size="sm"
							className="text-xs h-7"
							onClick={handleSaveRaritySystem}
							disabled={isSaving}
						>
							<Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? 'Guardando...' : 'Guardar'}
						</Button>
					</div>
				</div>

				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-2">
						<Label htmlFor="config-mode">Modo de configuración:</Label>
						<Select value={configMode} onValueChange={(value) => handleConfigModeChange(value as 'manual' | 'auto')}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="manual">Manual</SelectItem>
								<SelectItem value="auto">Automático</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{configMode === 'auto' && (
						<Button variant="outline" size="sm" onClick={handleDistributeRarities}>
							Redistribuir
						</Button>
					)}
				</div>

				<div className="bg-card border rounded-md">
					{raritySystem.rarities.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay rarezas definidas</p>
							<p className="text-xs mt-1">Agrega rarezas para categorizar elementos</p>
						</div>
					) : (
						<ScrollArea className="h-64">
							<Reorder.Group
								axis="y"
								values={sortedRarities}
								onReorder={(reorderedItems) => {
									setRaritySystem((prev) => ({
										...prev,
										rarities: reorderedItems.map((item, index) => ({
											...item,
											position: index,
										})),
									}));
								}}
								className="divide-y"
							>
								{sortedRarities.map((rarity) => (
									<Reorder.Item key={rarity.id} value={rarity} className="p-2">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 flex-1">
												<div className="w-4 h-4 rounded-full border" style={{ backgroundColor: rarity.color }} />
												<span className="text-sm">{rarity.name}</span>
											</div>

											<div className="flex gap-1 items-center">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => {
														handleDeleteRarity(rarity.id);
													}}
												>
													<Trash className="h-3.5 w-3.5" />
												</Button>

												<Button
													size="icon"
													variant="ghost"
													onClick={() => {
														handleSelectRarity(rarity.id);
													}}
													title="Editar"
												>
													<Edit className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									</Reorder.Item>
								))}
							</Reorder.Group>
						</ScrollArea>
					)}
				</div>

				<div className="mt-2 text-xs text-muted-foreground">
					<p className="italic">Las rarezas se distribuirán automáticamente entre tus elementos.</p>
					<p className="mt-1">Consejo: Ordena las rarezas de menor a mayor importancia (de arriba a abajo).</p>
				</div>
			</div>

			{/* Diálogo de edición de rareza */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{currentRarity?.id ? 'Editar Rareza' : 'Nueva Rareza'}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								id="name"
								value={currentRarity?.name || ''}
								onChange={(e) => setCurrentRarity((prev) => (prev ? { ...prev, name: e.target.value } : null))}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<div className="flex gap-2">
								<div className="w-8 h-8 rounded border" style={{ backgroundColor: currentRarity?.color }} />
								<Input
									id="color"
									value={currentRarity?.color || ''}
									onChange={(e) => setCurrentRarity((prev) => (prev ? { ...prev, color: e.target.value } : null))}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="glowColor">Color de brillo (opcional)</Label>
							<div className="flex gap-2">
								<div
									className="w-8 h-8 rounded border"
									style={{
										backgroundColor: currentRarity?.glowColor || 'transparent',
									}}
								/>
								<Input
									id="glowColor"
									value={currentRarity?.glowColor || ''}
									onChange={(e) => setCurrentRarity((prev) => (prev ? { ...prev, glowColor: e.target.value } : null))}
									placeholder="ej. #f97316"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="borderEffect">Efecto de borde</Label>
							<Select
								value={currentRarity?.borderEffect || 'none'}
								onValueChange={(value: string) =>
									setCurrentRarity((prev) =>
										prev
											? {
													...prev,
													borderEffect: value === 'none' ? undefined : value,
												}
											: null
									)
								}
							>
								<SelectTrigger id="borderEffect" className="w-full">
									<SelectValue placeholder="Seleccionar efecto" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Ninguno</SelectItem>
									<SelectItem value="animated">Animado</SelectItem>
									<SelectItem value="glow">Brillo</SelectItem>
									<SelectItem value="pulse">Pulso</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="chance">Probabilidad (%)</Label>
							<Input
								id="chance"
								type="number"
								min="1"
								max="100"
								value={currentRarity?.chance?.toString() || '10'}
								onChange={(e) =>
									setCurrentRarity((prev) => (prev ? { ...prev, chance: Number(e.target.value) } : null))
								}
							/>
							<p className="text-xs text-muted-foreground">Probabilidad de aparición relativa de esta rareza</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción (opcional)</Label>
							<Input
								id="description"
								value={currentRarity?.description || ''}
								onChange={(e) => setCurrentRarity((prev) => (prev ? { ...prev, description: e.target.value } : null))}
								placeholder="Descripción corta de esta rareza"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="texture-id">Textura asociada</Label>
							<Select
								value={currentRarity?.textureId || ''}
								onValueChange={(value) =>
									setCurrentRarity((prev) =>
										prev
											? {
													...prev,
													textureId: value || undefined,
												}
											: null
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar textura" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Ninguna</SelectItem>
									{availableTextures.map((texture) => (
										<SelectItem key={texture.id} value={texture.id}>
											{texture.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancelar
						</Button>
						<Button
							onClick={() => {
								handleSaveRaritySystem();
								setEditDialogOpen(false);
							}}
						>
							Guardar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
