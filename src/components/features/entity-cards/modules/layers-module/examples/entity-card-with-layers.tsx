'use client';

/**
 * 🧪 Ejemplo de EntityCard con sistema de capas
 *
 * Este componente muestra cómo integrar el sistema de capas
 * con una tarjeta de entidad.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayersIcon, Settings2Icon } from 'lucide-react';
import { useState } from 'react';
import { LayerPluginProvider } from '../../../../layers/layer-plugin-system';
import type { EntityCardProps } from '../../../entity-card';
import { EntityCard } from '../../../entity-card';
import { LayerManagementButton } from '../layer-management-dialog';
import { RegisterEntityTypeLayers } from '../register-layers';
import { useEntityCardLayers } from '../use-entity-card-layers';

export interface EntityCardWithLayersExampleProps {
	entityType?: string;
	title?: string;
	subtitle?: string;
	imageUrl?: string;
	className?: string;
}

/**
 * Componente de ejemplo que muestra una EntityCard con sistema de capas
 */
export function EntityCardWithLayersExample({
	entityType = 'image',
	title = 'Ejemplo de tarjeta',
	subtitle = 'Con sistema de capas',
	imageUrl = 'https://picsum.photos/300/200',
	className,
}: EntityCardWithLayersExampleProps) {
	// Registrar capas para este tipo de entidad
	return (
		<>
			<LayerPluginProvider>
				<RegisterEntityTypeLayers entityType={entityType} />
			</LayerPluginProvider>
			<EntityCardWithLayersContent
				entityType={entityType}
				title={title}
				subtitle={subtitle}
				imageUrl={imageUrl}
				className={className}
			/>
		</>
	);
}

/**
 * Contenido principal del ejemplo
 */
function EntityCardWithLayersContent({
	entityType,
	title,
	subtitle,
	imageUrl,
	className,
}: EntityCardWithLayersExampleProps) {
	// Usar el hook de capas para EntityCard
	const { layerConfig, cardProps, updateLayerConfig, resetToDefaults } = useEntityCardLayers({
		entityType,
		initialProps: {
			title,
			subtitle,
			imageUrl,
		},
		autoSave: true,
	});

	// Estado para mostrar código JSON
	const [showJson, setShowJson] = useState(false);

	// Propiedades base para la tarjeta
	const baseProps: EntityCardProps = {
		entityType,
		title,
		subtitle,
		imageUrl,
		// Propiedades adicionales específicas del tipo de entidad
		...(entityType === 'folder'
			? {
					itemCount: 42,
					icon: 'folder',
				}
			: {}),
		...(entityType === 'album'
			? {
					itemCount: 24,
					icon: 'album',
					thumbnails: [
						'https://picsum.photos/100/100?random=1',
						'https://picsum.photos/100/100?random=2',
						'https://picsum.photos/100/100?random=3',
					],
				}
			: {}),
		...(entityType === 'tag'
			? {
					icon: 'tag',
					color: '#f59e0b',
				}
			: {}),
	};

	// Combinar propiedades base con las derivadas del sistema de capas
	const combinedProps: EntityCardProps = {
		...baseProps,
		...cardProps,
	};

	return (
		<Card className="w-full max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle>Ejemplo de EntityCard con sistema de capas</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="flex flex-col items-center justify-center">
						<div className="mb-4 text-center text-sm text-muted-foreground">
							Tarjeta con sistema de capas ({entityType})
						</div>
						<EntityCard {...combinedProps} className="w-64 h-64" />
						<div className="mt-4 flex justify-center">
							<LayerManagementButton entityType={entityType} config={layerConfig} onChange={updateLayerConfig} />
						</div>
					</div>

					<div className="flex flex-col">
						<Tabs defaultValue="info">
							<TabsList className="mb-4">
								<TabsTrigger value="info">Información</TabsTrigger>
								<TabsTrigger value="json" onClick={() => setShowJson(true)}>
									Configuración JSON
								</TabsTrigger>
							</TabsList>

							<TabsContent value="info" className="space-y-4">
								<div>
									<h3 className="text-lg font-medium mb-2">Sobre este ejemplo</h3>
									<p className="text-sm text-muted-foreground">
										Este ejemplo muestra cómo integrar el sistema de capas con EntityCard. Puedes personalizar las capas
										haciendo clic en el botón &quot;Gestionar Capas&quot;.
									</p>
								</div>

								<div>
									<h3 className="text-lg font-medium mb-2">Características</h3>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
										<li>Configuración de capas específica por tipo de entidad</li>
										<li>Presets predefinidos para diferentes estilos</li>
										<li>Personalización detallada de cada capa</li>
										<li>Almacenamiento persistente de configuraciones</li>
									</ul>
								</div>

								<div className="pt-4">
									<Button variant="outline" size="sm" onClick={resetToDefaults} className="w-full">
										<Settings2Icon className="mr-2 h-4 w-4" />
										Restablecer a valores predeterminados
									</Button>
								</div>
							</TabsContent>

							<TabsContent value="json">
								{showJson && (
									<pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
										{JSON.stringify(layerConfig, null, 2)}
									</pre>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between text-sm text-muted-foreground">
				<div className="flex items-center">
					<LayersIcon className="mr-2 h-4 w-4" />
					Sistema de capas para EntityCard
				</div>
				<div>
					Tipo de entidad: <span className="font-medium">{entityType}</span>
				</div>
			</CardFooter>
		</Card>
	);
}

/**
 * Componente para mostrar ejemplos de diferentes tipos de entidad
 */
export function EntityCardLayersExamples() {
	const [activeTab, setActiveTab] = useState('image');

	return (
		<div className="space-y-8">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-8">
					<TabsTrigger value="image">Imagen</TabsTrigger>
					<TabsTrigger value="folder">Carpeta</TabsTrigger>
					<TabsTrigger value="album">Álbum</TabsTrigger>
					<TabsTrigger value="tag">Etiqueta</TabsTrigger>
				</TabsList>

				<TabsContent value="image">
					<EntityCardWithLayersExample
						entityType="image"
						title="Imagen de ejemplo"
						subtitle="Fotografía de paisaje"
						imageUrl="https://picsum.photos/300/200?nature"
					/>
				</TabsContent>

				<TabsContent value="folder">
					<EntityCardWithLayersExample
						entityType="folder"
						title="Carpeta de proyectos"
						subtitle="42 elementos"
						imageUrl="https://picsum.photos/300/200?folder"
					/>
				</TabsContent>

				<TabsContent value="album">
					<EntityCardWithLayersExample
						entityType="album"
						title="Álbum de vacaciones"
						subtitle="24 fotos"
						imageUrl="https://picsum.photos/300/200?album"
					/>
				</TabsContent>

				<TabsContent value="tag">
					<EntityCardWithLayersExample
						entityType="tag"
						title="Etiqueta: Naturaleza"
						subtitle="128 elementos"
						imageUrl="https://picsum.photos/300/200?tag"
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
