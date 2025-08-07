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
		<div className="container mx-auto space-y-8 py-6">
			<div>
				<h2 className="mb-2 font-bold text-3xl">Tarjetas de Imagen</h2>
				<p className="text-muted-foreground">
					Componente mejorado para mostrar imágenes con diferentes estilos y funcionalidades
				</p>
			</div>

			<Tabs className="w-full" defaultValue="variants">
				<TabsList className="mb-4">
					<TabsTrigger value="variants">Variantes Visuales</TabsTrigger>
					<TabsTrigger value="aspect-ratios">Proporciones</TabsTrigger>
					<TabsTrigger value="states">Estados</TabsTrigger>
					<TabsTrigger value="options">Opciones</TabsTrigger>
				</TabsList>

				{/* Pestaña: Variantes visuales */}
				<TabsContent value="variants">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Default</h3>
							<div className="h-96 w-full">
								<ImageCardImproved className="h-full" imageId={mockImageIds[0]} variant="default" />
							</div>
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Minimal</h3>
							<div className="h-96 w-full">
								<ImageCardImproved className="h-full" imageId={mockImageIds[1]} variant="minimal" />
							</div>
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Polaroid</h3>
							<div className="h-96 w-full">
								<ImageCardImproved className="h-full" imageId={mockImageIds[2]} variant="polaroid" />
							</div>
						</div>

						<div className="dark space-y-4 rounded-lg border bg-gray-950 p-4">
							<h3 className="font-medium text-lg text-white">Variante TCG</h3>
							<div className="h-96 w-full">
								<ImageCardImproved className="h-full" imageId={mockImageIds[3]} variant="tcg" />
							</div>
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Variante Gallery</h3>
							<div className="h-96 w-full">
								<ImageCardImproved className="h-full" imageId={mockImageIds[4]} variant="gallery" />
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Proporciones de aspecto */}
				<TabsContent value="aspect-ratios">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">1:1 (Square)</h3>
							<ImageCardImproved aspectRatio="square" imageId={mockImageIds[0]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">16:9 (Video)</h3>
							<ImageCardImproved aspectRatio="video" imageId={mockImageIds[1]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">3:2 (Foto)</h3>
							<ImageCardImproved aspectRatio="3/2" imageId={mockImageIds[2]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">4:5 (Portrait)</h3>
							<ImageCardImproved aspectRatio="4/5" imageId={mockImageIds[3]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">2:1 (Panorámica)</h3>
							<ImageCardImproved aspectRatio="2/1" imageId={mockImageIds[4]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Auto (Sin restricción)</h3>
							<ImageCardImproved aspectRatio="auto" imageId={mockImageIds[5]} />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Estados */}
				<TabsContent value="states">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Normal</h3>
							<ImageCardImproved imageId={mockImageIds[0]} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Seleccionada</h3>
							<ImageCardImproved imageId={mockImageIds[1]} isSelected={true} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">No Hovereable</h3>
							<ImageCardImproved imageId={mockImageIds[2]} isHoverable={false} />
						</div>
					</div>
				</TabsContent>

				{/* Pestaña: Opciones */}
				<TabsContent value="options">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Sin etiquetas</h3>
							<ImageCardImproved imageId={mockImageIds[0]} showTags={false} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Sin detalles</h3>
							<ImageCardImproved imageId={mockImageIds[1]} showDetails={false} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Con relaciones</h3>
							<ImageCardImproved imageId={mockImageIds[2]} showRelations={true} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Alta prioridad</h3>
							<ImageCardImproved imageId={mockImageIds[3]} priority={true} />
						</div>

						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium text-lg">Minimalista</h3>
							<ImageCardImproved imageId={mockImageIds[4]} showDetails={false} showTags={false} variant="minimal" />
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Rejilla con todas las imágenes */}
			<div className="mt-8 border-t pt-8">
				<h3 className="mb-6 font-bold text-2xl">Todas las tarjetas</h3>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{mockImageIds.map((id, index) => (
						<ImageCardImproved
							imageId={id}
							isSelected={index === 2}
							key={id}
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
						/>
					))}
				</div>
			</div>
		</div>
	);
}
