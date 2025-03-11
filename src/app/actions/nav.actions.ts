'use server';

import type { Album } from '@prisma/client';
import type { WorldItemWithStats } from './world-items/world-item.actions';

// Definición de tipos para la navegación
export interface NavigationData {
	collections: Array<{
		id: string;
		name: string;
		emoji: string;
		_count?: { images: number };
	}>;
	folders: Array<{
		id: string;
		name: string;
		path: string;
		_count?: { images: number };
	}>;
	tags: Array<{
		id: string;
		name: string;
		color: string;
		_count?: { images: number };
	}>;
	albums: Array<{
		id: string;
		name: string;
		emoji: string;
		_count?: { images: number };
	}>;
	characters: Array<{
		id: string;
		name: string;
		emoji: string;
		_count?: { images: number };
	}>;
	places: Array<{
		id: string;
		name: string;
		emoji: string;
		_count?: { images: number };
	}>;
	worldItems: WorldItemWithStats[];
}

// Función para obtener los datos de navegación
export async function getNavigationData(): Promise<NavigationData> {
	// Esta es una implementación temporal que devuelve datos vacíos
	return {
		collections: [],
		folders: [],
		tags: [],
		albums: [],
		characters: [],
		places: [],
		worldItems: [],
	};
}
