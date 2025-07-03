// MIGRADO PARA VITE - Sin 'use server'
// Las Server Actions han sido reemplazadas por datos mock y API calls

import { serverLogger } from '@/lib/logger/server-logger';

const navLogger = serverLogger.withContext('NavActions');

type SystemStats = {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalActivities: number;
	totalSize: number;
	totalViews: number;
	totalDownloads: number;
	topTags: Array<{ id: string; name: string; count: number }>;
	recentActivity: Array<unknown>;
};

const REVALIDATE_PATHS = [
	'/',
	'/settings',
	'/albums',
	'/collections',
	'/tags',
	'/folders',
	'/characters',
	'/places',
	'/world-items',
	'/groups',
	'/properties',
	'/wildcards',
	'/audio',
	'/documents',
	'/json-files',
	'/file-3d',
	'/workflows',
] as const;

export async function revalidateNavigation() {
	try {
		navLogger.info('🔄 Iniciando revalidación de rutas de navegación (MOCK)');
		// En Vite no necesitamos revalidación real
		navLogger.info('✅ Rutas de navegación revalidadas exitosamente (MOCK)');
	} catch (error) {
		navLogger.error('❌ Error al revalidar rutas de navegación:', error);
		throw new Error('No se pudieron revalidar las rutas de navegación');
	}
}

export interface NavigationData {
	folders: Array<{ id: string; name: string; path: string; itemCount: number }>;
	collections: Array<{ id: string; name: string; description: string; itemCount: number }>;
	tags: Array<{ id: string; name: string; count?: number }>;
	albums: Array<{ id: string; name: string; description?: string; itemCount?: number }>;
	characters: Array<{ id: string; name: string; description?: string }>;
	places: Array<{ id: string; name: string; description?: string }>;
	worldItems: Array<{ id: string; name: string; description?: string }>;
	concepts: Array<{ id: string; name: string; description?: string }>;
	prompts: Array<{ id: string; name: string; description?: string }>;
	notes: Array<{ id: string; title: string; content?: string }>;
	groups: Array<{ id: string; name: string; description?: string }>;
	properties: Array<{ id: string; name: string; value?: string }>;
	wildcards: Array<{ id: string; name: string; pattern?: string }>;
	audios: Array<{ id: string; name: string; duration?: number }>;
	documents: Array<{ id: string; name: string; type?: string }>;
	jsonFiles: Array<{ id: string; name: string; size?: number }>;
	file3ds: Array<{ id: string; name: string; format?: string }>;
	workflows: Array<{ id: string; name: string; status?: string }>;
	stats: SystemStats;
}

