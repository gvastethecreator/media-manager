'use client';

import { EntityCard } from '@/components/features/entity-cards';
import { BasicCardExample } from '@/components/features/entity-cards/examples/basic-card-example';
import { CardDisplayModesExample } from '@/components/features/entity-cards/examples/card-display-modes-example';
import { OptimizedCardWithLayers } from '@/components/features/entity-cards/examples/optimized-card-with-layers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Copy, FileCode2, FileJson, Info, Layers, Palette, RefreshCw, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ViewProps } from '../types';

// Mocks y datos para ejemplos
const mockFolderEntity = {
	id: 'folder-123',
	name: 'Mi Carpeta',
	description: 'Ejemplo de carpeta para tarjetas de entidad',
	type: 'folder',
	entityType: 'folder',
	color: '#3b82f6',
	emoji: '📁',
	count: 15,
	createdAt: new Date().toISOString(),
};

const mockAlbumEntity = {
	id: 'album-123',
	name: 'Mi Álbum',
	description: 'Ejemplo de álbum para tarjetas de entidad',
	type: 'album',
	entityType: 'album',
	color: '#8b5cf6',
	emoji: '📷',
	count: 25,
	createdAt: new Date().toISOString(),
};

const mockTagEntity = {
	id: 'tag-123',
	name: 'Arte Digital',
	description: 'Etiqueta para imágenes de arte digital',
	type: 'tag',
	entityType: 'tag',
	color: '#f59e0b',
	count: 42,
};

