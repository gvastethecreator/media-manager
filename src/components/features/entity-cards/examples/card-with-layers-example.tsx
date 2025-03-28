'use client';

import { EntityCard, EntityCardLayersProvider, RegisterAllLayers } from '@/components/features/entity-cards';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export function EntityCardWithLayersExample() {
	// Estado para controlar las opciones de capas
	const [enableLayers, setEnableLayers] = useState(true);
	const [explodeLayers, setExplodeLayers] = useState(false);
	const [activeLayer, setActiveLayer] = useState<string | null>(null);

	// Datos de ejemplo para la tarjeta
	const exampleCardData = {
		id: 'example-card-1',
		title: 'Tarjeta con Capas',
		description: 'Este es un ejemplo de tarjeta con el sistema de capas integrado.',
		image: 'https://picsum.photos/300/400',
		metadata: {
			Autor: 'Sistema de Capas',
			Versión: '1.0.0',
			Capas: 'Habilitadas',
		},
	};

	return (
		<EntityCardLayersProvider>
			<RegisterAllLayers />

			<div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto p-4">
				{/* Panel de control */}
				<Card className="p-4 flex-1">
					<h2 className="text-lg font-medium mb-4">Configuración de Capas</h2>

					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">Habilitar Capas</h3>
								<p className="text-sm text-muted-foreground">Activa o desactiva el sistema de capas</p>
							</div>
							<Switch checked={enableLayers} onCheckedChange={setEnableLayers} />
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">Vista Explotada</h3>
								<p className="text-sm text-muted-foreground">Muestra las capas separadas</p>
							</div>
							<Switch checked={explodeLayers} onCheckedChange={setExplodeLayers} disabled={!enableLayers} />
						</div>

						<Separator />

						<div>
							<h3 className="font-medium mb-2">Capa Activa</h3>
							<div className="grid grid-cols-2 gap-2">
								{['image', 'border', 'glow', 'content'].map((layer) => (
									<Button
										key={layer}
										variant={activeLayer === layer ? 'default' : 'outline'}
										size="sm"
										onClick={() => setActiveLayer(activeLayer === layer ? null : layer)}
										disabled={!enableLayers}
										className="capitalize"
									>
										{layer}
									</Button>
								))}
							</div>
						</div>

						<Separator />

						<Button
							variant="secondary"
							onClick={() => {
								setEnableLayers(true);
								setExplodeLayers(true);
								setActiveLayer(null);
							}}
						>
							Resetear Configuración
						</Button>
					</div>
				</Card>

				{/* Vista previa de la tarjeta */}
				<div className="flex items-center justify-center flex-1">
					<EntityCard
						{...exampleCardData}
						options={{
							primaryColor: '#3b82f6',
							secondaryColor: '#1e40af',
							enableLayers,
							explodeLayers,
							activeLayer,
						}}
					/>
				</div>
			</div>
		</EntityCardLayersProvider>
	);
}
