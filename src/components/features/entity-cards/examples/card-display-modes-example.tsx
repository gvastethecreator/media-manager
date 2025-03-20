'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import { useCardDisplay } from '../context/card-display-context';
import { EntityCardWrapper } from '../entity-card-wrapper';

// Ejemplo de entidad para mostrar
const exampleFolder = {
	id: 'folder-example-1',
	name: 'Documentos Importantes',
	description: 'Carpeta con documentos de trabajo importantes y confidenciales',
	path: '/documentos/',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	emoji: '📁',
	color: '#3b82f6',
	isFavorite: true,
	totalFiles: 24,
	totalSize: 128000000,
	featuredImage: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=350&fit=crop'
};

// Ejemplo de una colección
const exampleCollection = {
	id: 'collection-example-1',
	name: 'Paisajes Naturales',
	description: 'Colección de imágenes de paisajes naturales y escenarios impresionantes',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	emoji: '🏞️',
	color: '#10b981',
	isFavorite: true,
	_count: { images: 42 },
	platform: 'Unsplash',
	category: 'Naturaleza',
	rarity: 'uncommon',
	featuredImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&h=350&fit=crop'
};

// Componente de ejemplo
export function CardDisplayModesExample() {
	const { displayMode, setDisplayMode } = useCardDisplay();

	return (
		<div className="p-6 space-y-8">
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold">Sistema de Modos de Visualización</h2>
				<p className="text-muted-foreground">
					Este ejemplo muestra cómo funcionan los diferentes modos de visualización para tarjetas de entidades.
				</p>
			</div>

			<div className="flex justify-center gap-4 my-6">
				<Button
					variant={displayMode === 'simple' ? 'default' : 'outline'}
					onClick={() => setDisplayMode('simple')}
				>
					Modo Simple
				</Button>
				<Button
					variant={displayMode === 'complex' ? 'default' : 'outline'}
					onClick={() => setDisplayMode('complex')}
				>
					Modo Completo
				</Button>
				<Button
					variant={displayMode === 'json' ? 'default' : 'outline'}
					onClick={() => setDisplayMode('json')}
				>
					Modo JSON
				</Button>
			</div>

			<Tabs defaultValue="folder" className="w-full">
				<TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
					<TabsTrigger value="folder">Carpeta</TabsTrigger>
					<TabsTrigger value="collection">Colección</TabsTrigger>
				</TabsList>

				<TabsContent value="folder" className="mt-6">
					<Card className="p-6">
						<div className="mb-4">
							<h3 className="text-lg font-medium">Ejemplo de Carpeta</h3>
							<p className="text-sm text-muted-foreground">
								Visualización de una carpeta en modo {displayMode}.
							</p>
						</div>

						<div className="w-72 h-96 mx-auto">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
								key={`folder-${displayMode}`}
							>
								<EntityCardWrapper
									entityType="folder"
									entity={exampleFolder}
									title={exampleFolder.name}
									description={exampleFolder.description}
									image={exampleFolder.featuredImage}
									onClick={() => console.log('Carpeta clickeada')}
								/>
							</motion.div>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="collection" className="mt-6">
					<Card className="p-6">
						<div className="mb-4">
							<h3 className="text-lg font-medium">Ejemplo de Colección</h3>
							<p className="text-sm text-muted-foreground">
								Visualización de una colección en modo {displayMode}.
							</p>
						</div>

						<div className="w-72 h-96 mx-auto">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
								key={`collection-${displayMode}`}
							>
								<EntityCardWrapper
									entityType="collection"
									entity={exampleCollection}
									title={exampleCollection.name}
									description={exampleCollection.description}
									image={exampleCollection.featuredImage}
									onClick={() => console.log('Colección clickeada')}
								/>
							</motion.div>
						</div>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="bg-card p-4 rounded-lg border mt-6">
				<h3 className="font-medium mb-2">Modo Actual: {displayMode}</h3>
				<ul className="list-disc list-inside text-sm">
					<li className="text-muted-foreground">
						<strong>Simple:</strong> Optimizado para rendimiento, minimalista.
					</li>
					<li className="text-muted-foreground">
						<strong>Completo:</strong> Todos los efectos visuales y características avanzadas.
					</li>
					<li className="text-muted-foreground">
						<strong>JSON:</strong> Visualización completa de datos en formato JSON.
					</li>
				</ul>
			</div>
		</div>
	);
}