export function EntityCardsView(_props: ViewProps) {
	const [currentTab, setCurrentTab] = useState('examples');

	return (
		<div className="h-full flex flex-col bg-background">
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				className="p-4 border-b flex justify-between items-center bg-card/20"
			>
				<div>
					<h1 className="text-2xl font-bold">Entity Cards</h1>
					<p className="text-sm text-muted-foreground">Sistema de visualización de tarjetas para entidades</p>
				</div>
				<div className="flex gap-2">
					<Button variant="ghost" size="icon">
						<RefreshCw className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</motion.div>

			<div className="flex-1 overflow-hidden">
				<Tabs defaultValue="examples" value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
					<div className="px-4 pt-2">
						<TabsList className="grid grid-cols-4 w-full max-w-2xl">
							<TabsTrigger value="examples" className="flex gap-2 items-center">
								<Palette className="h-4 w-4" />
								<span>Ejemplos</span>
							</TabsTrigger>
							<TabsTrigger value="documentation" className="flex gap-2 items-center">
								<FileCode2 className="h-4 w-4" />
								<span>Documentación</span>
							</TabsTrigger>
							<TabsTrigger value="layers" className="flex gap-2 items-center">
								<Layers className="h-4 w-4" />
								<span>Sistema de Capas</span>
							</TabsTrigger>
							<TabsTrigger value="debug" className="flex gap-2 items-center">
								<FileJson className="h-4 w-4" />
								<span>Depuración</span>
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="examples" className="flex-1 p-4 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
								<Card>
									<CardHeader>
										<CardTitle>Tarjetas Básicas</CardTitle>
										<CardDescription>
											Ejemplos de tarjetas de entidad en su forma más simple
										</CardDescription>
									</CardHeader>
									<CardContent className="flex flex-wrap gap-4 justify-center">
										<div className="w-[180px]">
											<EntityCard
												title="Carpeta de Proyectos"
												description="Contiene 24 proyectos activos"
												image="/images/folder-example.jpg"
												options={{
													primaryColor: '#3b82f6',
													enable3DEffect: true,
												}}
											/>
										</div>
										<div className="w-[180px]">
											<EntityCard
												title="Álbum de Verano"
												description="Fotos de vacaciones"
												image="/images/album-example.jpg"
												options={{
													primaryColor: '#8b5cf6',
													enableGlowEffect: true,
												}}
											/>
										</div>
										<div className="w-[180px]">
											<EntityCard
												title="Paisajes"
												description="Etiqueta con 56 imágenes"
												image="/images/tag-example.jpg"
												options={{
													primaryColor: '#f59e0b',
													enableHolographicEffect: true,
												}}
											/>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Ejemplo Complejo</CardTitle>
										<CardDescription>
											Uso avanzado con presets y opciones visuales completas
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex justify-center">
											<div className="w-[300px]">
												<BasicCardExample />
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="md:col-span-2">
									<CardHeader>
										<CardTitle>Modos de Visualización</CardTitle>
										<CardDescription>
											Diferentes formas de mostrar tarjetas de entidad
										</CardDescription>
									</CardHeader>
									<CardContent>
										<CardDisplayModesExample />
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="documentation" className="flex-1 p-4 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="max-w-3xl mx-auto prose dark:prose-invert">
								<ReactMarkdown>
									{`# Sistema de Entity Cards

## Introducción

El sistema Entity Cards proporciona una manera consistente y visualmente atractiva de mostrar diferentes tipos de entidades en la interfaz de usuario. Soporta múltiples tipos de entidades como carpetas, álbumes, etiquetas, personajes, lugares, objetos del mundo, etc.

## Componentes Principales

- **EntityCardWrapper**: Componente principal para uso general, con soporte para diferentes modos de visualización.
- **EntityCardAdapter**: Adaptador que selecciona el layout adecuado según el tipo de entidad.
- **EntityCard**: Versión simplificada para casos que requieren máximo rendimiento.

## Formas de Uso

### Uso Básico

\`\`\`tsx
import { EntityCard } from '@/components/features/entity-cards';

export function SimpleExample() {
  return (
    <EntityCard
      title="Mi Carpeta"
      description="Contiene archivos importantes"
      image="/ruta/a/imagen.jpg"
    />
  );
}
\`\`\`

### Uso con Adaptador

\`\`\`tsx
import { EntityCardAdapter } from '@/components/features/entity-cards';

export function AdapterExample() {
  const folderEntity = {
    id: 'folder-123',
    name: 'Mi Carpeta',
    // otros campos...
  };

  return (
    <EntityCardAdapter
      entityType="folder"
      entity={folderEntity}
      options={{
        enable3DEffect: true,
        enableGlowEffect: true,
      }}
    />
  );
}
\`\`\`

## Sistema de Presets

El sistema incluye presets visuales predefinidos para diferentes tipos de entidades, que se pueden personalizar:

- **folder-default**: Preset visual por defecto para carpetas
- **album-default**: Preset visual por defecto para álbumes
- **collection-default**: Preset visual por defecto para colecciones
- **tag-default**: Preset visual por defecto para etiquetas
- **character-default**: Preset visual por defecto para personajes
- **place-default**: Preset visual por defecto para lugares
- **worldItem-default**: Preset visual por defecto para objetos del mundo
- **concept-default**: Preset visual por defecto para conceptos
- **prompt-default**: Preset visual por defecto para prompts
- **note-default**: Preset visual por defecto para notas`}
								</ReactMarkdown>
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="layers" className="flex-1 p-4 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
								<Card>
									<CardHeader>
										<CardTitle>Sistema de Capas</CardTitle>
										<CardDescription>
											Visualización del sistema de capas para efectos visuales
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex justify-center">
											<div className="w-[320px]">
												<OptimizedCardWithLayers />
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Documentación de Capas</CardTitle>
										<CardDescription>
											Explicación técnica del sistema de capas
										</CardDescription>
									</CardHeader>
									<CardContent className="max-h-[500px] overflow-auto">
										<ReactMarkdown>
											{`# Sistema de Capas

El sistema de capas permite componer efectos visuales complejos mediante la superposición
de diferentes elementos gráficos, cada uno con su propia funcionalidad.

## Capas Disponibles

1. **Background**: Capa base que define el fondo de la tarjeta.
2. **Content**: Capa principal donde se muestra el contenido (imágenes, texto).
3. **Effects**: Capa para efectos visuales como brillos, sombras, etc.
4. **Holographic**: Capa para efectos holográficos y reflectantes.
5. **Border**: Capa para bordes decorativos o animados.
6. **Filter**: Capa superior para filtros como grano, escaneo, etc.

## Personalización

Cada capa puede configurarse individualmente:

\`\`\`tsx
options={{
  layerSystem: {
    order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
    layerBlending: 'screen',
    layerSpacing: 2,
  }
}}
\`\`\`

## Modos de Blending

- **normal**: Composición estándar
- **screen**: Mezcla aditiva, ideal para efectos de luz
- **multiply**: Mezcla sustractiva para sombras
- **overlay**: Contraste mejorado manteniendo detalles`}
										</ReactMarkdown>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="debug" className="flex-1 p-4 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Info className="h-5 w-5 text-amber-500" />
											<span>Herramientas de Depuración</span>
										</CardTitle>
										<CardDescription>
											Utiliza la barra de depuración superior para probar diferentes configuraciones
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground mb-4">
											El componente <code className="bg-muted text-primary px-1 py-0.5 rounded text-xs">CardDebugToolbar</code> está
											disponible globalmente en el contenedor de vistas y proporciona controles avanzados para probar todas las
											opciones disponibles en tiempo real.
										</p>

										<Button
											variant="outline"
											className="w-full gap-2"
											onClick={() => {/* Función para abrir documentación detallada */ }}
										>
											<FileCode2 className="h-4 w-4" />
											<span>Ver guía de depuración completa</span>
										</Button>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Copy className="h-5 w-5 text-blue-500" />
											<span>Código de Ejemplo</span>
										</CardTitle>
										<CardDescription>
											Código generado basado en la configuración actual
										</CardDescription>
									</CardHeader>
									<CardContent>
										<pre className={cn(
											"text-xs p-4 rounded-md bg-zinc-950 text-zinc-200 overflow-auto",
											"max-h-[200px]"
										)}>
											{`// Código generado automáticamente
import { EntityCard } from '@/components/features/entity-cards';

export function GeneratedExample() {
  return (
    <EntityCard
      title="My Entity"
      description="Description of this entity"
      image="/path/to/image.jpg"
      options={{
        primaryColor: '#3b82f6',
        enable3DEffect: true,
        enableGlowEffect: true,
        maxRotation: 10,
        designSystem: {
          preset: 'modern',
          cornerStyle: 'rounded',
          aspectRatio: '7/10',
        }
      }}
    />
  );
}`}
										</pre>
									</CardContent>
								</Card>
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}