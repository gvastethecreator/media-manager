/**
 * Datos simulados para estadísticas en entorno de desarrollo
 * Esto reduce las consultas a la base de datos durante el desarrollo local
 */

import type { GeneralStats } from '@/types/stats';

// Función para generar fechas relativas
const getRandomDate = () => {
	const now = new Date();
	const days = Math.floor(Math.random() * 7);
	const hours = Math.floor(Math.random() * 24);
	const minutes = Math.floor(Math.random() * 60);
	return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000));
};

// Datos de estadísticas simulados
export const MOCK_STATS: GeneralStats = {
	totalImages: 1287,
	totalFolders: 64,
	totalTags: 186,
	totalCollections: 21,
	totalAlbums: 18,
	totalCharacters: 42,
	totalPlaces: 12,
	totalWorldItems: 56,
	totalFavorites: 147,
	totalViews: 3542,
	totalDownloads: 865,
	totalSize: 8_543_215_104, // ~8.5 GB en bytes
	totalActivities: 532,

	// Etiquetas más populares simuladas
	topTags: [
		{ id: '1', name: 'paisaje', color: 'var(--dt-primary-500)', count: 231, percentage: 0 },
		{ id: '2', name: 'retrato', color: 'var(--dt-success-500)', count: 187, percentage: 0 },
		{ id: '3', name: 'animales', color: 'var(--dt-warning-500)', count: 143, percentage: 0 },
		{ id: '4', name: 'arquitectura', color: '#8b5cf6', count: 98, percentage: 0 },
		{ id: '5', name: 'comida', color: '#f43f5e', count: 76, percentage: 0 },
	],

	// Actividades recientes simuladas
	recentActivity: [
		{
			id: '1',
			type: 'UPLOAD',
			description: 'Imagen subida: "Amanecer en la montaña"',
			createdAt: getRandomDate(),
			entityType: 'image',
			entityId: '1',
			image: { id: '1', name: 'Amanecer en la montaña', thumbnail: null },
		},
		{
			id: '2',
			type: 'TAG',
			description: 'Etiquetas añadidas a "Retrato familiar"',
			createdAt: getRandomDate(),
			entityType: 'image',
			entityId: '2',
			image: { id: '2', name: 'Retrato familiar', thumbnail: null },
		},
		{
			id: '3',
			type: 'COLLECTION',
			description: 'Imagen añadida a colección "Vacaciones 2023"',
			createdAt: getRandomDate(),
			entityType: 'image',
			entityId: '3',
			image: { id: '3', name: 'Playa al atardecer', thumbnail: null },
		},
		{
			id: '4',
			type: 'EDIT',
			description: 'Imagen editada: "Vista desde la ventana"',
			createdAt: getRandomDate(),
			entityType: 'image',
			entityId: '4',
			image: { id: '4', name: 'Vista desde la ventana', thumbnail: null },
		},
		{
			id: '5',
			type: 'FAVORITE',
			description: 'Imagen marcada como favorita',
			createdAt: getRandomDate(),
			entityType: 'image',
			entityId: '5',
			image: { id: '5', name: 'Mascota jugando', thumbnail: null },
		},
	],
};

// Bandera para activar los datos simulados en entorno de desarrollo
export const USE_MOCK_STATS = false;
