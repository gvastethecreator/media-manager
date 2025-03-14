'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Dice, Download, InfoIcon, RefreshCw, Save, Sparkles, Sync } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { NoiseTextureConfig } from './actions/noise-texture-config.action';
import { getNoiseTextureConfig, updateNoiseTextureConfig } from './actions/noise-texture-config.action';
import { noiseCache, perlinNoiseOctaves, simplexNoiseOctaves } from './utils/noise-algorithms';

// Crear un schema para la configuración del formulario
const noiseTextureFormSchema = z.object({
	enabled: z.boolean().default(true),
	density: z.number().min(0.01).max(2),
	opacity: z.number().min(0).max(1),
	visibleOnHover: z.boolean().optional(),
	pattern: z.enum(['perlin', 'simplex', 'fractalNoise', 'turbulence']),
	scale: z.number().min(0.1).max(10),
	octaves: z.number().int().min(1).max(8),
	seed: z.number().int(),
	animated: z.boolean().optional(),
	animationSpeed: z.number().min(0).max(10),
	blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']),
	color: z.string(),
	intensity: z.number().min(0).max(1),
});

type NoiseTextureFormValues = z.infer<typeof noiseTextureFormSchema>;

interface NoiseTextureSettingsProps {
	config: NoiseTextureConfig;
	onChange?: (config: NoiseTextureConfig) => void;
	onReset?: () => void;
	entityType?: string;
	entityId?: string;
}

