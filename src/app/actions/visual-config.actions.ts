'use server';

export interface CardOptions {
	[key: string]: any;
}

const DEFAULT_CHARACTER_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'character',
		variant: 'default',
		aspectRatio: '2/3',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#f59e0b',
	secondaryColor: '#ef4444',
	hoverLiftHeight: 15,
	maxRotation: 18,
};

const DEFAULT_PLACE_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'place',
		variant: 'default',
		aspectRatio: '3/2',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#0ea5e9',
	secondaryColor: '#06b6d4',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

const DEFAULT_WORLD_ITEM_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'world-item',
		variant: 'default',
		aspectRatio: '3/2',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#f59e0b',
	secondaryColor: '#d97706',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

export async function getCharacterVisualConfig(): Promise<CardOptions> {
	return DEFAULT_CHARACTER_OPTIONS;
}

export async function getPlaceVisualConfig(): Promise<CardOptions> {
	return DEFAULT_PLACE_OPTIONS;
}

export async function getWorldItemVisualConfig(): Promise<CardOptions> {
	return DEFAULT_WORLD_ITEM_OPTIONS;
}

import { prisma } from '@/lib/prisma';

export async function getEntityVisualConfig(entityType: string, entityId: string) {
	switch (entityType) {
		case 'folders':
			return prisma.folderVisualConfig.findFirst({ where: { folder: { id: entityId } } });
		case 'images':
			return prisma.imageVisualConfig.findFirst({ where: { image: { id: entityId } } });
		case 'videos':
			return prisma.videoVisualConfig.findFirst({ where: { video: { id: entityId } } });
		default:
			throw new Error('Tipo de entidad no válido');
	}
}

export async function upsertEntityVisualConfig(entityType: string, entityId: string, data: Record<string, unknown>) {
	switch (entityType) {
		case 'folders':
			return prisma.folderVisualConfig.upsert({
				where: { id: (data as any).id || '' },
				update: { ...data, folder: { connect: { id: entityId } } },
				create: { ...data, folder: { connect: { id: entityId } } },
			});
		case 'images':
			return prisma.imageVisualConfig.upsert({
				where: { id: (data as any).id || '' },
				update: { ...data, image: { connect: { id: entityId } } },
				create: { ...data, image: { connect: { id: entityId } } },
			});
		case 'videos':
			return prisma.videoVisualConfig.upsert({
				where: { id: (data as any).id || '' },
				update: { ...data, video: { connect: { id: entityId } } },
				create: { ...data, video: { connect: { id: entityId } } },
			});
		default:
			throw new Error('Tipo de entidad no válido');
	}
}

export async function deleteEntityVisualConfig(entityType: string, entityId: string) {
	switch (entityType) {
		case 'folders':
			return prisma.folderVisualConfig.delete({ where: { folder: { id: entityId } } });
		case 'images':
			return prisma.imageVisualConfig.delete({ where: { image: { id: entityId } } });
		case 'videos':
			return prisma.videoVisualConfig.delete({ where: { video: { id: entityId } } });
		default:
			throw new Error('Tipo de entidad no válido');
	}
}