// VERSIÓN MIGRADA: Datos mock en lugar de Server Actions
export async function getNavigationData(): Promise<NavigationData> {
	try {
		navLogger.info('🧭 Obteniendo datos de navegación (MOCK VERSION)');

		// Simular delay de red
		await new Promise(resolve => setTimeout(resolve, 100));

		const defaultStats: SystemStats = {
			totalImages: 156,
			totalFolders: 8,
			totalCollections: 5,
			totalTags: 24,
			totalAlbums: 12,
			totalCharacters: 18,
			totalPlaces: 6,
			totalWorldItems: 9,
			totalFavorites: 42,
			totalActivities: 128,
			totalSize: 1024 * 1024 * 1024, // 1GB
			totalViews: 2456,
			totalDownloads: 89,
			topTags: [
				{ id: '1', name: 'landscape', count: 35 },
				{ id: '2', name: 'portrait', count: 28 },
				{ id: '3', name: 'nature', count: 22 },
				{ id: '4', name: 'urban', count: 18 },
				{ id: '5', name: 'fantasy', count: 15 }
			],
			recentActivity: [],
		};

		navLogger.info('✅ Datos de navegación obtenidos exitosamente (MOCK)');

		return {
			folders: [
				{ id: '1', name: 'Mis Fotos', path: '/photos', itemCount: 45 },
				{ id: '2', name: 'Documentos', path: '/docs', itemCount: 23 },
				{ id: '3', name: 'Proyectos', path: '/projects', itemCount: 18 },
				{ id: '4', name: 'Arte Digital', path: '/digital-art', itemCount: 32 },
				{ id: '5', name: 'Capturas', path: '/screenshots', itemCount: 67 }
			],
			collections: [
				{ id: '1', name: 'Favoritas', description: 'Mis imágenes favoritas', itemCount: 28 },
				{ id: '2', name: 'Trabajo', description: 'Imágenes de trabajo', itemCount: 45 },
				{ id: '3', name: 'Inspiración', description: 'Referencias e inspiración', itemCount: 67 },
				{ id: '4', name: 'Portfolio', description: 'Trabajos destacados', itemCount: 23 }
			],
			tags: [
				{ id: '1', name: 'landscape', count: 35 },
				{ id: '2', name: 'portrait', count: 28 },
				{ id: '3', name: 'nature', count: 22 },
				{ id: '4', name: 'urban', count: 18 },
				{ id: '5', name: 'fantasy', count: 15 },
				{ id: '6', name: 'digital', count: 12 },
				{ id: '7', name: 'photography', count: 42 },
				{ id: '8', name: 'concept-art', count: 8 }
			],
			albums: [
				{ id: '1', name: 'Viaje 2024', description: 'Fotos del viaje de verano', itemCount: 89 },
				{ id: '2', name: 'Proyecto Luna', description: 'Arte conceptual sci-fi', itemCount: 34 },
				{ id: '3', name: 'Retratos', description: 'Sesiones de retrato', itemCount: 56 },
				{ id: '4', name: 'Arquitectura', description: 'Fotografía arquitectónica', itemCount: 23 }
			],
			characters: [
				{ id: '1', name: 'Elena Nightshade', description: 'Maga élfica' },
				{ id: '2', name: 'Marcus Steel', description: 'Guerrero humano' },
				{ id: '3', name: 'Zara Moonwhisper', description: 'Druida halfling' },
				{ id: '4', name: 'Thorin Ironbeard', description: 'Enano herrero' },
				{ id: '5', name: 'Lyra Starweaver', description: 'Barda celestial' }
			],
			places: [
				{ id: '1', name: 'Bosque Susurrante', description: 'Bosque mágico ancestral' },
				{ id: '2', name: 'Ciudad de Cristal', description: 'Metrópolis futurista' },
				{ id: '3', name: 'Montañas de Hierro', description: 'Cordillera montañosa' },
				{ id: '4', name: 'Puerto Dorado', description: 'Ciudad portuaria comercial' }
			],
			worldItems: [
				{ id: '1', name: 'Espada de Luna', description: 'Arma legendaria élfica' },
				{ id: '2', name: 'Orbe de Poder', description: 'Artefacto mágico' },
				{ id: '3', name: 'Armadura Dracónica', description: 'Protección escamosa' }
			],
			concepts: [
				{ id: '1', name: 'Magia Elemental', description: 'Sistema de magia basado en elementos' },
				{ id: '2', name: 'Viaje Temporal', description: 'Mecánicas de manipulación temporal' },
				{ id: '3', name: 'Razas Híbridas', description: 'Especies mezcladas únicas' }
			],
			prompts: [
				{ id: '1', name: 'Paisaje Épico', description: 'Vista panorámica de mundo fantástico' },
				{ id: '2', name: 'Retrato Heroico', description: 'Personaje en pose dramática' },
				{ id: '3', name: 'Escena de Batalla', description: 'Combate dinámico y emocionante' }
			],
			notes: [
				{ id: '1', title: 'Ideas de Historia', content: 'Conceptos para nueva campaña' },
				{ id: '2', title: 'Referencias Visuales', content: 'Links e imágenes inspiradoras' },
				{ id: '3', title: 'Mecánicas de Juego', content: 'Reglas personalizadas' }
			],
			groups: [
				{ id: '1', name: 'Héroes Principales', description: 'Protagonistas de la historia' },
				{ id: '2', name: 'Villanos', description: 'Antagonistas y enemigos' },
				{ id: '3', name: 'NPCs Importantes', description: 'Personajes secundarios relevantes' }
			],
			properties: [
				{ id: '1', name: 'Fuerza', value: '18' },
				{ id: '2', name: 'Inteligencia', value: '16' },
				{ id: '3', name: 'Carisma', value: '14' },
				{ id: '4', name: 'Nivel', value: '12' }
			],
			wildcards: [
				{ id: '1', name: 'Evento Aleatorio', pattern: 'random_event_*' },
				{ id: '2', name: 'Encuentro Sorpresa', pattern: 'surprise_encounter_*' },
				{ id: '3', name: 'Tesoro Oculto', pattern: 'hidden_treasure_*' }
			],
			audios: [
				{ id: '1', name: 'Música Épica', duration: 180 },
				{ id: '2', name: 'Ambientación Bosque', duration: 300 },
				{ id: '3', name: 'Efectos de Batalla', duration: 45 }
			],
			documents: [
				{ id: '1', name: 'Manual del Jugador', type: 'PDF' },
				{ id: '2', name: 'Reglas de Casa', type: 'DOC' },
				{ id: '3', name: 'Historia del Mundo', type: 'TXT' }
			],
			jsonFiles: [
				{ id: '1', name: 'configuracion.json', size: 2048 },
				{ id: '2', name: 'personajes.json', size: 15360 },
				{ id: '3', name: 'mapas.json', size: 8192 }
			],
			file3ds: [
				{ id: '1', name: 'castillo.blend', format: 'Blender' },
				{ id: '2', name: 'dragon.fbx', format: 'FBX' },
				{ id: '3', name: 'espada.obj', format: 'OBJ' }
			],
			workflows: [
				{ id: '1', name: 'Procesamiento Imágenes', status: 'activo' },
				{ id: '2', name: 'Backup Automático', status: 'pausado' },
				{ id: '3', name: 'Optimización', status: 'completado' }
			],
			stats: defaultStats,
		};
	} catch (error) {
		navLogger.error('❌ Error al obtener los datos de navegación:', error);
		throw new Error('No se pudieron obtener los datos de navegación.');
	}
}

