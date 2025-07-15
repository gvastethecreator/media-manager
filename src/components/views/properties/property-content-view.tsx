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
export const PropertyContentView = memo(function PropertyContentView({ _className }: PropertyContentViewProps) {
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
		<div className="h-full flex flex-col">
			{/* 📋 Header con información básica */}
			<div className="shrink-0 border-b bg-background/50 backdrop-blur-sm">
				<div className="flex items-center gap-3 px-6 py-4">
					<Button variant="ghost" size="sm" className="shrink-0">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Volver a Propiedades
					</Button>

					<div className="flex items-center gap-3 min-w-0 flex-1">
						<div className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: mockProperty.color }} />
						<div className="min-w-0 flex-1">
							<h1 className="text-xl font-semibold truncate flex items-center gap-2">
								<Database className="h-5 w-5 text-blue-500" />
								{mockProperty.name}
							</h1>
							<p className="text-sm text-muted-foreground truncate">{mockProperty.description}</p>
						</div>
					</div>

					<div className="shrink-0 flex items-center gap-2">
						<Badge variant="secondary">{mockProperty._count.images} imágenes</Badge>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
						<Button variant="outline" size="sm">
							<Trash2 className="h-4 w-4 mr-2" />
							Eliminar
						</Button>
					</div>
				</div>
			</div>

			{/* 📊 Contenido principal */}
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* 📋 Información de la propiedad */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								Información de la Propiedad
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{' '}
								<div>
									<div className="text-sm font-medium text-muted-foreground">Tipo</div>
									<p className="mt-1 font-mono text-sm bg-muted px-2 py-1 rounded">{mockProperty.type}</p>
								</div>
								<div>
									<div className="text-sm font-medium text-muted-foreground">Color</div>
									<div className="mt-1 flex items-center gap-2">
										<div className="w-6 h-6 rounded border" style={{ backgroundColor: mockProperty.color }} />
										<span className="font-mono text-sm">{mockProperty.color}</span>
									</div>
								</div>
							</div>
							{/* 🏷️ Valores disponibles */}{' '}
							<div>
								<div className="text-sm font-medium text-muted-foreground">Valores Disponibles</div>
								<div className="mt-2 flex flex-wrap gap-2">
									{mockProperty.values.map((value, index) => (
										<motion.div
											key={value}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: index * 0.1 }}
										>
											<Badge variant="outline" className="text-sm">
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
							<div className="text-center py-12 text-muted-foreground">
								<Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Funcionalidad de galería en desarrollo</p>
								<p className="text-sm mt-2">
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
