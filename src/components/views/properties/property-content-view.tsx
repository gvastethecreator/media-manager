import { ArrowLeft, Database, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PropertyContentViewProps {
	className?: string;
}

/**
 * 🏷️ Vista de contenido de una propiedad específica
 * Muestra detalles, valores asociados e imágenes relacionadas
 */
export const PropertyContentView = memo(function PropertyContentView({ className }: PropertyContentViewProps) {
	// TODO: Implementar lógica de selección de propiedad desde el store
	// const { selectedProperty } = usePropertyStore();

	// Datos mock mientras se implementa la lógica real
	const mockProperty = {
		id: '1',
		name: 'Estilo Artístico',
		description: 'Clasificación del estilo visual de las imágenes',
		type: 'enum',
		color: '#3b82f6',
		values: ['Realista', 'Anime', 'Cartoon', 'Abstracto'],
		_count: { images: 142 },
	};

	return (
		<div className="flex h-full flex-col">
			{/* 📋 Header con información básica */}
			<div className="shrink-0 border-b bg-background/50 backdrop-blur-sm">
				<div className="flex items-center gap-3 px-6 py-4">
					<Button className="shrink-0" size="sm" variant="ghost">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Volver a Propiedades
					</Button>

					<div className="flex min-w-0 flex-1 items-center gap-3">
						<div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: mockProperty.color }} />
						<div className="min-w-0 flex-1">
							<h1 className="flex items-center gap-2 truncate font-semibold text-xl">
								<Database className="h-5 w-5 text-blue-500" />
								{mockProperty.name}
							</h1>
							<p className="truncate text-muted-foreground text-sm">{mockProperty.description}</p>
						</div>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						<Badge variant="secondary">{mockProperty._count.images} imágenes</Badge>
						<Button size="sm" variant="outline">
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Button>
						<Button size="sm" variant="outline">
							<Trash2 className="mr-2 h-4 w-4" />
							Eliminar
						</Button>
					</div>
				</div>
			</div>

			{/* 📊 Contenido principal */}
			<div className="flex-1 overflow-auto p-6">
				<div className="mx-auto max-w-6xl space-y-6">
					{/* 📋 Información de la propiedad */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Información de la Propiedad
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{' '}
								<div>
									<div className="font-medium text-muted-foreground text-sm">Tipo</div>
									<p className="mt-1 rounded bg-muted px-2 py-1 font-mono text-sm">{mockProperty.type}</p>
								</div>
								<div>
									<div className="font-medium text-muted-foreground text-sm">Color</div>
									<div className="mt-1 flex items-center gap-2">
										<div className="h-6 w-6 rounded border" style={{ backgroundColor: mockProperty.color }} />
										<span className="font-mono text-sm">{mockProperty.color}</span>
									</div>
								</div>
							</div>
							{/* 🏷️ Valores disponibles */}{' '}
							<div>
								<div className="font-medium text-muted-foreground text-sm">Valores Disponibles</div>
								<div className="mt-2 flex flex-wrap gap-2">
									{mockProperty.values.map((value, index) => (
										<motion.div
											animate={{ opacity: 1, scale: 1 }}
											initial={{ opacity: 0, scale: 0.9 }}
											key={value}
											transition={{ delay: index * 0.1 }}
										>
											<Badge className="text-sm" variant="outline">
												{value}
											</Badge>
										</motion.div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* 🖼️ Galería de imágenes asociadas */}
					<Card>
						<CardHeader>
							<CardTitle>Imágenes Asociadas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="py-12 text-center text-muted-foreground">
								<Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
								<p>Funcionalidad de galería en desarrollo</p>
								<p className="mt-2 text-sm">
									Se mostrará aquí la galería de imágenes que tienen esta propiedad asignada
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
});

PropertyContentView.displayName = 'PropertyContentView';
