import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageCardImproved } from './image-card-improved';

// Datos de ejemplo para mostrar las tarjetas
const mockImageIds = ['img-001', 'img-002', 'img-003', 'img-004', 'img-005', 'img-006', 'img-007', 'img-008'];

/**
 * Componente de ejemplo que muestra diferentes configuraciones de ImageCardImproved
 * Incluye:
 * - Diferentes variantes visuales (default, minimal, polaroid, tcg, gallery)
 * - Diferentes proporciones de aspecto
 * - Estado de selección
 * - Con y sin detalles/etiquetas
 */
export default function ImageCardExample() {
	return (
		<div className="space-y-8 container mx-auto py-6">
			<div>
				<h2 className="text-3xl font-bold mb-2">Tarjetas de Imagen</h2>
				<p className="text-muted-foreground">
					Componente mejorado para mostrar imágenes con diferentes estilos y funcionalidades
				</p>
			</div>

			<Tabs defaultValue="variants" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="variants">Variantes Visuales</TabsTrigger>
					<TabsTrigger value="aspect-ratios">Proporciones</TabsTrigger>
					<TabsTrigger value="states">Estados</TabsTrigger>
					<TabsTrigger value="options">Opciones</TabsTrigger>
				</TabsList>

				{/* Pestaña: Variantes visuales */}
				<TabsContent value="variants">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Default</h3>
							<div className="h-96 w-full">
								<ImageCardImproved imageId={mockImageIds[0]} variant="default" className="h-full" />
							</div>
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Minimal</h3>
							<div className="h-96 w-full">
								<ImageCardImproved imageId={mockImageIds[1]} variant="minimal" className="h-full" />
							</div>
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Polaroid</h3>
							<div className="h-96 w-full">
								<ImageCardImproved imageId={mockImageIds[2]} variant="polaroid" className="h-full" />
							</div>
						</div>

						<div className="border rounded-lg p-4 space-y-4 dark bg-gray-950">
							<h3 className="font-medium text-lg text-white">Variante TCG</h3>
							<div className="h-96 w-full">
								<ImageCardImproved imageId={mockImageIds[3]} variant="tcg" className="h-full" />
							</div>
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Variante Gallery</h3>
							<div className="h-96 w-full">
								<ImageCardImproved imageId={mockImageIds[4]} variant="gallery" className="h-full" />
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Proporciones de aspecto */}
				<TabsContent value="aspect-ratios">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">1:1 (Square)</h3>
							<ImageCardImproved imageId={mockImageIds[0]} aspectRatio="square" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">16:9 (Video)</h3>
							<ImageCardImproved imageId={mockImageIds[1]} aspectRatio="video" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">3:2 (Foto)</h3>
							<ImageCardImproved imageId={mockImageIds[2]} aspectRatio="3/2" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">4:5 (Portrait)</h3>
							<ImageCardImproved imageId={mockImageIds[3]} aspectRatio="4/5" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">2:1 (Panorámica)</h3>
							<ImageCardImproved imageId={mockImageIds[4]} aspectRatio="2/1" />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Auto (Sin restricción)</h3>
							<ImageCardImproved imageId={mockImageIds[5]} aspectRatio="auto" />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Estados */}
				<TabsContent value="states">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Normal</h3>
							<ImageCardImproved imageId={mockImageIds[0]} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Seleccionada</h3>
							<ImageCardImproved imageId={mockImageIds[1]} isSelected={true} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">No Hovereable</h3>
							<ImageCardImproved imageId={mockImageIds[2]} isHoverable={false} />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Opciones */}
				<TabsContent value="options">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Sin etiquetas</h3>
							<ImageCardImproved imageId={mockImageIds[0]} showTags={false} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Sin detalles</h3>
							<ImageCardImproved imageId={mockImageIds[1]} showDetails={false} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Con relaciones</h3>
							<ImageCardImproved imageId={mockImageIds[2]} showRelations={true} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Alta prioridad</h3>
							<ImageCardImproved imageId={mockImageIds[3]} priority={true} />
						</div>

						<div className="border rounded-lg p-4 space-y-4">
							<h3 className="font-medium text-lg">Minimalista</h3>
							<ImageCardImproved imageId={mockImageIds[4]} variant="minimal" showTags={false} showDetails={false} />
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Rejilla con todas las imágenes */}
			<div className="border-t pt-8 mt-8">
				<h3 className="text-2xl font-bold mb-6">Todas las tarjetas</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{mockImageIds.map((id, index) => (
						<ImageCardImproved
							key={id}
							imageId={id}
							variant={
								index % 5 === 0
									? 'default'
									: index % 5 === 1
										? 'minimal'
										: index % 5 === 2
											? 'polaroid'
											: index % 5 === 3
												? 'tcg'
												: 'gallery'
							}
							isSelected={index === 2}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