export function NoiseTextureSettings({ config, onChange, onReset, entityType, entityId }: NoiseTextureSettingsProps) {
	const [localConfig, setLocalConfig] = useState<NoiseTextureConfig>(config);
	const [isLoading, setIsLoading] = useState(false);
	const [favoriteSeedsList, setFavoriteSeedsList] = useState<{ id: string; seed: number; name: string }[]>([]);
	const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
	const [autoUpdate, setAutoUpdate] = useState(true);
	const [previewScale, setPreviewScale] = useState(1);

	// Configurar el formulario
	const form = useForm<NoiseTextureFormValues>({
		resolver: zodResolver(noiseTextureFormSchema),
		defaultValues: localConfig as NoiseTextureFormValues,
	});

	// Efecto para actualizar el form cuando cambia el config
	useEffect(() => {
		form.reset(config as NoiseTextureFormValues);
		setLocalConfig(config);
	}, [config, form]);

	// Cargar las semillas guardadas del localStorage
	useEffect(() => {
		const savedSeeds = localStorage.getItem('noiseTextureFavoriteSeeds');
		if (savedSeeds) {
			try {
				const seeds = JSON.parse(savedSeeds);
				if (Array.isArray(seeds)) {
					setFavoriteSeedsList(seeds);
				}
			} catch (e) {
				console.error('Error al cargar semillas guardadas:', e);
			}
		}
	}, []);

	// Actualizar el localStorage cuando cambian las semillas favoritas
	useEffect(() => {
		if (favoriteSeedsList.length > 0) {
			localStorage.setItem('noiseTextureFavoriteSeeds', JSON.stringify(favoriteSeedsList));
		}
	}, [favoriteSeedsList]);

	// Efecto para renderizar el preview
	useEffect(() => {
		if (!previewCanvas) {
			return;
		}

		const updatePreview = () => {
			const ctx = previewCanvas.getContext('2d');
			if (!ctx) {
				return;
			}

			const values = form.getValues();

			// Establecer tamaño
			const size = 200;
			previewCanvas.width = size;
			previewCanvas.height = size;

			// Renderizar una cuadrícula para mostrar la transparencia
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, size, size);
			ctx.fillStyle = '#e5e5e5';

			const tileSize = 10;
			for (let x = 0; x < size; x += tileSize) {
				for (let y = 0; y < size; y += tileSize) {
					if ((x / tileSize + y / tileSize) % 2 === 0) {
						ctx.fillRect(x, y, tileSize, tileSize);
					}
				}
			}

			// Generar el ruido pixel por pixel
			const imageData = ctx.createImageData(size, size);
			const data = imageData.data;

			// Obtener color
			const colorMatch = values.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
			const [r, g, b, a = 1] = colorMatch
				? [
						Number.parseInt(colorMatch[1]),
						Number.parseInt(colorMatch[2]),
						Number.parseInt(colorMatch[3]),
						Number.parseFloat(colorMatch[4] || '1'),
					]
				: [255, 255, 255, 1];

			// Función para generar ruido según el algoritmo seleccionado
			const noiseFunction =
				values.pattern === 'perlin' || values.pattern === 'fractalNoise' ? perlinNoiseOctaves : simplexNoiseOctaves;

			// Generar el ruido
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const nx = (x / size) * previewScale;
					const ny = (y / size) * previewScale;

					// Generar valor de ruido
					const noiseValue = noiseFunction(nx, ny, values.seed, values.octaves, values.density, values.scale);

					// Calcular índice en el array de datos
					const idx = (y * size + x) * 4;

					// Aplicar color e intensidad
					data[idx] = r;
					data[idx + 1] = g;
					data[idx + 2] = b;
					data[idx + 3] = Math.floor(255 * noiseValue * values.opacity * values.intensity * a);
				}
			}

			// Dibujar el ruido
			ctx.putImageData(imageData, 0, 0);
		};

		updatePreview();
	}, [previewCanvas, form, previewScale]);

	// Actualizar el preview cuando cambien los valores relevantes
	useEffect(() => {
		if (!autoUpdate) {
			return;
		}

		const subscription = form.watch((_value, { name }) => {
			if (
				['pattern', 'seed', 'octaves', 'density', 'scale', 'intensity', 'opacity', 'color'].includes(name as string)
			) {
				if (previewCanvas) {
					const ctx = previewCanvas.getContext('2d');
					if (ctx) {
						setPreviewCanvas(previewCanvas);
					}
				}
			}
		});

		return () => subscription.unsubscribe();
	}, [form, previewCanvas, autoUpdate]);

	// Manejar cambio en cualquier control
	const handleChange = (value: Partial<NoiseTextureConfig>) => {
		const newConfig = { ...localConfig, ...value };
		setLocalConfig(newConfig);

		if (onChange) {
			onChange(newConfig);
		}
	};

	// Generar una semilla aleatoria
	const generateRandomSeed = () => {
		const newSeed = Math.floor(Math.random() * 1000);
		form.setValue('seed', newSeed);

		// Actualizar el preview
		if (previewCanvas) {
			const ctx = previewCanvas.getContext('2d');
			if (ctx) {
				setPreviewCanvas(previewCanvas);
			}
		}
	};

	// Guardar una semilla como favorita
	const saveSeedAsFavorite = () => {
		const currentSeed = form.getValues('seed');
		const newFavoriteName = `Semilla ${currentSeed}`;

		// Verificar si ya existe
		if (favoriteSeedsList.some((s) => s.seed === currentSeed)) {
			toast({
				title: 'Esta semilla ya está guardada',
				description: 'La semilla actual ya está en tus favoritos.',
				variant: 'warning',
			});
			return;
		}

		// Añadir a favoritos
		setFavoriteSeedsList([
			...favoriteSeedsList,
			{
				id: Date.now().toString(),
				seed: currentSeed,
				name: newFavoriteName,
			},
		]);

		toast({
			title: 'Semilla guardada',
			description: `La semilla ${currentSeed} ha sido guardada en favoritos.`,
			variant: 'success',
		});
	};

	// Restablecer configuración
	const handleReset = () => {
		if (onReset) {
			onReset();
		}
	};

	// Guardar configuración en el servidor
	const handleSave = async () => {
		if (!entityType) {
			return;
		}

		setIsLoading(true);

		try {
			const values = form.getValues();
			const result = await updateNoiseTextureConfig(entityType, values, entityId);

			if (result.success) {
				toast({
					title: 'Configuración guardada',
					description: 'La configuración de textura de ruido se ha guardado correctamente.',
					variant: 'success',
				});
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			console.error('Error al guardar la configuración:', error);
			toast({
				title: 'Error al guardar',
				description: 'Ha ocurrido un error al guardar la configuración.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Limpiar caché de ruido
	const clearNoiseCache = () => {
		noiseCache.invalidateAll();
		toast({
			title: 'Caché limpiada',
			description: 'El caché de texturas de ruido ha sido limpiado.',
			variant: 'success',
		});
	};

	// Actualizar preview
	const handleUpdatePreview = () => {
		if (previewCanvas) {
			const ctx = previewCanvas.getContext('2d');
			if (ctx) {
				setPreviewCanvas(previewCanvas);
			}
		}
	};

	return (
		<Tabs defaultValue="basic" className="w-full">
			<TabsList className="grid grid-cols-3 w-full mb-4">
				<TabsTrigger value="basic">Básico</TabsTrigger>
				<TabsTrigger value="advanced">Avanzado</TabsTrigger>
				<TabsTrigger value="seed">Semilla</TabsTrigger>
			</TabsList>

			<div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
				<div className="space-y-4">
					<TabsContent value="basic" className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enabled" className="flex flex-col space-y-1">
								<span>Habilitado</span>
								<span className="text-xs text-muted-foreground">Activa o desactiva el efecto</span>
							</Label>
							<Switch
								id="enabled"
								checked={localConfig.enabled}
								onCheckedChange={(checked) => handleChange({ enabled: !!checked })}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="opacity">Opacidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.opacity.toFixed(2)}</span>
							</div>
							<Slider
								id="opacity"
								min={0}
								max={1}
								step={0.01}
								value={[localConfig.opacity]}
								onValueChange={([value]) => handleChange({ opacity: value })}
							/>
							<span className="text-xs text-muted-foreground">Determina la transparencia del efecto de ruido</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="density">Densidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.density.toFixed(2)}</span>
							</div>
							<Slider
								id="density"
								min={0.01}
								max={2}
								step={0.01}
								value={[localConfig.density]}
								onValueChange={([value]) => handleChange({ density: value })}
							/>
							<span className="text-xs text-muted-foreground">Controla cuán detallado es el patrón de ruido</span>
						</div>

						<div className="space-y-2">
							<Label htmlFor="pattern">Tipo de ruido</Label>
							<Select
								value={localConfig.pattern}
								onValueChange={(value) =>
									handleChange({
										pattern: value as NoiseTextureConfig['pattern'],
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar tipo de ruido" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="perlin">Perlin Noise</SelectItem>
									<SelectItem value="simplex">Simplex Noise</SelectItem>
									<SelectItem value="fractalNoise">Fractal Noise</SelectItem>
									<SelectItem value="turbulence">Turbulencia</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-xs text-muted-foreground">El algoritmo que genera el patrón de ruido</span>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="visibleOnHover" className="flex flex-col space-y-1">
								<span>Solo en hover</span>
								<span className="text-xs text-muted-foreground">Mostrar solo al pasar el cursor</span>
							</Label>
							<Switch
								id="visibleOnHover"
								checked={localConfig.visibleOnHover}
								onCheckedChange={(checked) => handleChange({ visibleOnHover: checked })}
							/>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="intensity">Intensidad</Label>
								<span className="text-sm text-muted-foreground">{localConfig.intensity?.toFixed(2) || '0.50'}</span>
							</div>
							<Slider
								id="intensity"
								min={0}
								max={1}
								step={0.01}
								value={[localConfig.intensity || 0.5]}
								onValueChange={([value]) => handleChange({ intensity: value })}
							/>
							<span className="text-xs text-muted-foreground">Controla la fuerza del efecto de ruido</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="scale">Escala</Label>
								<span className="text-sm text-muted-foreground">{localConfig.scale?.toFixed(1) || '1.0'}</span>
							</div>
							<Slider
								id="scale"
								min={0.1}
								max={10}
								step={0.1}
								value={[localConfig.scale || 1]}
								onValueChange={([value]) => handleChange({ scale: value })}
							/>
							<span className="text-xs text-muted-foreground">Ajusta el tamaño relativo del patrón de ruido</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label htmlFor="octaves">Octavas</Label>
								<span className="text-sm text-muted-foreground">{localConfig.octaves || '3'}</span>
							</div>
							<Slider
								id="octaves"
								min={1}
								max={8}
								step={1}
								value={[localConfig.octaves || 3]}
								onValueChange={([value]) => handleChange({ octaves: value })}
							/>
							<span className="text-xs text-muted-foreground">Número de capas de detalle (más = más complejo)</span>
						</div>

						<div className="space-y-2">
							<Label htmlFor="blendMode">Modo de mezcla</Label>
							<Select
								value={localConfig.blendMode || 'overlay'}
								onValueChange={(value) =>
									handleChange({
										blendMode: value as NoiseTextureConfig['blendMode'],
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar modo de mezcla" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="normal">Normal</SelectItem>
									<SelectItem value="multiply">Multiplicar</SelectItem>
									<SelectItem value="screen">Pantalla</SelectItem>
									<SelectItem value="overlay">Superponer</SelectItem>
									<SelectItem value="darken">Oscurecer</SelectItem>
									<SelectItem value="lighten">Aclarar</SelectItem>
								</SelectContent>
							</Select>
							<span className="text-xs text-muted-foreground">
								Cómo se mezcla el ruido con los elementos subyacentes
							</span>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="animated" className="flex flex-col space-y-1">
								<span>Animado</span>
								<span className="text-xs text-muted-foreground">Anima el ruido en tiempo real</span>
							</Label>
							<Switch
								id="animated"
								checked={localConfig.animated || false}
								onCheckedChange={(checked) => handleChange({ animated: checked })}
							/>
						</div>

						{localConfig.animated && (
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="animationSpeed">Velocidad</Label>
									<span className="text-sm text-muted-foreground">
										{localConfig.animationSpeed?.toFixed(1) || '1.0'}
									</span>
								</div>
								<Slider
									id="animationSpeed"
									min={0.1}
									max={10}
									step={0.1}
									value={[localConfig.animationSpeed || 1]}
									onValueChange={([value]) => handleChange({ animationSpeed: value })}
								/>
								<span className="text-xs text-muted-foreground">Controla la velocidad de la animación</span>
							</div>
						)}
					</TabsContent>

					<TabsContent value="seed" className="space-y-4">
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Input
									type="number"
									value={localConfig.seed || 0}
									onChange={(e) => {
										const value = Number.parseInt(e.target.value);
										if (!Number.isNaN(value)) {
											handleChange({ seed: value });
										}
									}}
									className="flex-1"
								/>
								<Button variant="outline" size="icon" onClick={generateRandomSeed} title="Generar semilla aleatoria">
									<Dice className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={saveSeedAsFavorite}
									title="Guardar semilla como favorita"
								>
									<Badge className="h-4 w-4" />
								</Button>
							</div>

							<div className="space-y-2">
								<Label>Semillas guardadas</Label>
								{favoriteSeedsList.length > 0 ? (
									<div className="grid grid-cols-2 gap-2">
										{favoriteSeedsList.map((favSeed) => (
											<Button
												key={favSeed.id}
												variant="outline"
												className="justify-start text-xs"
												onClick={() => {
													form.setValue('seed', favSeed.seed);
													handleUpdatePreview();
												}}
											>
												<Sparkles className="h-3 w-3 mr-2" />
												{favSeed.name} ({favSeed.seed})
											</Button>
										))}
									</div>
								) : (
									<div className="text-xs text-muted-foreground">
										No hay semillas guardadas. Guarda alguna usando el botón <Badge className="h-3 w-3 inline" />
									</div>
								)}
							</div>

							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label htmlFor="previewScale">Escala de preview</Label>
									<span className="text-sm text-muted-foreground">{previewScale.toFixed(1)}x</span>
								</div>
								<Slider
									id="previewScale"
									min={0.5}
									max={5}
									step={0.5}
									value={[previewScale]}
									onValueChange={([value]) => setPreviewScale(value)}
								/>
							</div>

							<div className="flex items-center space-x-2">
								<Button variant="outline" size="sm" className="text-xs" onClick={clearNoiseCache}>
									<RefreshCw className="h-3 w-3 mr-1" />
									Limpiar caché
								</Button>

								<Button variant="outline" size="sm" className="text-xs" onClick={handleUpdatePreview}>
									<Sync className="h-3 w-3 mr-1" />
									Actualizar preview
								</Button>

								<div className="flex items-center space-x-1 ml-auto">
									<Label htmlFor="autoUpdate" className="text-xs">
										Auto
									</Label>
									<Switch id="autoUpdate" checked={autoUpdate} onCheckedChange={setAutoUpdate} size="sm" />
								</div>
							</div>
						</div>
					</TabsContent>
				</div>

				{/* Preview del ruido */}
				<div className="sticky top-4 space-y-4">
					<Card className="overflow-hidden">
						<CardContent className="p-0">
							<canvas className="w-full aspect-square bg-zinc-100" ref={setPreviewCanvas} />
						</CardContent>
					</Card>

					{entityType && (
						<div className="flex items-center space-x-2">
							<Button onClick={handleSave} disabled={isLoading} className="w-full">
								{isLoading ? <div className="animate-spin mr-1">◌</div> : <Save className="h-4 w-4 mr-2" />}
								Guardar
							</Button>

							<Button variant="outline" onClick={handleReset} disabled={isLoading}>
								<RefreshCw className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</Tabs>
	);
}
