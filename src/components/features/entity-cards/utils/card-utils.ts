import { DEFAULT_CARD_OPTIONS } from '../constants/card-constants';
import type { CardMetadata, CardOptions } from '../types';

// Función para calcular la rareza basada en las estadísticas
export function calculateRarity(stats: CardMetadata): string {
	const totalStats = Object.values(stats).reduce((acc: number, val) => {
		return acc + (typeof val === 'number' ? val : 0);
	}, 0);

	const averageStats = totalStats / Object.keys(stats).length;

	if (averageStats >= 90) return 'mythic';
	if (averageStats >= 80) return 'legendary';
	if (averageStats >= 70) return 'epic';
	if (averageStats >= 60) return 'rare';
	if (averageStats >= 50) return 'uncommon';
	return 'common';
}

// Función para obtener el color de clase
export function getClassColor(className: string): string {
	const classColors: Record<string, string> = {
		warrior: 'red',
		mage: 'blue',
		rogue: 'yellow',
		priest: 'white',
		shaman: 'green',
		warlock: 'purple',
		druid: 'orange',
		hunter: 'green',
		paladin: 'pink',
		monk: 'green',
		demonhunter: 'purple',
		deathknight: 'blue',
		evoker: 'green',
	};

	return classColors[className.toLowerCase()] || 'gray';
}

// Función para obtener el icono de clase
export function getClassIcon(className: string): string {
	const classIcons: Record<string, string> = {
		warrior: '⚔️',
		mage: '🔮',
		rogue: '🗡️',
		priest: '✨',
		shaman: '⚡',
		warlock: '👿',
		druid: '🌿',
		hunter: '🏹',
		paladin: '🛡️',
		monk: '🧘',
		demonhunter: '👹',
		deathknight: '💀',
		evoker: '🐉',
	};

	return classIcons[className.toLowerCase()] || '❓';
}

// Función para fusionar opciones de tarjeta
export function mergeCardOptions(options: Partial<CardOptions>): CardOptions {
	return {
		...DEFAULT_CARD_OPTIONS,
		...options,
		designSystem: {
			...DEFAULT_CARD_OPTIONS.designSystem,
			...options.designSystem,
		},
		visualEffects: {
			...DEFAULT_CARD_OPTIONS.visualEffects,
			...options.visualEffects,
		},
		states: {
			...DEFAULT_CARD_OPTIONS.states,
			...options.states,
		},
		performance: {
			...DEFAULT_CARD_OPTIONS.performance,
			...options.performance,
		},
	};
}

// Función para generar un ID único
export function generateCardId(): string {
	return `card-${Math.random().toString(36).substr(2, 9)}`;
}

// Función para formatear el texto de descripción
export function formatDescription(text: string, maxLength = 150): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}

// Función para calcular el tamaño de la imagen
export function calculateImageSize(
	width: number,
	height: number,
	maxWidth = 300,
	maxHeight = 400
): { width: number; height: number } {
	const aspectRatio = width / height;
	let newWidth = width;
	let newHeight = height;

	if (width > maxWidth) {
		newWidth = maxWidth;
		newHeight = maxWidth / aspectRatio;
	}

	if (newHeight > maxHeight) {
		newHeight = maxHeight;
		newWidth = maxHeight * aspectRatio;
	}

	return { width: newWidth, height: newHeight };
}

// Función para validar las opciones de la tarjeta
export function validateCardOptions(options: CardOptions): string[] {
	const errors: string[] = [];

	if (!options.id) errors.push('ID es requerido');
	if (!options.title) errors.push('Título es requerido');
	if (!options.description) errors.push('Descripción es requerida');
	if (!options.entityType) errors.push('Tipo de entidad es requerido');

	return errors;
}

// Función para obtener el color de borde basado en la rareza
export function getRarityBorderColor(rarity: string): string {
	const rarityColors: Record<string, string> = {
		common: 'border-gray-400',
		uncommon: 'border-green-400',
		rare: 'border-blue-400',
		epic: 'border-purple-400',
		legendary: 'border-yellow-400',
		mythic: 'border-red-400',
	};

	return rarityColors[rarity.toLowerCase()] || 'border-gray-400';
}

// Función para obtener el color de texto basado en la rareza
export function getRarityTextColor(rarity: string): string {
	const rarityColors: Record<string, string> = {
		common: 'text-gray-400',
		uncommon: 'text-green-400',
		rare: 'text-blue-400',
		epic: 'text-purple-400',
		legendary: 'text-yellow-400',
		mythic: 'text-red-400',
	};

	return rarityColors[rarity.toLowerCase()] || 'text-gray-400';
}

// Función para obtener el color de fondo basado en la rareza
export function getRarityBackgroundColor(rarity: string): string {
	const rarityColors: Record<string, string> = {
		common: 'bg-gray-400/10',
		uncommon: 'bg-green-400/10',
		rare: 'bg-blue-400/10',
		epic: 'bg-purple-400/10',
		legendary: 'bg-yellow-400/10',
		mythic: 'bg-red-400/10',
	};

	return rarityColors[rarity.toLowerCase()] || 'bg-gray-400/10';
}
