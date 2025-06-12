'use server';

import { prisma } from '@/lib/prisma';

export interface PresetQueryOptions {
	isDefault?: boolean;
	isPublic?: boolean;
	limit?: number;
}

export async function getVisualPreset(id: string) {
	return prisma.visualPreset.findUnique({ where: { id } });
}

export async function updateVisualPreset(id: string, data: Record<string, unknown>) {
	return prisma.visualPreset.update({ where: { id }, data });
}

export async function getPresetsByType(type: string, options: PresetQueryOptions = {}) {
	const { isDefault, isPublic, limit = 10 } = options;
	const where: any = {
		OR: [{ category: `type:${type}` }, { category: type }, { [`${type}Config`]: { not: null } }],
	};
	if (isDefault !== undefined) where.isDefault = isDefault;
	if (isPublic !== undefined) where.isPublic = isPublic;
	const presets = await prisma.visualPreset.findMany({ where, orderBy: { isDefault: 'desc' }, take: limit });
	if (isDefault) return presets[0] || null;
	return presets;
}
