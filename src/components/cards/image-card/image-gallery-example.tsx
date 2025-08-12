import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
	const [selectedVariant, _setSelectedVariant] = useState<string>('default');

	// Simulación de carga de más imágenes
	const handleLoadMore = () =>
		new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 1500);
		});

	return (
		<div className="container mx-auto space-y-8 py-6">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h2 className="font-bold text-3xl">Galería de Imágenes</h2>
					<p className="mt-1 text-muted-foreground">Componente flexible para mostrar colecciones de imágenes</p>
				</div>
				<div className="flex gap-2">
					<Button disabled={selectedImages.length === 0} onClick={() => setSelectedImages([])} variant="outline">
						Limpiar selección ({selectedImages.length})
					</Button>
				</div>
			</div>

			{/* Variantes visuales */}
			<Tabs className="w-full" defaultValue="variants">
				<TabsList className="mb-4">
					<TabsTrigger value="variants">Variantes Visuales</TabsTrigger>
					<TabsTrigger value="layouts">Layouts</TabsTrigger>
					<TabsTrigger value="selectable">Selección</TabsTrigger>
					<TabsTrigger value="infinite">Carga Infinita</TabsTrigger>
				</TabsList>

				{/* Pestaña: Variantes visuales */}
				<TabsContent className="space-y-8" value="variants">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Default</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} showControls={false} title="Estándar" variant="default" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Minimal</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} showControls={false} title="Minimal" variant="minimal" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Polaroid</h3>
							<ImageGallery
								images={mockImageIds.slice(0, 4)}
								showControls={false}
								title="Polaroid"
								variant="polaroid"
							/>
						</div>

						<div className="dark space-y-4 rounded-lg border bg-gray-950 p-4">
							<h3 className="font-medium text-lg text-white">Variante TCG</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} showControls={false} title="Trading Card" variant="tcg" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Gallery</h3>
							<ImageGallery images={mockImageIds.slice(0, 4)} showControls={false} title="Gallery" variant="gallery" />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Layouts */}
				<TabsContent className="space-y-8" value="layouts">
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Layout Grid</h3>
							<ImageGallery defaultLayout="grid" images={mockImageIds.slice(0, 9)} title="Grid Layout" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Layout Grid Dense</h3>
							<ImageGallery defaultLayout="grid-dense" images={mockImageIds.slice(0, 9)} title="Grid Dense Layout" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Layout List</h3>
							<ImageGallery defaultLayout="list" images={mockImageIds.slice(0, 9)} title="List Layout" />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Relación de Aspecto Personalizada</h3>
							<ImageGallery aspectRatio="square" images={mockImageIds.slice(0, 9)} title="Aspect 1:1" />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Selección */}
				<TabsContent className="space-y-8" value="selectable">
					<div className="rounded-lg border p-6">
						<h3 className="mb-4 font-medium text-lg">Modo Seleccionable</h3>
						<p className="mb-6 text-muted-foreground">
							Haga clic en las imágenes para seleccionarlas. {selectedImages.length} seleccionadas.
						</p>

						<ImageGallery
							images={mockImageIds.slice(0, 12)}
							onSelectionChange={(selected) => setSelectedImages(selected)}
							selectable={true}
							title="Selección de Imágenes"
						/>
					</div>
				</TabsContent>

				{/* Pestaña: Carga Infinita */}
				<TabsContent className="space-y-8" value="infinite">
					<div className="rounded-lg border p-6">
						<h3 className="mb-4 font-medium text-lg">Carga "Infinita"</h3>
						<p className="mb-6 text-muted-foreground">Ejemplo de galería con botón "Cargar más"</p>

						<ImageGallery
							hasMoreImages={true}
							images={mockImageIds}
							onLoadMore={handleLoadMore}
							showLoadMore={true}
							title="Carga Dinámica"
						/>
					</div>
				</TabsContent>
			</Tabs>

			{/* Galería completa con todas las características */}
			<div className="mt-8 border-t pt-8">
				<h3 className="mb-6 font-bold text-2xl">Galería Completa</h3>
				<ImageGallery
					hasMoreImages={true}
					images={mockImageIds}
					onLoadMore={handleLoadMore}
					onSelectionChange={(selected) => setSelectedImages(selected)}
					selectable={true}
					showLoadMore={true}
					title="Todas las características"
					variant={selectedVariant as any}
				/>
			</div>
		</div>
	);
}
