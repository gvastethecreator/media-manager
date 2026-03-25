import { Database, ArrowLeft, Hash, Layers, Sparkles } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useProperty } from '@/lib/api/properties';

interface PropertyContentViewProps {
	className?: string;
	propertyId?: string;
}

/**
 * 🏷️ Vista de contenido de una propiedad específica
 * Muestra detalles, valores asociados e imágenes relacionadas
 */
export const PropertyContentView = memo(function PropertyContentView({
	className,
	propertyId,
}: PropertyContentViewProps) {
	const params = useParams<{ id: string }>();
	const navigate = useNavigate();
	const effectivePropertyId = propertyId || params.id;
	const { data: property, isLoading, error } = useProperty(effectivePropertyId || '');

	const relationEntries = useMemo(() => {
		if (!property?._count) {
			return [];
		}

		return Object.entries(property._count)
			.filter(([, value]) => value > 0)
			.sort((a, b) => b[1] - a[1]);
	}, [property?._count]);

	const headerControls = effectivePropertyId ? (
		<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
			<ArrowLeft className="h-4 w-4" />
			Volver
		</Button>
	) : undefined;

	// Estado de no selección
	if (!effectivePropertyId) {
		return (
			<div className={className}>
				<EmptyState
					description="Selecciona una propiedad desde la vista de propiedades para ver su contenido."
					icon={Database}
					title="No hay propiedad seleccionada"
				/>
			</div>
		);
	}

	// Estado de carga
	if (isLoading) {
		return (
			<BaseContentView
				className={className}
				description="Obteniendo información de la propiedad."
				headerControls={headerControls}
				icon="🏷️"
				title="Cargando propiedad..."
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Obteniendo información de la propiedad."
						icon={Database}
						title="Cargando propiedad..."
					/>
				</div>
			</BaseContentView>
		);
	}

	// Estado de error o sin datos
	if (error || !property) {
		return (
			<BaseContentView
				className={className}
				description={error instanceof Error ? error.message : 'No se pudo cargar la propiedad'}
				headerControls={headerControls}
				icon="🏷️"
				title="Propiedad no disponible"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description={error instanceof Error ? error.message : 'No se pudo cargar la propiedad seleccionada.'}
						icon={Database}
						title="Propiedad no disponible"
					/>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			className={className}
			description={property.category || 'Propiedad reutilizable del sistema'}
			headerControls={headerControls}
			icon="🏷️"
			title={property.name}
		>
			<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
				<div className="space-y-4">
					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Descripción</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							{property.description || 'Esta propiedad no tiene descripción adicional todavía.'}
						</p>
					</Card>

					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Hash className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Valor y metadatos</h3>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Valor</p>
								<p className="mt-1 font-medium">{String(property.value ?? '—')}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Shortcut</p>
								<p className="mt-1 font-medium">{property.shortcut || 'Sin atajo'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Favorita</p>
								<p className="mt-1 font-medium">{property.isFavorite ? 'Sí' : 'No'}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs uppercase tracking-wide">Actualizada</p>
								<p className="mt-1 font-medium">{new Date(property.updatedAt).toLocaleString()}</p>
							</div>
						</div>
					</Card>
				</div>

				<div className="space-y-4">
					<Card className="p-4">
						<div className="mb-3 flex items-center gap-2">
							<Layers className="h-4 w-4 text-primary" />
							<h3 className="font-semibold">Relaciones</h3>
						</div>
						{relationEntries.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{relationEntries.map(([key, value]) => (
									<Badge key={key} variant="secondary">
										{key}: {value}
									</Badge>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">Esta propiedad aún no está enlazada a otras entidades.</p>
						)}
					</Card>

					<Card className="p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wide">Categoría</p>
						<p className="mt-1 font-medium">{property.category || 'Sin categoría'}</p>
						{property.emoji && <p className="mt-3 text-2xl">{property.emoji}</p>}
					</Card>
				</div>
			</div>
		</BaseContentView>
	);
});

PropertyContentView.displayName = 'PropertyContentView';
