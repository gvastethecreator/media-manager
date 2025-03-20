'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EntityCardWrapper } from '../entity-card-wrapper';

// Datos de ejemplo
const folderExample = {
	id: 'folder-1',
	name: 'Documentos Importantes',
	description: 'Carpeta con documentos legales y facturas personales',
	fileCount: 12,
	totalSize: '45.8 MB',
	lastUpdated: '2023-09-15T14:30:00Z',
};

const albumExample = {
	id: 'album-1',
	name: 'Vacaciones 2023',
	description: 'Fotos de nuestro viaje a la playa',
	imageCount: 87,
	coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
	tags: ['playa', 'vacaciones', 'familia'],
};

const characterExample = {
	id: 'character-1',
	name: 'Elyra Nightshade',
	description: 'Maga elfa especializada en hechizos arcanos',
	class: 'Maga',
	race: 'Elfa',
	level: 8,
	alignment: 'Neutral Bueno',
	image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
	stats: {
		strength: 10,
		dexterity: 16,
		constitution: 12,
		intelligence: 18,
		wisdom: 14,
		charisma: 13,
	},
};

const worldItemExample = {
	id: 'item-1',
	name: 'Amuleto de Azura',
	description: 'Un antiguo amuleto mágico que brilla con luz propia',
	type: 'Artefacto',
	rarity: 'legendary',
	origin: 'Ruinas de Eldrath',
	image: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e',
	properties: [
		{ name: 'Poder Arcano', value: '+3' },
		{ name: 'Resistencia Mágica', value: '25%' },
		{ name: 'Efecto Especial', value: 'Protección contra No-muertos' },
	],
};

/**
 * Ejemplo de tarjetas de entidad con diferentes configuraciones
 */
