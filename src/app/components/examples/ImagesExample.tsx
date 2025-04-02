'use client';

/**
 * @file Componente de ejemplo para demostrar la entidad Image
 * @module app/components/examples/ImagesExample
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useImageStore } from '@/store/entities/image';
import { ImageGroupType } from '@/store/entities/image/types';
import { transformImage, transformImageToComplete, transformImageToExtended } from '@/transformers/image/transformer';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const mockImageData = {
	id: 'img-1',
	name: 'Imagen de ejemplo',
	path: '/path/to/image.jpg',
	hash: 'abc123',
	createdAt: new Date(),
	updatedAt: new Date(),
	size: 1024 * 1024 * 2.5, // 2.5 MB
	width: 1920,
	height: 1080,
	folderId: 'folder-1',
	metadata: {
		camera: 'Sony A7IV',
		lens: '24-70mm f/2.8',
		iso: 100,
		shutterSpeed: '1/200',
		aperture: 'f/2.8',
		tags: ['paisaje', 'naturaleza', 'montaña']
	}
};

export default function ImagesExample() {
	const [isLoading, setIsLoading] = useState(false);
	const [groupBy, setGroupBy] = useState<ImageGroupType>(ImageGroupType.NONE);
	const [imageData, setImageData] = useState<any>(mockImageData);
	const [transformedBase, setTransformedBase] = useState<ImageBase | null>(null);
	const [transformedComplete, setTransformedComplete] = useState<ImageComplete | null>(null);
	const [transformedExtended, setTransformedExtended] = useState<ImageExtended | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const {
		core: { images, isLoading: storeLoading },
		ui: { viewMode, selectedIds },
		filters: { searchQuery, sortBy, filterByTag, filterFavorites },
		getImages,
		fetchImages,
		setSortBy,
		setSearchQuery,
		setFilterFavorites,
		setViewMode,
		selectFilteredImages,
		selectFilteredImagesCount,
		selectGroupedImages,
		selectImageStats,
		selectFavorites
	} = useImageStore();

	useEffect(() => {
		const loadImages = async () => {
			setIsLoading(true);
			try {
				await fetchImages();
				toast.success('Imágenes cargadas correctamente');
			} catch (error) {
				toast.error('Error al cargar las imágenes');
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		loadImages();
	}, [fetchImages]);

	const filteredImages = selectFilteredImages();
	const filteredCount = selectFilteredImagesCount();
	const groupedImages = selectGroupedImages(groupBy);
	const statistics = selectImageStats();
	const favorites = selectFavorites();

	const handleRefresh = async () => {
		setIsLoading(true);
		try {
			await fetchImages();
			toast.success('Imágenes actualizadas correctamente');
		} catch (error) {
			toast.error('Error al actualizar las imágenes');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTransform = (type: 'base' | 'complete' | 'extended') => {
		try {
			setErrorMessage(null);

			if (type === 'base') {
				const result = transformImage(imageData);
				setTransformedBase(result);
				setTransformedComplete(null);
				setTransformedExtended(null);
				toast({
					title: "Transformación básica completada",
					description: "Se ha transformado la imagen al formato base correctamente",
				});
			} else if (type === 'complete') {
				const result = transformImageToComplete(imageData);
				setTransformedBase(null);
				setTransformedComplete(result);
				setTransformedExtended(null);
				toast({
					title: "Transformación completa completada",
					description: "Se ha transformado la imagen al formato completo correctamente",
				});
			} else {
				const result = transformImageToExtended(imageData);
				setTransformedBase(null);
				setTransformedComplete(null);
				setTransformedExtended(result);
				toast({
					title: "Transformación extendida completada",
					description: "Se ha transformado la imagen al formato extendido correctamente",
				});
			}
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
			toast({
				title: "Error en la transformación",
				description: error instanceof Error ? error.message : String(error),
				variant: "destructive",
			});
		}
	};

	const updateImageField = (field: string, value: any) => {
		setImageData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const introduceError = (errorType: string) => {
		try {
			setErrorMessage(null);

			if (errorType === 'nullInput') {
				transformImage(null);
			} else if (errorType === 'invalidField') {
				const badData = { ...imageData, width: 'not-a-number' };
				transformImageToComplete(badData);
			} else if (errorType === 'missingRequired') {
				const { id, path, ...incompleteData } = { ...imageData };
				transformImageToExtended(incompleteData);
			}
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : String(error));
			toast({
				title: "Error controlado generado",
				description: error instanceof Error ? error.message : String(error),
				variant: "destructive",
			});
		}
	};

	return (
		<div className="container mx-auto py-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Datos de entrada</CardTitle>
							<CardDescription>Edita los valores para probar el transformador</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre</Label>
								<Input
									id="name"
									value={imageData.name}
									onChange={e => updateImageField('name', e.target.value)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="width">Ancho</Label>
									<Input
										id="width"
										type="number"
										value={imageData.width}
										onChange={e => updateImageField('width', Number(e.target.value))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="height">Alto</Label>
									<Input
										id="height"
										type="number"
										value={imageData.height}
										onChange={e => updateImageField('height', Number(e.target.value))}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="size">Tamaño (bytes)</Label>
								<Input
									id="size"
									type="number"
									value={imageData.size}
									onChange={e => updateImageField('size', Number(e.target.value))}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="folderId">Carpeta</Label>
								<Input
									id="folderId"
									value={imageData.folderId}
									onChange={e => updateImageField('folderId', e.target.value)}
								/>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<div className="space-x-2">
								<Button variant="secondary" onClick={() => setImageData(mockImageData)}>
									Restablecer
								</Button>
								<Button variant="destructive" onClick={() => introduceError('nullInput')}>
									Generar Error Null
								</Button>
								<Button variant="destructive" onClick={() => introduceError('invalidField')}>
									Generar Error Tipo
								</Button>
							</div>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Transformaciones</CardTitle>
							<CardDescription>Prueba las diferentes transformaciones</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<Button onClick={() => handleTransform('base')}>Formato Base</Button>
								<Button onClick={() => handleTransform('complete')}>Formato Completo</Button>
								<Button onClick={() => handleTransform('extended')}>Formato Extendido</Button>
							</div>

							{errorMessage && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800"
								>
									<p className="font-semibold">Error:</p>
									<p className="text-sm">{errorMessage}</p>
								</motion.div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="mt-8">
					<Tabs defaultValue="preview">
						<TabsList className="mb-4">
							<TabsTrigger value="preview">Vista Previa</TabsTrigger>
							<TabsTrigger value="json">JSON</TabsTrigger>
						</TabsList>

						<TabsContent value="preview">
							{transformedBase && (
								<PreviewCard
									title="Transformación Base"
									data={transformedBase}
									type="base"
								/>
							)}

							{transformedComplete && (
								<PreviewCard
									title="Transformación Completa"
									data={transformedComplete}
									type="complete"
								/>
							)}

							{transformedExtended && (
								<PreviewCard
									title="Transformación Extendida"
									data={transformedExtended}
									type="extended"
								/>
							)}

							{!transformedBase && !transformedComplete && !transformedExtended && (
								<Card>
									<CardContent className="p-8 text-center text-muted-foreground">
										<p>Selecciona una transformación para ver los resultados</p>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="json">
							<Card>
								<CardHeader>
									<CardTitle>Resultado JSON</CardTitle>
								</CardHeader>
								<CardContent>
									<pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-xs">
										{transformedBase && JSON.stringify(transformedBase, null, 2)}
										{transformedComplete && JSON.stringify(transformedComplete, null, 2)}
										{transformedExtended && JSON.stringify(transformedExtended, null, 2)}
										{!transformedBase && !transformedComplete && !transformedExtended &&
											"Selecciona una transformación para ver el JSON resultante"
										}
									</pre>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</motion.div>
		</div>
	);
}

function PreviewCard({ title, data, type }: { title: string; data: any; type: 'base' | 'complete' | 'extended' }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Card className="mb-4">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg">{title}</CardTitle>
					<Badge variant={type === 'base' ? 'outline' : type === 'complete' ? 'secondary' : 'default'}>
						{type}
					</Badge>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h3 className="font-medium text-sm mb-2">Información básica</h3>
							<div className="space-y-2">
								<InfoRow label="ID" value={data.id} />
								<InfoRow label="Nombre" value={data.name} />
								<InfoRow label="Ruta" value={data.path} />
								<InfoRow label="Hash" value={data.hash} />
								<InfoRow label="Carpeta" value={data.folderId || 'No asignada'} />
								<InfoRow
									label="Fecha creación"
									value={new Date(data.createdAt).toLocaleString()}
								/>
							</div>
						</div>

						<div>
							<h3 className="font-medium text-sm mb-2">Dimensiones y tamaño</h3>
							<div className="space-y-2">
								<InfoRow label="Ancho" value={`${data.width}px`} />
								<InfoRow label="Alto" value={`${data.height}px`} />

								{type === 'extended' && (
									<>
										<InfoRow label="Dimensiones" value={data.dimensions} />
										<InfoRow label="Tamaño" value={data.formattedSize} />
									</>
								)}

								{type !== 'base' && (
									<InfoRow
										label="Relación aspecto"
										value={data.aspectRatio?.toFixed(2)}
									/>
								)}
							</div>
						</div>
					</div>

					{type !== 'base' && (
						<>
							<Separator className="my-4" />
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{data.metadata && Object.keys(data.metadata).length > 0 && (
									<div>
										<h3 className="font-medium text-sm mb-2">Metadatos</h3>
										<div className="flex flex-wrap gap-1 mt-2">
											{Object.entries(data.metadata).map(([key, value]: [string, any]) => (
												<div key={key}>
													{Array.isArray(value) ? (
														value.map((tag) => (
															<Badge key={`${key}-${tag}`} variant="outline" className="mr-1 mb-1">
																{tag}
															</Badge>
														))
													) : (
														<div className="text-xs py-1">
															<span className="font-medium">{key}:</span> {String(value)}
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{data.stats && (
									<div>
										<h3 className="font-medium text-sm mb-2">Estadísticas</h3>
										<div className="space-y-1">
											{Object.entries(data.stats).map(([key, value]: [string, any]) => (
												<div key={key} className="text-xs">
													<span className="font-medium">{formatKey(key)}:</span> {formatValue(value)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</>
					)}

					{type === 'extended' && (
						<>
							<Separator className="my-4" />
							<div>
								<h3 className="font-medium text-sm mb-2">Propiedades UI</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<InfoRow label="Nombre mostrado" value={data.displayName} />
										<InfoRow label="Seleccionado" value={data.selected ? 'Sí' : 'No'} />
										<InfoRow label="Visible" value={data.visible ? 'Sí' : 'No'} />
									</div>
									<div>
										<h4 className="text-sm font-medium mb-2">Vista previa</h4>
										<div className="relative w-32 h-32 rounded-md bg-muted flex items-center justify-center overflow-hidden">
											<div
												className={cn(
													"absolute inset-0",
													data.visualConfig?.dominantColor ? "opacity-30" : "opacity-0"
												)}
												style={{ backgroundColor: data.visualConfig?.dominantColor || '#000000' }}
											/>
											<Avatar className="w-full h-full rounded-none">
												<AvatarImage src={data.thumbnails?.medium} alt={data.name} />
												<AvatarFallback className="text-xs rounded-none">
													{data.name?.substring(0, 2).toUpperCase() || 'IMG'}
												</AvatarFallback>
											</Avatar>
										</div>
									</div>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

function InfoRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
	return (
		<div className="flex items-start text-sm">
			<span className="font-medium w-1/3">{label}:</span>
			<span className="text-muted-foreground">{formatValue(value)}</span>
		</div>
	);
}

function formatValue(value: any): string {
	if (value === undefined || value === null) return 'No disponible';
	if (typeof value === 'boolean') return value ? 'Sí' : 'No';
	return String(value);
}

function formatKey(key: string): string {
	return key
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, str => str.toUpperCase());
}