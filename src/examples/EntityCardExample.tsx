'use client';

import { Button } from '@/components/ui/button';
import { EntityCard } from '@/components/ui/entity-card';
import { EntityStats, StatItem } from '@/components/ui/entity-stats';
import { useToast } from '@/components/ui/use-toast';
import {
	Book,
	Camera,
	Film,
	Folders,
	MapPin,
	Microscope,
	NotebookPen,
	Smartphone,
	Star,
	Tag,
	Users,
	Wand2
} from 'lucide-react';
import { useState } from 'react';

export default function EntityCardExample() {
	const { toast } = useToast();
	const [tcgMode, setTcgMode] = useState(false);
	const [compactMode, setCompactMode] = useState(false);
	const [animationMode, setAnimationMode] = useState<'hover' | 'always' | 'none'>('hover');

	// Ejemplos de estadísticas para diferentes tipos de entidades
	const imageStats: StatItem[] = [
		{ value: 1280, label: 'ancho', icon: <span className="w-4 h-4 flex items-center justify-center">W</span> },
		{ value: 720, label: 'alto', icon: <span className="w-4 h-4 flex items-center justify-center">H</span> },
		{ value: 5, label: 'etiquetas', icon: <Tag className="w-3 h-3" /> },
		{ value: 3, label: 'álbumes', icon: <Camera className="w-3 h-3" /> },
	];

	const folderStats: StatItem[] = [
		{ value: 128, label: 'imágenes', icon: <Camera className="w-3 h-3" /> },
		{ value: 12, label: 'vídeos', icon: <Film className="w-3 h-3" /> },
		{ value: 5, label: 'álbumes', icon: <Book className="w-3 h-3" /> },
	];

	const groupStats: StatItem[] = [
		{ value: 24, label: 'miembros', icon: <Users className="w-3 h-3" /> },
		{ value: 45, label: 'elementos', icon: <Folders className="w-3 h-3" /> },
		{ value: 12, label: 'notas', icon: <NotebookPen className="w-3 h-3" /> },
	];

	const characterStats: StatItem[] = [
		{ value: 45, label: 'imágenes', icon: <Camera className="w-3 h-3" /> },
		{ value: 8, label: 'escenas', icon: <Film className="w-3 h-3" /> },
		{ value: 12, label: 'notas', icon: <NotebookPen className="w-3 h-3" /> },
		{ value: 3, label: 'lugares', icon: <MapPin className="w-3 h-3" /> },
	];

	const placeStats: StatItem[] = [
		{ value: 32, label: 'imágenes', icon: <Camera className="w-3 h-3" /> },
		{ value: 6, label: 'personajes', icon: <Users className="w-3 h-3" /> },
		{ value: 9, label: 'notas', icon: <NotebookPen className="w-3 h-3" /> },
	];

	const propertyStats: StatItem[] = [
		{ value: 75, label: 'imágenes', icon: <Camera className="w-3 h-3" /> },
		{ value: 12, label: 'vídeos', icon: <Film className="w-3 h-3" /> },
		{ value: 4, label: 'personajes', icon: <Users className="w-3 h-3" /> },
		{ value: 7, label: 'lugares', icon: <MapPin className="w-3 h-3" /> },
	];

	const handleCardClick = (name: string) => {
		toast({
			title: 'Card Clicked',
			description: `You clicked on the ${name} card`,
		});
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">Componentes de Tarjeta de Entidad Reutilizables</h1>

			{/* Controles */}
			<div className="bg-muted/30 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-center">
				<div>
					<h3 className="font-medium mb-2">Modos de visualización:</h3>
					<div className="flex gap-2">
						<Button
							variant={tcgMode ? "default" : "outline"}
							size="sm"
							onClick={() => setTcgMode(!tcgMode)}
						>
							Modo TCG {tcgMode ? '✓' : ''}
						</Button>

						<Button
							variant={compactMode ? "default" : "outline"}
							size="sm"
							onClick={() => setCompactMode(!compactMode)}
						>
							Modo Compacto {compactMode ? '✓' : ''}
						</Button>
					</div>
				</div>

				<div>
					<h3 className="font-medium mb-2">Animación:</h3>
					<div className="flex gap-2">
						<Button
							variant={animationMode === 'hover' ? "default" : "outline"}
							size="sm"
							onClick={() => setAnimationMode('hover')}
						>
							Hover
						</Button>

						<Button
							variant={animationMode === 'always' ? "default" : "outline"}
							size="sm"
							onClick={() => setAnimationMode('always')}
						>
							Siempre
						</Button>

						<Button
							variant={animationMode === 'none' ? "default" : "outline"}
							size="sm"
							onClick={() => setAnimationMode('none')}
						>
							Ninguna
						</Button>
					</div>
				</div>
			</div>

			{/* Demostración de EntityStats */}
			<div className="mb-12">
				<h2 className="text-2xl font-bold mb-4">Componente EntityStats</h2>
				<p className="text-muted-foreground mb-6">
					El componente EntityStats puede mostrar estadísticas en diferentes formatos:
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					<div className="bg-card p-6 rounded-lg">
						<h3 className="font-medium mb-4">EntityStats con Badges:</h3>
						<EntityStats stats={characterStats} asBadges={true} />
					</div>

					<div className="bg-card p-6 rounded-lg">
						<h3 className="font-medium mb-4">EntityStats como Lista:</h3>
						<EntityStats stats={characterStats} asBadges={false} />
					</div>

					<div className="bg-card p-6 rounded-lg">
						<h3 className="font-medium mb-4">EntityStats tamaño pequeño:</h3>
						<EntityStats stats={folderStats} size="sm" />
					</div>

					<div className="bg-card p-6 rounded-lg">
						<h3 className="font-medium mb-4">EntityStats tamaño grande:</h3>
						<EntityStats stats={folderStats} size="lg" />
					</div>
				</div>
			</div>

			{/* Demostración de EntityCard */}
			<h2 className="text-2xl font-bold mb-4">Componente EntityCard</h2>
			<p className="text-muted-foreground mb-6">
				Ejemplos de tarjetas para diferentes entidades del sistema:
			</p>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
				{/* Tarjeta de Imagen */}
				<EntityCard
					title="Mi imagen de montaña"
					subtitle="Fotografía"
					description="Fotografía de alta resolución de montañas al amanecer con niebla y un lago cristalino."
					icon={<Camera className="h-4 w-4" />}
					primaryColor="#3b82f6"
					stats={imageStats}
					onClick={() => handleCardClick('Imagen')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
					thumbnails={[
						'/api/thumbnails/example1',
						'/api/thumbnails/example2',
					]}
				/>

				{/* Tarjeta de Carpeta */}
				<EntityCard
					title="Viaje a Europa"
					subtitle="Carpeta"
					description="Colección de imágenes de mi viaje a Europa incluyendo París, Roma y Barcelona."
					icon={<Folders className="h-4 w-4" />}
					primaryColor="#10b981"
					stats={folderStats}
					href="/folders/example"
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>

				{/* Tarjeta de Grupo */}
				<EntityCard
					title="Equipo de Marketing"
					subtitle="Grupo"
					description="Recursos visuales para el equipo de marketing, incluyendo logotipos, banners y materiales promocionales."
					icon={<Users className="h-4 w-4" />}
					primaryColor="#f59e0b"
					stats={groupStats}
					onClick={() => handleCardClick('Grupo')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>

				{/* Tarjeta de Personaje */}
				<EntityCard
					title="Capitán Alejandro"
					subtitle="Personaje"
					description="Protagonista de la serie de ciencia ficción 'Viajes Estelares'. Capitán de la nave Prometeo."
					icon={<span className="text-lg">👨‍✈️</span>}
					primaryColor="#ec4899"
					stats={characterStats}
					onClick={() => handleCardClick('Personaje')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
					thumbnails={[
						'/api/thumbnails/char1',
						'/api/thumbnails/char2',
						'/api/thumbnails/char3',
					]}
				/>

				{/* Tarjeta de Lugar */}
				<EntityCard
					title="Ciudad de Cristal"
					subtitle="Lugar"
					description="Ciudad futurista conocida por sus rascacielos de cristal y su arquitectura vanguardista."
					icon={<MapPin className="h-4 w-4" />}
					primaryColor="#8b5cf6"
					stats={placeStats}
					onClick={() => handleCardClick('Lugar')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
					thumbnails={[
						'/api/thumbnails/place1',
						'/api/thumbnails/place2',
					]}
				/>

				{/* Tarjeta de Propiedad */}
				<EntityCard
					title="Estilo Artístico"
					subtitle="Propiedad"
					description="Categorización del estilo artístico de las imágenes: cubismo, impresionismo, surrealismo, etc."
					icon={<Microscope className="h-4 w-4" />}
					primaryColor="#ef4444"
					stats={propertyStats}
					onClick={() => handleCardClick('Propiedad')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>
			</div>

			{/* Versión sin stats */}
			<h3 className="text-xl font-bold mb-4">Tarjetas sin estadísticas</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
				<EntityCard
					title="Prompt #034"
					subtitle="Prompt"
					description="Prompt para generar imágenes de paisajes nocturnos con aurora boreal y montañas nevadas."
					icon={<Wand2 className="h-4 w-4" />}
					primaryColor="#0ea5e9"
					onClick={() => handleCardClick('Prompt')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>

				<EntityCard
					title="Favoritos del mes"
					subtitle="Colección"
					description="Una colección de mis imágenes favoritas de este mes."
					icon={<Star className="h-4 w-4" />}
					primaryColor="#f97316"
					href="/collections/favorites"
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>

				<EntityCard
					title="Dispositivo: iPhone 15"
					subtitle="Dispositivo"
					description="Imágenes capturadas con iPhone 15 Pro Max."
					icon={<Smartphone className="h-4 w-4" />}
					primaryColor="#14b8a6"
					onClick={() => handleCardClick('Dispositivo')}
					tcgMode={tcgMode}
					compact={compactMode}
					animationMode={animationMode}
				/>
			</div>
		</div>
	);
}