export function BasicCardExample() {
	// Estado para configuraciones
	const [displayMode, setDisplayMode] = useState<'simple' | 'complex' | 'skeleton' | 'json'>('complex');
	const [entityType, setEntityType] = useState<'folder' | 'album' | 'character' | 'worldItem'>('folder');
	const [enableHolographic, setEnableHolographic] = useState(false);
	const [enableGlow, setEnableGlow] = useState(true);
	const [enableExplode, setEnableExplode] = useState(false);

	// Obtener datos de entidad según el tipo seleccionado
	const getEntityData = () => {
		switch (entityType) {
			case 'folder':
				return folderExample;
			case 'album':
				return albumExample;
			case 'character':
				return characterExample;
			case 'worldItem':
				return worldItemExample;
			default:
				return folderExample;
		}
	};

	// Función para seleccionar color primario según el tipo de entidad
	const getPrimaryColor = () => {
		switch (entityType) {
			case 'folder':
				return '#3b82f6'; // Azul
			case 'album':
				return '#2980b9'; // Azul oscuro
			case 'character':
				return '#d35400'; // Naranja
			case 'worldItem':
				return '#f39c12'; // Amarillo dorado
			default:
				return '#3b82f6';
		}
	};

	// Calcular opciones de visualización
	const getCardOptions = () => {
		return {
			displayMode,
			enableHolographicEffect: enableHolographic,
			enableGlowEffect: enableGlow,
			primaryColor: getPrimaryColor(),
			designSystem: {
				preset: entityType,
				cornerStyle: 'rounded',
				cornerRadius: 12,
				borderWidth: 2,
				elevation: 3,
				aspectRatio: '7/10',
			},
			layers: {
				explodeView: enableExplode,
				explodeDistance: 20,
			},
			glowOptions: {
				intensity: 0.7,
				color: getPrimaryColor(),
				blurAmount: 15,
			},
			holographicOptions: {
				intensity: 0.6,
				patternType: 'rainbow',
				animationSpeed: 1.5,
			},
		};
	};

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			<h1 className="text-2xl font-bold">Entity Cards - Ejemplo Básico</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div className="md:col-span-1 space-y-6 bg-card p-4 rounded-lg border">
					<h2 className="text-lg font-medium">Configuración</h2>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Tipo de Entidad</Label>
							<Select
								value={entityType}
								onValueChange={(value) => setEntityType(value as any)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="folder">Carpeta</SelectItem>
									<SelectItem value="album">Álbum</SelectItem>
									<SelectItem value="character">Personaje</SelectItem>
									<SelectItem value="worldItem">Objeto del mundo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Modo de Visualización</Label>
							<Select
								value={displayMode}
								onValueChange={(value) => setDisplayMode(value as any)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar modo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="simple">Simple (Alto rendimiento)</SelectItem>
									<SelectItem value="complex">Complejo (Efectos visuales)</SelectItem>
									<SelectItem value="skeleton">Esqueleto (Sin efectos)</SelectItem>
									<SelectItem value="json">JSON (Datos brutos)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="holographic">Efecto Holográfico</Label>
								<Switch
									id="holographic"
									checked={enableHolographic}
									onCheckedChange={setEnableHolographic}
									disabled={displayMode !== 'complex'}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="glow">Efecto Resplandor</Label>
								<Switch
									id="glow"
									checked={enableGlow}
									onCheckedChange={setEnableGlow}
									disabled={displayMode !== 'complex'}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="explode">Vista Explotada</Label>
								<Switch
									id="explode"
									checked={enableExplode}
									onCheckedChange={setEnableExplode}
									disabled={displayMode === 'json' || displayMode === 'simple'}
								/>
							</div>
						</div>

						<div className="pt-4">
							<Button
								variant="outline"
								className="w-full"
								onClick={() => {
									setEnableHolographic(false);
									setEnableGlow(true);
									setEnableExplode(false);
									setDisplayMode('complex');
								}}
							>
								Restablecer Configuración
							</Button>
						</div>
					</div>
				</div>

				<div className="md:col-span-2">
					<Tabs defaultValue="preview" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="preview">Vista Previa</TabsTrigger>
							<TabsTrigger value="code">Código</TabsTrigger>
						</TabsList>

						<TabsContent value="preview" className="p-0">
							<div className="bg-muted/30 p-8 rounded-lg min-h-[400px] flex items-center justify-center">
								<div className="w-64 h-96">
									<EntityCardWrapper
										entityType={entityType}
										entity={getEntityData()}
										options={getCardOptions()}
										onClick={() => console.log(`Clic en ${entityType}`, getEntityData())}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="code">
							<pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs">
								{`
// Importaciones
import { EntityCardWrapper } from '@/components/features/entity-cards';

// Datos de la entidad
const ${entityType} = ${JSON.stringify(getEntityData(), null, 2)};

// Componente
<EntityCardWrapper
  entityType="${entityType}"
  entity={${entityType}}
  options={${JSON.stringify(getCardOptions(), null, 2)}}
  onClick={() => handleClick(${entityType}.id)}
/>
                `}
							</pre>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8">
				<div>
					<h3 className="text-sm font-medium mb-2">Carpeta</h3>
					<div className="h-48">
						<EntityCardWrapper
							entityType="folder"
							entity={folderExample}
							options={{
								displayMode: 'simple',
								primaryColor: '#3b82f6',
							}}
						/>
					</div>
				</div>

				<div>
					<h3 className="text-sm font-medium mb-2">Álbum</h3>
					<div className="h-48">
						<EntityCardWrapper
							entityType="album"
							entity={albumExample}
							options={{
								displayMode: 'simple',
								primaryColor: '#2980b9',
							}}
						/>
					</div>
				</div>

				<div>
					<h3 className="text-sm font-medium mb-2">Personaje</h3>
					<div className="h-48">
						<EntityCardWrapper
							entityType="character"
							entity={characterExample}
							options={{
								displayMode: 'simple',
								primaryColor: '#d35400',
							}}
						/>
					</div>
				</div>

				<div>
					<h3 className="text-sm font-medium mb-2">Objeto</h3>
					<div className="h-48">
						<EntityCardWrapper
							entityType="worldItem"
							entity={worldItemExample}
							options={{
								displayMode: 'simple',
								primaryColor: '#f39c12',
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}