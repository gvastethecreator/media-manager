'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, deepMerge } from '@/lib/utils';
import { EntityType } from '@/types/entities';
import { Layers, PlusCircle, Settings2, Sparkles, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SystemConfig, SystemPanelProps } from './types';
import { useCategorySystem, useRaritySystem, useTextureSystem } from './use-system';

/**
 * 🧩 Panel de configuración del sistema para Entity Cards
 */
export function SystemPanel({ config, onChange, entityType }: SystemPanelProps) {
	const [activeTab, setActiveTab] = useState<string>('rarity');

	const handleConfigChange = (partialConfig: Partial<SystemConfig>) => {
		onChange(deepMerge(config, partialConfig) as SystemConfig);
	};

	return (
		<Card className="border shadow-sm">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle>Configuración del Sistema</CardTitle>
					{entityType && (
						<Badge variant="outline" className="text-xs">
							{entityType}
						</Badge>
					)}
				</div>
				<CardDescription>
					Configura los sistemas de rareza, texturas y categorías para las tarjetas de entidad.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="rarity" className="flex items-center gap-2">
							<Sparkles className="h-4 w-4" />
							<span className="hidden sm:inline">Rareza</span>
						</TabsTrigger>
						<TabsTrigger value="texture" className="flex items-center gap-2">
							<Layers className="h-4 w-4" />
							<span className="hidden sm:inline">Texturas</span>
						</TabsTrigger>
						<TabsTrigger value="category" className="flex items-center gap-2">
							<Tag className="h-4 w-4" />
							<span className="hidden sm:inline">Categorías</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="rarity" className="mt-4 space-y-4">
						<RarityPanel config={config} onChange={handleConfigChange} />
					</TabsContent>

					<TabsContent value="texture" className="mt-4 space-y-4">
						<TexturePanel config={config} onChange={handleConfigChange} />
					</TabsContent>

					<TabsContent value="category" className="mt-4 space-y-4">
						<CategoryPanel config={config} onChange={handleConfigChange} />
					</TabsContent>
				</Tabs>

				<div className="mt-6 pt-4 border-t">
					<EntityTypeConfigPanel config={config} onChange={handleConfigChange} entityType={entityType} />
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * 🧩 Panel de configuración de rareza
 */
function RarityPanel({
	config,
	onChange,
}: {
	config: SystemConfig;
	onChange: (config: Partial<SystemConfig>) => void;
}) {
	const { rarityConfig } = useRaritySystem();
	const [newRarityId, setNewRarityId] = useState('');
	const [newRarityName, setNewRarityName] = useState('');

	const handleRarityToggle = (enabled: boolean) => {
		onChange({ rarity: { ...config.rarity, enabled } });
	};

	const handleDefaultRarityChange = (defaultRarity: string) => {
		onChange({ rarity: { ...config.rarity, defaultRarity } });
	};

	const handleAddRarity = () => {
		if (!newRarityId || !newRarityName) return;

		const newRarity = {
			name: newRarityName,
			color: '#6366f1',
			borderColor: '#4f46e5',
			backgroundColor: '#eef2ff',
			textColor: '#3730a3',
			glowColor: '#a5b4fc',
			glowIntensity: 2,
		};

		onChange({
			rarity: {
				...config.rarity,
				customRarities: {
					...config.rarity.customRarities,
					[newRarityId]: newRarity,
				},
			},
		});

		setNewRarityId('');
		setNewRarityName('');
	};

	const handleRemoveRarity = (rarityId: string) => {
		const newCustomRarities = { ...config.rarity.customRarities };
		delete newCustomRarities[rarityId];

		// Si estamos eliminando la rareza por defecto, cambiamos a otra
		let newDefaultRarity = config.rarity.defaultRarity;
		if (rarityId === config.rarity.defaultRarity) {
			const firstAvailableRarity = Object.keys(newCustomRarities)[0];
			if (firstAvailableRarity) {
				newDefaultRarity = firstAvailableRarity;
			}
		}

		onChange({
			rarity: {
				...config.rarity,
				customRarities: newCustomRarities,
				defaultRarity: newDefaultRarity,
			},
		});
	};

	const handleUpdateRarityProperty = (rarityId: string, property: string, value: any) => {
		onChange({
			rarity: {
				...config.rarity,
				customRarities: {
					...config.rarity.customRarities,
					[rarityId]: {
						...config.rarity.customRarities[rarityId],
						[property]: value,
					},
				},
			},
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<h3 className="text-base font-medium">Sistema de Rareza</h3>
					<p className="text-sm text-muted-foreground">Configura diferentes niveles de rareza para las entidades.</p>
				</div>
				<Switch checked={config.rarity.enabled} onCheckedChange={handleRarityToggle} />
			</div>

			{config.rarity.enabled && (
				<>
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label>Rareza por defecto</Label>
							<Select value={config.rarity.defaultRarity} onValueChange={handleDefaultRarityChange}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una rareza" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(config.rarity.customRarities).map(([id, rarity]) => (
										<SelectItem key={id} value={id}>
											<div className="flex items-center gap-2">
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: rarity.color }} />
												{rarity.name}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Rarezas disponibles</Label>
							<Accordion type="multiple" className="w-full">
								{Object.entries(config.rarity.customRarities).map(([id, rarity]) => (
									<AccordionItem key={id} value={id} className="border px-3 rounded-md mb-2">
										<AccordionTrigger className="py-2 hover:no-underline">
											<div className="flex items-center gap-2">
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: rarity.color }} />
												<span>{rarity.name}</span>
												{config.rarity.defaultRarity === id && (
													<Badge variant="outline" className="ml-2 text-xs">
														Por defecto
													</Badge>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="pb-3 pt-1">
											<div className="space-y-3">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1">
														<Label className="text-xs">Color principal</Label>
														<div className="flex gap-2">
															<div className="w-8 h-8 rounded border" style={{ backgroundColor: rarity.color }} />
															<Input
																type="text"
																value={rarity.color}
																onChange={(e) => handleUpdateRarityProperty(id, 'color', e.target.value)}
																className="w-full"
															/>
														</div>
													</div>
													<div className="space-y-1">
														<Label className="text-xs">Color de borde</Label>
														<div className="flex gap-2">
															<div className="w-8 h-8 rounded border" style={{ backgroundColor: rarity.borderColor }} />
															<Input
																type="text"
																value={rarity.borderColor}
																onChange={(e) => handleUpdateRarityProperty(id, 'borderColor', e.target.value)}
																className="w-full"
															/>
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1">
														<Label className="text-xs">Color de fondo</Label>
														<div className="flex gap-2">
															<div
																className="w-8 h-8 rounded border"
																style={{ backgroundColor: rarity.backgroundColor }}
															/>
															<Input
																type="text"
																value={rarity.backgroundColor}
																onChange={(e) => handleUpdateRarityProperty(id, 'backgroundColor', e.target.value)}
																className="w-full"
															/>
														</div>
													</div>
													<div className="space-y-1">
														<Label className="text-xs">Color de texto</Label>
														<div className="flex gap-2">
															<div className="w-8 h-8 rounded border" style={{ backgroundColor: rarity.textColor }} />
															<Input
																type="text"
																value={rarity.textColor}
																onChange={(e) => handleUpdateRarityProperty(id, 'textColor', e.target.value)}
																className="w-full"
															/>
														</div>
													</div>
												</div>

												<div className="space-y-1">
													<Label className="text-xs">Color de brillo</Label>
													<div className="flex gap-2">
														<div className="w-8 h-8 rounded border" style={{ backgroundColor: rarity.glowColor }} />
														<Input
															type="text"
															value={rarity.glowColor}
															onChange={(e) => handleUpdateRarityProperty(id, 'glowColor', e.target.value)}
															className="w-full"
														/>
													</div>
												</div>

												<div className="space-y-1">
													<div className="flex items-center justify-between">
														<Label className="text-xs">Intensidad de brillo</Label>
														<span className="text-xs text-muted-foreground">{rarity.glowIntensity}</span>
													</div>
													<Slider
														value={[rarity.glowIntensity]}
														min={0}
														max={10}
														step={1}
														onValueChange={(value) => handleUpdateRarityProperty(id, 'glowIntensity', value[0])}
													/>
												</div>

												<Button
													variant="destructive"
													size="sm"
													className="mt-2 w-full"
													onClick={() => handleRemoveRarity(id)}
													disabled={Object.keys(config.rarity.customRarities).length <= 1}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Eliminar rareza
												</Button>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>

						<div className="space-y-2 pt-2 border-t">
							<Label>Añadir nueva rareza</Label>
							<div className="grid grid-cols-2 gap-3 mb-2">
								<div>
									<Input
										placeholder="ID (ej: mythic)"
										value={newRarityId}
										onChange={(e) => setNewRarityId(e.target.value)}
									/>
								</div>
								<div>
									<Input
										placeholder="Nombre (ej: Mítico)"
										value={newRarityName}
										onChange={(e) => setNewRarityName(e.target.value)}
									/>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={handleAddRarity}
								disabled={!newRarityId || !newRarityName}
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Añadir rareza
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

/**
 * 🧩 Panel de configuración de texturas
 */
function TexturePanel({
	config,
	onChange,
}: {
	config: SystemConfig;
	onChange: (config: Partial<SystemConfig>) => void;
}) {
	const { textureConfig } = useTextureSystem();
	const [newTextureId, setNewTextureId] = useState('');
	const [newTextureName, setNewTextureName] = useState('');
	const [newTextureUrl, setNewTextureUrl] = useState('');

	const handleTextureToggle = (enabled: boolean) => {
		onChange({ texture: { ...config.texture, enabled } });
	};

	const handleDefaultTextureChange = (defaultTexture: string) => {
		onChange({ texture: { ...config.texture, defaultTexture } });
	};

	const handleAddTexture = () => {
		if (!newTextureId || !newTextureName || !newTextureUrl) return;

		const newTexture = {
			name: newTextureName,
			url: newTextureUrl,
			opacity: 0.2,
			blendMode: 'overlay',
		};

		onChange({
			texture: {
				...config.texture,
				customTextures: {
					...config.texture.customTextures,
					[newTextureId]: newTexture,
				},
			},
		});

		setNewTextureId('');
		setNewTextureName('');
		setNewTextureUrl('');
	};

	const handleRemoveTexture = (textureId: string) => {
		const newCustomTextures = { ...config.texture.customTextures };
		delete newCustomTextures[textureId];

		// Si estamos eliminando la textura por defecto, cambiamos a otra
		let newDefaultTexture = config.texture.defaultTexture;
		if (textureId === config.texture.defaultTexture) {
			const firstAvailableTexture = Object.keys(newCustomTextures)[0];
			if (firstAvailableTexture) {
				newDefaultTexture = firstAvailableTexture;
			}
		}

		onChange({
			texture: {
				...config.texture,
				customTextures: newCustomTextures,
				defaultTexture: newDefaultTexture,
			},
		});
	};

	const handleUpdateTextureProperty = (textureId: string, property: string, value: any) => {
		onChange({
			texture: {
				...config.texture,
				customTextures: {
					...config.texture.customTextures,
					[textureId]: {
						...config.texture.customTextures[textureId],
						[property]: value,
					},
				},
			},
		});
	};

	const blendModes = [
		'normal',
		'multiply',
		'screen',
		'overlay',
		'darken',
		'lighten',
		'color-dodge',
		'color-burn',
		'hard-light',
		'soft-light',
		'difference',
		'exclusion',
		'hue',
		'saturation',
		'color',
		'luminosity',
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<h3 className="text-base font-medium">Sistema de Texturas</h3>
					<p className="text-sm text-muted-foreground">Configura texturas para aplicar a las tarjetas de entidad.</p>
				</div>
				<Switch checked={config.texture.enabled} onCheckedChange={handleTextureToggle} />
			</div>

			{config.texture.enabled && (
				<>
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label>Textura por defecto</Label>
							<Select value={config.texture.defaultTexture} onValueChange={handleDefaultTextureChange}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una textura" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(config.texture.customTextures).map(([id, texture]) => (
										<SelectItem key={id} value={id}>
											{texture.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Texturas disponibles</Label>
							<Accordion type="multiple" className="w-full">
								{Object.entries(config.texture.customTextures).map(([id, texture]) => (
									<AccordionItem key={id} value={id} className="border px-3 rounded-md mb-2">
										<AccordionTrigger className="py-2 hover:no-underline">
											<div className="flex items-center gap-2">
												<span>{texture.name}</span>
												{config.texture.defaultTexture === id && (
													<Badge variant="outline" className="ml-2 text-xs">
														Por defecto
													</Badge>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="pb-3 pt-1">
											<div className="space-y-3">
												<div className="space-y-1">
													<Label className="text-xs">URL de la textura</Label>
													<Input
														type="text"
														value={texture.url}
														onChange={(e) => handleUpdateTextureProperty(id, 'url', e.target.value)}
													/>
												</div>

												<div className="space-y-1">
													<div className="flex items-center justify-between">
														<Label className="text-xs">Opacidad</Label>
														<span className="text-xs text-muted-foreground">{texture.opacity}</span>
													</div>
													<Slider
														value={[texture.opacity * 100]}
														min={0}
														max={100}
														step={1}
														onValueChange={(value) => handleUpdateTextureProperty(id, 'opacity', value[0] / 100)}
													/>
												</div>

												<div className="space-y-1">
													<Label className="text-xs">Modo de mezcla</Label>
													<Select
														value={texture.blendMode}
														onValueChange={(value) => handleUpdateTextureProperty(id, 'blendMode', value)}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecciona un modo de mezcla" />
														</SelectTrigger>
														<SelectContent>
															{blendModes.map((mode) => (
																<SelectItem key={mode} value={mode}>
																	{mode}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<Button
													variant="destructive"
													size="sm"
													className="mt-2 w-full"
													onClick={() => handleRemoveTexture(id)}
													disabled={Object.keys(config.texture.customTextures).length <= 1}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Eliminar textura
												</Button>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>

						<div className="space-y-2 pt-2 border-t">
							<Label>Añadir nueva textura</Label>
							<div className="grid gap-3 mb-2">
								<div className="grid grid-cols-2 gap-3">
									<Input
										placeholder="ID (ej: wood)"
										value={newTextureId}
										onChange={(e) => setNewTextureId(e.target.value)}
									/>
									<Input
										placeholder="Nombre (ej: Madera)"
										value={newTextureName}
										onChange={(e) => setNewTextureName(e.target.value)}
									/>
								</div>
								<Input
									placeholder="URL (ej: /textures/wood.jpg)"
									value={newTextureUrl}
									onChange={(e) => setNewTextureUrl(e.target.value)}
								/>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={handleAddTexture}
								disabled={!newTextureId || !newTextureName || !newTextureUrl}
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Añadir textura
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

/**
 * 🧩 Panel de configuración de categorías
 */
function CategoryPanel({
	config,
	onChange,
}: {
	config: SystemConfig;
	onChange: (config: Partial<SystemConfig>) => void;
}) {
	const { categoryConfig } = useCategorySystem();
	const [newCategoryId, setNewCategoryId] = useState('');
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategoryIcon, setNewCategoryIcon] = useState('tag');
	const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

	const handleCategoryToggle = (enabled: boolean) => {
		onChange({ category: { ...config.category, enabled } });
	};

	const handleDefaultCategoryChange = (defaultCategory: string) => {
		onChange({ category: { ...config.category, defaultCategory } });
	};

	const handleAddCategory = () => {
		if (!newCategoryId || !newCategoryName) return;

		const newCategory = {
			name: newCategoryName,
			icon: newCategoryIcon,
			color: newCategoryColor,
		};

		onChange({
			category: {
				...config.category,
				customCategories: {
					...config.category.customCategories,
					[newCategoryId]: newCategory,
				},
			},
		});

		setNewCategoryId('');
		setNewCategoryName('');
		setNewCategoryIcon('tag');
		setNewCategoryColor('#6366f1');
	};

	const handleRemoveCategory = (categoryId: string) => {
		const newCustomCategories = { ...config.category.customCategories };
		delete newCustomCategories[categoryId];

		// Si estamos eliminando la categoría por defecto, cambiamos a otra
		let newDefaultCategory = config.category.defaultCategory;
		if (categoryId === config.category.defaultCategory) {
			const firstAvailableCategory = Object.keys(newCustomCategories)[0];
			if (firstAvailableCategory) {
				newDefaultCategory = firstAvailableCategory;
			}
		}

		onChange({
			category: {
				...config.category,
				customCategories: newCustomCategories,
				defaultCategory: newDefaultCategory,
			},
		});
	};

	const handleUpdateCategoryProperty = (categoryId: string, property: string, value: any) => {
		onChange({
			category: {
				...config.category,
				customCategories: {
					...config.category.customCategories,
					[categoryId]: {
						...config.category.customCategories[categoryId],
						[property]: value,
					},
				},
			},
		});
	};

	const iconOptions = [
		'tag',
		'star',
		'heart',
		'bookmark',
		'flag',
		'alert-circle',
		'check-circle',
		'x-circle',
		'info',
		'archive',
		'folder',
		'image',
		'video',
		'music',
		'file',
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<h3 className="text-base font-medium">Sistema de Categorías</h3>
					<p className="text-sm text-muted-foreground">Configura categorías para clasificar las entidades.</p>
				</div>
				<Switch checked={config.category.enabled} onCheckedChange={handleCategoryToggle} />
			</div>

			{config.category.enabled && (
				<>
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label>Categoría por defecto</Label>
							<Select value={config.category.defaultCategory} onValueChange={handleDefaultCategoryChange}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una categoría" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(config.category.customCategories).map(([id, category]) => (
										<SelectItem key={id} value={id}>
											<div className="flex items-center gap-2">
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
												{category.name}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Categorías disponibles</Label>
							<Accordion type="multiple" className="w-full">
								{Object.entries(config.category.customCategories).map(([id, category]) => (
									<AccordionItem key={id} value={id} className="border px-3 rounded-md mb-2">
										<AccordionTrigger className="py-2 hover:no-underline">
											<div className="flex items-center gap-2">
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
												<span>{category.name}</span>
												{config.category.defaultCategory === id && (
													<Badge variant="outline" className="ml-2 text-xs">
														Por defecto
													</Badge>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="pb-3 pt-1">
											<div className="space-y-3">
												<div className="space-y-1">
													<Label className="text-xs">Icono</Label>
													<Select
														value={category.icon}
														onValueChange={(value) => handleUpdateCategoryProperty(id, 'icon', value)}
													>
														<SelectTrigger>
															<SelectValue placeholder="Selecciona un icono" />
														</SelectTrigger>
														<SelectContent>
															{iconOptions.map((icon) => (
																<SelectItem key={icon} value={icon}>
																	{icon}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-1">
													<Label className="text-xs">Color</Label>
													<div className="flex gap-2">
														<div className="w-8 h-8 rounded border" style={{ backgroundColor: category.color }} />
														<Input
															type="text"
															value={category.color}
															onChange={(e) => handleUpdateCategoryProperty(id, 'color', e.target.value)}
															className="w-full"
														/>
													</div>
												</div>

												<Button
													variant="destructive"
													size="sm"
													className="mt-2 w-full"
													onClick={() => handleRemoveCategory(id)}
													disabled={Object.keys(config.category.customCategories).length <= 1}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Eliminar categoría
												</Button>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>

						<div className="space-y-2 pt-2 border-t">
							<Label>Añadir nueva categoría</Label>
							<div className="grid gap-3 mb-2">
								<div className="grid grid-cols-2 gap-3">
									<Input
										placeholder="ID (ej: project)"
										value={newCategoryId}
										onChange={(e) => setNewCategoryId(e.target.value)}
									/>
									<Input
										placeholder="Nombre (ej: Proyecto)"
										value={newCategoryName}
										onChange={(e) => setNewCategoryName(e.target.value)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un icono" />
										</SelectTrigger>
										<SelectContent>
											{iconOptions.map((icon) => (
												<SelectItem key={icon} value={icon}>
													{icon}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<div className="flex gap-2">
										<div className="w-8 h-8 rounded border" style={{ backgroundColor: newCategoryColor }} />
										<Input
											type="text"
											value={newCategoryColor}
											onChange={(e) => setNewCategoryColor(e.target.value)}
											className="w-full"
										/>
									</div>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={handleAddCategory}
								disabled={!newCategoryId || !newCategoryName}
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Añadir categoría
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

/**
 * 🧩 Panel de configuración para tipos de entidad
 */
function EntityTypeConfigPanel({
	config,
	onChange,
	entityType,
}: {
	config: SystemConfig;
	onChange: (config: Partial<SystemConfig>) => void;
	entityType?: EntityType;
}) {
	const entityTypes: EntityType[] = ['folder', 'album', 'tag', 'image', 'video', 'collection'];

	const handleEntityTypeConfigChange = (type: EntityType, property: string, value: boolean) => {
		onChange({
			entityTypeConfigs: {
				...config.entityTypeConfigs,
				[type]: {
					...config.entityTypeConfigs[type],
					[property]: value,
				},
			},
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-0.5">
				<div className="flex items-center gap-2">
					<Settings2 className="h-4 w-4" />
					<h3 className="text-base font-medium">Configuración por tipo de entidad</h3>
				</div>
				<p className="text-sm text-muted-foreground">
					Configura qué sistemas están habilitados para cada tipo de entidad.
				</p>
			</div>

			<div className="border rounded-md">
				<div className="grid grid-cols-4 border-b px-4 py-2 bg-muted/40">
					<div className="font-medium">Tipo de entidad</div>
					<div className="font-medium text-center">Rareza</div>
					<div className="font-medium text-center">Textura</div>
					<div className="font-medium text-center">Categoría</div>
				</div>
				<div className="divide-y">
					{entityTypes.map((type) => (
						<div key={type} className={cn('grid grid-cols-4 px-4 py-2', entityType === type && 'bg-muted/20')}>
							<div className="flex items-center">
								<Badge variant="outline" className={entityType === type ? 'bg-primary/10' : ''}>
									{type}
								</Badge>
							</div>
							<div className="flex justify-center items-center">
								<Switch
									checked={config.entityTypeConfigs[type]?.enableRarity}
									onCheckedChange={(value) => handleEntityTypeConfigChange(type, 'enableRarity', value)}
									disabled={!config.rarity.enabled}
								/>
							</div>
							<div className="flex justify-center items-center">
								<Switch
									checked={config.entityTypeConfigs[type]?.enableTexture}
									onCheckedChange={(value) => handleEntityTypeConfigChange(type, 'enableTexture', value)}
									disabled={!config.texture.enabled}
								/>
							</div>
							<div className="flex justify-center items-center">
								<Switch
									checked={config.entityTypeConfigs[type]?.enableCategory}
									onCheckedChange={(value) => handleEntityTypeConfigChange(type, 'enableCategory', value)}
									disabled={!config.category.enabled}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
