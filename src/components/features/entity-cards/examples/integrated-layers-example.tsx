'use client';

import {
	EntityCard,
	EntityCardLayersProvider,
	LayersConfigPanel,
	LayersPanel,
	RegisterAllLayers
} from '@/components/features/entity-cards';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export function IntegratedLayersExample() {
	// Estado para controlar las opciones de capas
	const [enableLayers, setEnableLayers] = useState(true);
	const [explodeLayers, setExplodeLayers] = useState(false);
	const [activeLayer, setActiveLayer] = useState<string | null>(null);

	// Datos de ejemplo para varias tarjetas
	const exampleCards = [
		{
			id: 'card-1',
			title: 'Tarjeta Básica',
			description: 'Una tarjeta con capas básicas y efectos visuales.',
			image: 'https://picsum.photos/id/237/300/400',
			metadata: {
				'Tipo': 'Básica',
				'Capas': '3'
			}
		},
		{
			id: 'card-2',
			title: 'Tarjeta Avanzada',
			description: 'Incluye capas de efectos visuales avanzados con animaciones.',
			image: 'https://picsum.photos/id/1015/300/400',
			metadata: {
				'Tipo': 'Avanzada',
				'Capas': '5+'
			}
		},
		{
			id: 'card-3',
			title: 'Tarjeta Premium',
			description: 'Efectos holográficos, distorsiones y capas animadas complejas.',
			image: 'https://picsum.photos/id/1025/300/400',
			metadata: {
				'Tipo': 'Premium',
				'Capas': '8+'
			}
		}
	];

	return (
		<EntityCardLayersProvider>
			<RegisterAllLayers />

			<div className="max-w-6xl mx-auto p-4">
				<div className="grid grid-cols-1 gap-8">
					<Card className="p-6">
						<h2 className="text-2xl font-bold mb-4">Sistema de Capas Integrado</h2>
						<p className="text-muted-foreground mb-6">
							Este ejemplo muestra la integración completa del sistema de capas con EntityCard,
							permitiendo visualizar, configurar y personalizar las capas de las tarjetas.
						</p>

						<div className="mb-6">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="font-medium">Opciones Globales</h3>
									<p className="text-sm text-muted-foreground">Configuración aplicada a todas las tarjetas</p>
								</div>
								<div className="flex gap-4">
									<div className="flex items-center gap-2">
										<span className="text-sm">Capas</span>
										<Switch checked={enableLayers} onCheckedChange={setEnableLayers} />
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm">Vista Explotada</span>
										<Switch
											checked={explodeLayers}
											onCheckedChange={setExplodeLayers}
											disabled={!enableLayers}
										/>
									</div>
								</div>
							</div>
						</div>

						<Separator className="my-6" />

						<Tabs defaultValue="preview" className="w-full">
							<TabsList className="mb-4">
								<TabsTrigger value="preview">Vista Previa</TabsTrigger>
								<TabsTrigger value="configuration">Configuración</TabsTrigger>
								<TabsTrigger value="layers">Capas Disponibles</TabsTrigger>
							</TabsList>

							<TabsContent value="preview" className="p-4">
								<div className="flex flex-wrap justify-center gap-8">
									{exampleCards.map(card => (
										<EntityCard
											key={card.id}
											{...card}
											options={{
												enableLayers,
												explodeLayers,
												activeLayer
											}}
										/>
									))}
								</div>
							</TabsContent>

							<TabsContent value="configuration" className="p-4">
								<div className="bg-card border rounded-lg p-4">
									{activeLayer ? (
										<div>
											<h3 className="text-lg font-medium mb-4">Configuración de Capa: {activeLayer}</h3>
											<LayersConfigPanel
												options={{}}
												onOptionsChange={() => { }}
												entityType="entity-card"
												entityId={exampleCards[0].id}
												activeLayer={activeLayer}
											/>
										</div>
									) : (
										<div className="text-center py-8">
											<p className="text-muted-foreground">Selecciona una capa para configurarla</p>
											<div className="mt-4">
												<Button
													variant="outline"
													onClick={() => setActiveLayer('image')}
												>
													Configurar Capa de Imagen
												</Button>
											</div>
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent value="layers" className="p-4">
								<div className="bg-card border rounded-lg p-4">
									<h3 className="text-lg font-medium mb-4">Capas Disponibles</h3>
									<LayersPanel
										onLayerSelect={setActiveLayer}
										activeLayer={activeLayer}
									/>
								</div>
							</TabsContent>
						</Tabs>
					</Card>
				</div>
			</div>
		</EntityCardLayersProvider>
	);
}