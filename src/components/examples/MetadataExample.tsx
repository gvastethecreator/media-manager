'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useMetadataStore } from '@/store/entities/metadata';
import { MetadataExtended } from '@/types/entities/metadata/extended';
import { useEffect, useState } from 'react';

/**
 * Componente de ejemplo para visualizar metadatos de imágenes
 */
export default function MetadataExample() {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState('general');

	// Acceder al store de metadatos
	const metadatas = useMetadataStore.use.metadatas();
	const isLoading = useMetadataStore.use.isLoading();
	const filteredMetadatas = useMetadataStore.use.getFilteredAndSortedMetadatas();
	const viewMode = useMetadataStore.use.viewMode();

	// Acciones del store
	const {
		setMetadatas,
		setIsLoading,
		setViewMode,
		setError
	} = useMetadataStore();

	// Cargar datos de ejemplo
	useEffect(() => {
		const loadExampleData = async () => {
			setIsLoading(true);

			try {
				// Datos de ejemplo
				const exampleMetadatas: MetadataExtended[] = [
					{
						id: '1',
						imageId: 'img-1',
						format: 'JPEG',
						width: 1920,
						height: 1080,
						size: 2500000,
						colorSpace: 'sRGB',
						hasAlpha: false,
						orientation: 1,
						createdAt: new Date('2023-01-15'),
						updatedAt: new Date('2023-01-15'),
						// Propiedades extendidas
						aspectRatio: 1.777,
						formattedSize: '2.38 MB',
						dimensions: '1920x1080'
					},
					{
						id: '2',
						imageId: 'img-2',
						format: 'PNG',
						width: 800,
						height: 600,
						size: 1200000,
						colorSpace: 'sRGB',
						hasAlpha: true,
						orientation: 1,
						createdAt: new Date('2023-02-20'),
						updatedAt: new Date('2023-02-20'),
						// Propiedades extendidas
						aspectRatio: 1.333,
						formattedSize: '1.14 MB',
						dimensions: '800x600'
					},
					{
						id: '3',
						imageId: 'img-3',
						format: 'WEBP',
						width: 1200,
						height: 800,
						size: 800000,
						colorSpace: 'sRGB',
						hasAlpha: true,
						orientation: 1,
						createdAt: new Date('2023-03-10'),
						updatedAt: new Date('2023-03-10'),
						// Propiedades extendidas
						aspectRatio: 1.5,
						formattedSize: '781.25 KB',
						dimensions: '1200x800'
					}
				];

				// Actualizar el store
				setMetadatas(exampleMetadatas);

				toast({
					title: 'Datos cargados',
					description: 'Metadatos de ejemplo cargados correctamente',
				});
			} catch (error) {
				console.error('Error cargando datos de ejemplo:', error);
				setError('Error al cargar datos de ejemplo');

				toast({
					title: 'Error',
					description: 'No se pudieron cargar los datos de ejemplo',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadExampleData();
	}, []);

	// Renderizar tarjeta de metadatos
	const renderMetadataCard = (metadata: MetadataExtended) => (
		<Card key={metadata.id} className="w-full md:max-w-xs">
			<CardHeader className="pb-2">
				<CardTitle className="text-lg flex justify-between items-center">
					{metadata.format}
					<Badge
						variant={metadata.hasAlpha ? "default" : "outline"}
						className="ml-2"
					>
						{metadata.hasAlpha ? 'Con Alpha' : 'Sin Alpha'}
					</Badge>
				</CardTitle>
				<CardDescription>{metadata.dimensions}</CardDescription>
			</CardHeader>
			<CardContent className="pb-2">
				<div className="space-y-2">
					<div className="flex justify-between">
						<span className="text-sm text-muted-foreground">Tamaño:</span>
						<span className="font-medium">{metadata.formattedSize}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-sm text-muted-foreground">Proporción:</span>
						<span className="font-medium">{metadata.aspectRatio.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-sm text-muted-foreground">Color:</span>
						<span className="font-medium">{metadata.colorSpace || 'N/A'}</span>
					</div>
				</div>
			</CardContent>
			<CardFooter className="pt-2">
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => {
						toast({
							title: 'Detalles',
							description: `Viendo detalles de ${metadata.format} (${metadata.dimensions})`,
						});
					}}
				>
					Ver Detalles
				</Button>
			</CardFooter>
		</Card>
	);

	// Renderizar tabla de metadatos
	const renderMetadataTable = () => (
		<div className="w-full overflow-auto">
			<table className="w-full border-collapse">
				<thead>
					<tr className="border-b">
						<th className="text-left p-2">Formato</th>
						<th className="text-left p-2">Dimensiones</th>
						<th className="text-left p-2">Tamaño</th>
						<th className="text-left p-2">Proporción</th>
						<th className="text-left p-2">Color</th>
						<th className="text-left p-2">Alpha</th>
					</tr>
				</thead>
				<tbody>
					{filteredMetadatas.map((metadata) => (
						<tr key={metadata.id} className="border-b hover:bg-muted/50">
							<td className="p-2">{metadata.format}</td>
							<td className="p-2">{metadata.dimensions}</td>
							<td className="p-2">{metadata.formattedSize}</td>
							<td className="p-2">{metadata.aspectRatio.toFixed(2)}</td>
							<td className="p-2">{metadata.colorSpace || 'N/A'}</td>
							<td className="p-2">
								<Badge variant={metadata.hasAlpha ? "default" : "outline"}>
									{metadata.hasAlpha ? 'Sí' : 'No'}
								</Badge>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);

	// Renderizar esqueleto durante la carga
	const renderSkeleton = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{[1, 2, 3].map((i) => (
				<Card key={i} className="w-full md:max-w-xs">
					<CardHeader className="pb-2">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-4 w-32 mt-2" />
					</CardHeader>
					<CardContent className="pb-2">
						<div className="space-y-2">
							{[1, 2, 3].map((j) => (
								<div key={j} className="flex justify-between">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-12" />
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter className="pt-2">
						<Skeleton className="h-9 w-full" />
					</CardFooter>
				</Card>
			))}
		</div>
	);

	return (
		<div className="container mx-auto p-4 space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Ejemplo de Metadatos</h1>
				<p className="text-muted-foreground">
					Visualización de metadatos de imágenes con diferentes formatos.
				</p>
			</div>

			<div className="flex justify-between items-center">
				<div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setViewMode('grid')}
						className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
					>
						Cuadrícula
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setViewMode('table')}
						className={viewMode === 'table' ? 'bg-primary text-primary-foreground ml-2' : 'ml-2'}
					>
						Tabla
					</Button>
				</div>
				<Badge variant="outline">
					{filteredMetadatas.length} metadatos
				</Badge>
			</div>

			<Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="avanzado">Avanzado</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="mt-4">
					{isLoading ? (
						renderSkeleton()
					) : viewMode === 'grid' ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredMetadatas.map(renderMetadataCard)}
						</div>
					) : (
						renderMetadataTable()
					)}
				</TabsContent>
				<TabsContent value="avanzado" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Información Técnica</CardTitle>
							<CardDescription>
								Detalles avanzados sobre los metadatos de las imágenes.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
								{JSON.stringify(filteredMetadatas, null, 2)}
							</pre>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}