// Versión segura para migración a Vite - DATOS MOCK SIMPLIFICADOS
export function getNavigationDataSafe(): NavigationData {
	const defaultStats: SystemStats = {
		totalImages: 156,
		totalFolders: 8,
		totalCollections: 5,
		totalTags: 24,
		totalAlbums: 12,
		totalCharacters: 18,
		totalPlaces: 6,
		totalWorldItems: 9,
		totalFavorites: 42,
		totalActivities: 128,
		totalSize: 1024 * 1024 * 1024, // 1GB
		totalViews: 2456,
		totalDownloads: 89,
		topTags: [
			{ id: '1', name: 'landscape', count: 35 },
			{ id: '2', name: 'portrait', count: 28 },
			{ id: '3', name: 'nature', count: 22 }
		],
		recentActivity: [],
	};

	return {
		folders: [
			{ id: '1', name: 'Mis Fotos', path: '/photos', itemCount: 45 },
			{ id: '2', name: 'Documentos', path: '/docs', itemCount: 23 },
			{ id: '3', name: 'Proyectos', path: '/projects', itemCount: 18 }
		],
		collections: [
			{ id: '1', name: 'Favoritas', description: 'Mis imágenes favoritas', itemCount: 28 },
			{ id: '2', name: 'Trabajo', description: 'Imágenes de trabajo', itemCount: 45 }
		],
		tags: [
			{ id: '1', name: 'landscape', count: 35 },
			{ id: '2', name: 'portrait', count: 28 },
			{ id: '3', name: 'nature', count: 22 },
			{ id: '4', name: 'urban', count: 18 }
		],
		albums: [
			{ id: '1', name: 'Viaje 2024', description: 'Fotos del viaje', itemCount: 89 },
			{ id: '2', name: 'Proyecto Luna', description: 'Arte conceptual', itemCount: 34 }
		],
		characters: [
			{ id: '1', name: 'Elena Nightshade', description: 'Maga élfica' },
			{ id: '2', name: 'Marcus Steel', description: 'Guerrero humano' }
		],
		places: [
			{ id: '1', name: 'Bosque Susurrante', description: 'Bosque mágico' },
			{ id: '2', name: 'Ciudad de Cristal', description: 'Metrópolis futurista' }
		],
		worldItems: [
			{ id: '1', name: 'Espada de Luna', description: 'Arma legendaria' },
			{ id: '2', name: 'Orbe de Poder', description: 'Artefacto mágico' }
		],
		concepts: [
			{ id: '1', name: 'Magia Elemental', description: 'Sistema de magia' }
		],
		prompts: [
			{ id: '1', name: 'Paisaje Épico', description: 'Vista panorámica' }
		],
		notes: [
			{ id: '1', title: 'Ideas de Historia', content: 'Conceptos para campaña' }
		],
		groups: [
			{ id: '1', name: 'Héroes Principales', description: 'Protagonistas' }
		],
		properties: [
			{ id: '1', name: 'Fuerza', value: '18' },
			{ id: '2', name: 'Inteligencia', value: '16' }
		],
		wildcards: [
			{ id: '1', name: 'Evento Aleatorio', pattern: 'random_*' }
		],
		audios: [
			{ id: '1', name: 'Música Épica', duration: 180 }
		],
		documents: [
			{ id: '1', name: 'Manual del Jugador', type: 'PDF' }
		],
		jsonFiles: [
			{ id: '1', name: 'configuracion.json', size: 2048 }
		],
		file3ds: [
			{ id: '1', name: 'castillo.blend', format: 'Blender' }
		],
		workflows: [
			{ id: '1', name: 'Procesamiento', status: 'activo' }
		],
		stats: defaultStats,
	};
}
