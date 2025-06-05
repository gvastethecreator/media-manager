'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ImageGallery } from './image-gallery';

// Datos de ejemplo para la galería
const mockImageIds = [
	'img-001',
	'img-002',
	'img-003',
	'img-004',
	'img-005',
	'img-006',
	'img-007',
	'img-008',
	'img-009',
	'img-010',
	'img-011',
	'img-012',
];

/**
 * Componente de ejemplo que muestra diferentes configuraciones de ImageGallery
 * Incluye:
 * - Diferentes variantes visuales
 * - Opciones de selección
 * - Configuraciones de layout
 * - Ejemplos de uso con diferentes datos
 */
export default function ImageGalleryExample() {
	const [selectedImages, setSelectedImages] = useState<string[]>([]);
	const [selectedVariant, setSelectedVariant] = useState<string>('default');

	// Simulación de carga de más imágenes
	const handleLoadMore = async () => {
		// Simular una carga asíncrona
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 1500);
		});
	};

	return (
		<div className="space-y-8 container mx-auto py-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h2 className="text-3xl font-bold">Galería de Imágenes</h2>
					<p className="text-muted-foreground mt-1">Componente flexible para mostrar colecciones de imágenes</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setSelectedImages([])} disabled={selectedImages.length === 0}>
						Limpiar selección ({selectedImages.length})
					</Button>
				</div>
			</div>

			{/* Variantes visuales */}
			<Tabs defaultValue="variants" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="variants">Variantes Visuales</TabsTrigger>
					<TabsTrigger value="layouts">Layouts</TabsTrigger>
					<TabsTrigger value="selectable">Selección</TabsTrigger>
					<TabsTrigger value="infinite">Carga Infinita</TabsTrigger>
				</TabsList>

				{/* Pestaña: Variantes visuales */}
				<TabsContent value="variants" className="space-y-8">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Default</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} title="Estándar" variant="default" showControls={false} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Minimal</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} title="Minimal" variant="minimal" showControls={false} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Polaroid</h3>
							<ImageGallery
								images={mockImageIds.slice(0, 4)}
								title="Polaroid"
								variant="polaroid"
								showControls={false}
							/>
						</div>

						<div className="border rounded-lg p-4 space-y-4 dark bg-gray-950">
							<h3 className="font-medium text-lg text-white">Variante TCG</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} title="Trading Card" variant="tcg" showControls={false} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Gallery</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} title="Gallery" variant="gallery" showControls={false} />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Layouts */}
				<TabsContent value="layouts" className="space-y-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Layout Grid</h3>
							<ImageGallery images={mockImageIds.slice(0, 9)} title="Grid Layout" defaultLayout="grid" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Layout Grid Dense</h3>
							<ImageGallery images={mockImageIds.slice(0, 9)} title="Grid Dense Layout" defaultLayout="grid-dense" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Layout List</h3>
							<ImageGallery images={mockImageIds.slice(0, 9)} title="List Layout" defaultLayout="list" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Relación de Aspecto Personalizada</h3>
							<ImageGallery images={mockImageIds.slice(0, 9)} title="Aspect 1:1" aspectRatio="square" />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Selección */}
				<TabsContent value="selectable" className="space-y-8">
					<div className="border rounded-lg p-6">
						<h3 className="font-medium text-lg mb-4">Modo Seleccionable</h3>
						<p className="text-muted-foreground mb-6">
							Haga clic en las imágenes para seleccionarlas. {selectedImages.length} seleccionadas.
						</p>

						<ImageGallery
							images={mockImageIds.slice(0, 12)}
							title="Selección de Imágenes"
							selectable={true}
							onSelectionChange={(selected) => setSelectedImages(selected)}
						/>
					</div>
				</TabsContent>

				{/* Pestaña: Carga Infinita */}
				<TabsContent value="infinite" className="space-y-8">
					<div className="border rounded-lg p-6">
						<h3 className="font-medium text-lg mb-4">Carga "Infinita"</h3>
						<p className="text-muted-foreground mb-6">Ejemplo de galería con botón "Cargar más"</p>

						<ImageGallery
							images={mockImageIds}
							title="Carga Dinámica"
							showLoadMore={true}
							onLoadMore={handleLoadMore}
							hasMoreImages={true}
						/>
					</div>
				</TabsContent>
			</Tabs>

			{/* Galería completa con todas las características */}
			<div className="border-t pt-8 mt-8">
				<h3 className="text-2xl font-bold mb-6">Galería Completa</h3>
				<ImageGallery
					images={mockImageIds}
					title="Todas las características"
					variant={selectedVariant as any}
					selectable={true}
					onSelectionChange={(selected) => setSelectedImages(selected)}
					showLoadMore={true}
					onLoadMore={handleLoadMore}
					hasMoreImages={true}
				/>
			</div>
		</div>
	);
}
