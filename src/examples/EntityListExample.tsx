'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntityItem, EntityList } from '@/components/ui/entity-list';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
	BookIcon, CodeIcon, Dices, FolderIcon,
	ImageIcon, MapIcon, MessageSquare, SquareUser, Star,
	TagIcon, Upload, UsersIcon
} from 'lucide-react';
import { useState } from 'react';

export default function EntityListExample() {
	const { toast } = useToast();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [allowSelection, setAllowSelection] = useState(false);
	const [tcgMode, setTcgMode] = useState(false);

	// Datos de ejemplo para las entidades
	const mockEntities: EntityItem[] = [
		// Imágenes
		{
			id: '1',
			title: 'Amanecer en la montaña',
			subtitle: 'Naturaleza',
			description: 'Una hermosa imagen del amanecer en las montañas con colores vibrantes',
			icon: <ImageIcon className="h-5 w-5" />,
			primaryColor: '#FF6B6B',
			stats: [
				{ label: 'Resolución', value: '4K' },
				{ label: 'Tamaño', value: '8.2 MB' },
				{ label: 'Formato', value: 'JPG' }
			],
			category: 'Imágenes',
			tags: ['naturaleza', 'amanecer', 'montañas'],
			createdAt: new Date('2023-06-15'),
			updatedAt: new Date('2023-06-15'),
		},
		{
			id: '2',
			title: 'Ciudad nocturna',
			subtitle: 'Urbano',
			description: 'Vista panorámica de una ciudad moderna durante la noche con luces brillantes',
			icon: <ImageIcon className="h-5 w-5" />,
			primaryColor: '#4ECDC4',
			stats: [
				{ label: 'Resolución', value: '2K' },
				{ label: 'Tamaño', value: '5.7 MB' },
				{ label: 'Formato', value: 'PNG' }
			],
			category: 'Imágenes',
			tags: ['ciudad', 'noche', 'urbano'],
			createdAt: new Date('2023-07-22'),
			updatedAt: new Date('2023-08-05'),
		},

		// Carpetas
		{
			id: '3',
			title: 'Proyectos 2023',
			subtitle: '15 elementos',
			description: 'Carpeta principal que contiene todos los proyectos del año 2023',
			icon: <FolderIcon className="h-5 w-5" />,
			primaryColor: '#F9DC5C',
			stats: [
				{ label: 'Archivos', value: '42' },
				{ label: 'Tamaño', value: '1.2 GB' }
			],
			category: 'Carpetas',
			createdAt: new Date('2023-01-01'),
			updatedAt: new Date('2023-10-15'),
		},

		// Grupos
		{
			id: '4',
			title: 'Equipo de Diseño',
			subtitle: '8 miembros',
			description: 'Grupo de diseñadores trabajando en la interfaz de usuario',
			icon: <UsersIcon className="h-5 w-5" />,
			primaryColor: '#7209B7',
			secondaryColor: '#3A0CA3',
			stats: [
				{ label: 'Miembros', value: '8' },
				{ label: 'Proyectos', value: '12' },
				{ label: 'Activo', value: 'Sí' }
			],
			category: 'Grupos',
			tags: ['diseño', 'ui', 'creativo'],
			createdAt: new Date('2023-02-10'),
			updatedAt: new Date('2023-09-28'),
		},

		// Personajes
		{
			id: '5',
			title: 'Capitán Estelar',
			subtitle: 'Protagonista',
			description: 'Capitán de la nave Estelar, personaje principal de la saga espacial',
			icon: <SquareUser className="h-5 w-5" />,
			primaryColor: '#3A86FF',
			secondaryColor: '#8338EC',
			stats: [
				{ label: 'Nivel', value: '42' },
				{ label: 'Poder', value: 'Alto' },
				{ label: 'Tipo', value: 'Héroe' }
			],
			category: 'Personajes',
			tags: ['protagonista', 'espacial', 'héroe'],
			createdAt: new Date('2023-03-15'),
			updatedAt: new Date('2023-09-01'),
		},

		// Lugares
		{
			id: '6',
			title: 'Reino Perdido',
			subtitle: 'Mundo de fantasía',
			description: 'Un reino antiguo escondido entre las nieblas del tiempo, con arquitectura única',
			icon: <MapIcon className="h-5 w-5" />,
			primaryColor: '#588157',
			stats: [
				{ label: 'Tipo', value: 'Reino' },
				{ label: 'Clima', value: 'Templado' },
				{ label: 'Habitantes', value: '10K+' }
			],
			category: 'Lugares',
			tags: ['fantasía', 'medieval', 'misterioso'],
			createdAt: new Date('2023-04-05'),
			updatedAt: new Date('2023-08-20'),
		},

		// Propiedades
		{
			id: '7',
			title: 'Espada de Fuego',
			subtitle: 'Arma legendaria',
			description: 'Una espada forjada en el fuego de un dragón que nunca se apaga',
			icon: <Dices className="h-5 w-5" />,
			primaryColor: '#E63946',
			stats: [
				{ label: 'Daño', value: '75' },
				{ label: 'Rareza', value: 'Legendaria' },
				{ label: 'Elemento', value: 'Fuego' }
			],
			category: 'Propiedades',
			tags: ['arma', 'legendaria', 'fuego'],
			createdAt: new Date('2023-05-12'),
			updatedAt: new Date('2023-07-30'),
		},

		// Comodines
		{
			id: '8',
			title: 'Evento Aleatorio',
			subtitle: 'Sorpresa',
			description: 'Genera eventos aleatorios para añadir variedad a las escenas',
			icon: <Star className="h-5 w-5" />,
			primaryColor: '#FFD166',
			stats: [
				{ label: 'Tipo', value: 'Evento' },
				{ label: 'Rareza', value: 'Común' }
			],
			category: 'Comodines',
			tags: ['aleatorio', 'evento', 'variedad'],
			createdAt: new Date('2023-06-20'),
			updatedAt: new Date('2023-09-15'),
		},

		// Prompts
		{
			id: '9',
			title: 'Paisaje onírico',
			subtitle: 'Generación de imagen',
			description: 'Un paisaje surrealista con elementos flotantes y colores imposibles',
			icon: <MessageSquare className="h-5 w-5" />,
			primaryColor: '#06D6A0',
			stats: [
				{ label: 'Modelo', value: 'SD XL' },
				{ label: 'Pasos', value: '50' },
				{ label: 'Éxito', value: '98%' }
			],
			category: 'Prompts',
			tags: ['paisaje', 'surrealismo', 'onírico'],
			createdAt: new Date('2023-07-05'),
			updatedAt: new Date('2023-10-01'),
		},

		// Colecciones
		{
			id: '10',
			title: 'Criaturas Míticas',
			subtitle: 'Colección temática',
			description: 'Una colección completa de criaturas míticas de diferentes culturas',
			icon: <BookIcon className="h-5 w-5" />,
			primaryColor: '#118AB2',
			stats: [
				{ label: 'Items', value: '27' },
				{ label: 'Completa', value: '60%' }
			],
			category: 'Colecciones',
			tags: ['criaturas', 'mitología', 'fantasía'],
			createdAt: new Date('2023-08-10'),
			updatedAt: new Date('2023-10-10'),
		},

		// Álbumes
		{
			id: '11',
			title: 'Vacaciones 2023',
			subtitle: 'Viaje a la playa',
			description: 'Recopilación de fotos del viaje a las playas del Caribe',
			icon: <Upload className="h-5 w-5" />,
			primaryColor: '#EF476F',
			stats: [
				{ label: 'Fotos', value: '87' },
				{ label: 'Tamaño', value: '340 MB' }
			],
			category: 'Álbumes',
			tags: ['vacaciones', 'playa', 'verano'],
			createdAt: new Date('2023-08-25'),
			updatedAt: new Date('2023-09-05'),
		},

		// Etiquetas
		{
			id: '12',
			title: 'Proyecto Alfa',
			subtitle: 'Etiqueta principal',
			description: 'Etiqueta para clasificar todos los elementos del Proyecto Alfa',
			icon: <TagIcon className="h-5 w-5" />,
			primaryColor: '#073B4C',
			stats: [
				{ label: 'Elementos', value: '47' },
				{ label: 'Tipo', value: 'Proyecto' }
			],
			category: 'Etiquetas',
			createdAt: new Date('2023-09-15'),
			updatedAt: new Date('2023-10-05'),
		},

		// Función especial
		{
			id: '13',
			title: 'Generador Automático',
			subtitle: 'Función',
			description: 'Herramienta avanzada que genera contenido automáticamente según parámetros',
			icon: <CodeIcon className="h-5 w-5" />,
			primaryColor: '#9381FF',
			stats: [
				{ label: 'Tipo', value: 'Función' },
				{ label: 'Estado', value: 'Activo' },
				{ label: 'Uso', value: 'Bajo demanda' }
			],
			category: 'Funciones',
			tags: ['automatización', 'generación', 'herramienta'],
			createdAt: new Date('2023-10-01'),
			updatedAt: new Date('2023-10-12'),
		},
	];

	// Categorías disponibles
	const categories = Array.from(new Set(mockEntities.map(item => item.category)));

	// Todas las etiquetas disponibles
	const allTags = Array.from(
		new Set(
			mockEntities
				.flatMap(item => item.tags || [])
		)
	);

	// Manipuladores de eventos
	const handleSelectionChange = (ids: string[]) => {
		setSelectedIds(ids);
		if (ids.length > 0) {
			toast({
				title: 'Elementos seleccionados',
				description: `Has seleccionado ${ids.length} elementos`,
			});
		}
	};

	const handleItemClick = (id: string) => {
		const item = mockEntities.find(item => item.id === id);
		toast({
			title: `Has hecho clic en: ${item?.title}`,
			description: item?.description,
		});
	};

	const customSortOptions = [
		{ label: 'Nombre', value: 'name' },
		{ label: 'Más recientes', value: 'recent' },
		{ label: 'Más antiguos', value: 'oldest' },
		{
			label: 'Por categoría',
			value: 'category',
			sortFn: (a: EntityItem, b: EntityItem) => (a.category || '').localeCompare(b.category || '')
		}
	];

	return (
		<div className="container py-8 space-y-8">
			<Card>
				<CardHeader>
					<CardTitle>EntityList - Componente de lista de entidades</CardTitle>
					<CardDescription>
						Un componente flexible para mostrar listas de entidades con opciones de filtrado, búsqueda y visualización
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap gap-4">
						<div className="flex items-center space-x-2">
							<Switch
								id="allowSelection"
								checked={allowSelection}
								onCheckedChange={setAllowSelection}
							/>
							<Label htmlFor="allowSelection">Permitir selección</Label>
						</div>

						<div className="flex items-center space-x-2">
							<Switch
								id="tcgMode"
								checked={tcgMode}
								onCheckedChange={setTcgMode}
							/>
							<Label htmlFor="tcgMode">Modo TCG</Label>
						</div>

						{selectedIds.length > 0 && (
							<Button variant="outline" onClick={() => setSelectedIds([])}>
								Limpiar selección ({selectedIds.length})
							</Button>
						)}
					</div>

					<Tabs defaultValue="all">
						<TabsList className="mb-4">
							<TabsTrigger value="all">Todas las entidades</TabsTrigger>
							<TabsTrigger value="grid">Ejemplos de vistas</TabsTrigger>
							<TabsTrigger value="minimal">Configuración mínima</TabsTrigger>
							<TabsTrigger value="custom">Personalizado</TabsTrigger>
						</TabsList>

						<TabsContent value="all">
							<EntityList
								items={mockEntities}
								title="Todas las entidades"
								description="Visualización de diferentes tipos de entidades en el sistema"
								allowSelection={allowSelection}
								onSelectionChange={handleSelectionChange}
								onItemClick={handleItemClick}
								categoryFilters={categories}
								tagFilters={allTags}
								tcgMode={tcgMode}
								sortOptions={customSortOptions}
							/>
						</TabsContent>

						<TabsContent value="grid">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<Card>
									<CardHeader>
										<CardTitle>Vista de cuadrícula</CardTitle>
									</CardHeader>
									<CardContent>
										<EntityList
											items={mockEntities.slice(0, 6)}
											title="Vista de cuadrícula"
											viewType="grid"
											allowViewChange={false}
											showFilters={false}
											itemsPerPage={6}
											tcgMode={tcgMode}
											onItemClick={handleItemClick}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Vista de lista</CardTitle>
									</CardHeader>
									<CardContent>
										<EntityList
											items={mockEntities.slice(0, 6)}
											title="Vista de lista"
											viewType="list"
											allowViewChange={false}
											showFilters={false}
											itemsPerPage={6}
											tcgMode={tcgMode}
											onItemClick={handleItemClick}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Vista compacta</CardTitle>
									</CardHeader>
									<CardContent>
										<EntityList
											items={mockEntities.slice(0, 12)}
											title="Vista compacta"
											viewType="compact"
											allowViewChange={false}
											showFilters={false}
											pagination={false}
											tcgMode={tcgMode}
											onItemClick={handleItemClick}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Solo búsqueda</CardTitle>
									</CardHeader>
									<CardContent>
										<EntityList
											items={mockEntities}
											title="Solo búsqueda"
											showFilters={false}
											pagination={false}
											itemsPerPage={4}
											tcgMode={tcgMode}
											onItemClick={handleItemClick}
										/>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="minimal">
							<EntityList
								items={mockEntities.slice(0, 6)}
								showSearch={false}
								showFilters={false}
								pagination={false}
								allowViewChange={false}
								tcgMode={tcgMode}
								onItemClick={handleItemClick}
							/>
						</TabsContent>

						<TabsContent value="custom">
							<EntityList
								items={mockEntities.filter(item => ['Imágenes', 'Personajes', 'Propiedades'].includes(item.category || ''))}
								title="Entidades personalizadas"
								description="Sólo mostrando imágenes, personajes y propiedades"
								searchPlaceholder="Buscar por nombre o descripción..."
								categoryFilters={['Imágenes', 'Personajes', 'Propiedades']}
								tagFilters={['fuego', 'espacial', 'naturaleza', 'protagonista']}
								allowSelection={allowSelection}
								onSelectionChange={handleSelectionChange}
								itemsPerPage={3}
								tcgMode={tcgMode}
								sortOptions={[
									{ label: 'Por categoría', value: 'category', sortFn: (a, b) => (a.category || '').localeCompare(b.category || '') },
									{ label: 'Por título', value: 'title', sortFn: (a, b) => a.title.localeCompare(b.title) }
								]}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}