import type { CreateGroupData, GroupFilters, UpdateGroupData } from '@/types/entities/group';
import type { Prisma } from '@prisma/client';

export const mapGroupFiltersToPrisma = (filters: GroupFilters): { where: Prisma.GroupWhereInput } => {
	const where: Prisma.GroupWhereInput = {};

	if (filters.query) {
		where.OR = [
			{ name: { contains: filters.query, mode: 'insensitive' } },
			{ description: { contains: filters.query, mode: 'insensitive' } },
		];
	}

	if (filters.categories?.length) {
		where.category = { in: filters.categories };
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.withImages) {
		where.images = { some: {} };
	}

	if (filters.withVideos) {
		where.videos = { some: {} };
	}

	return { where };
};

export const mapCreateGroupDataToPrisma = (data: CreateGroupData): Prisma.GroupCreateInput => {
	return {
		name: data.name,
		description: data.description || null,
		emoji: data.emoji || '📂',
		color: data.color || '#3b82f6',
		category: data.category || null,
		shortcut: data.shortcut || null,
		isFavorite: data.isFavorite || false,
		sortBy: data.sortBy || 'name',
		filters: data.filters || '{}',
	};
};

export const mapUpdateGroupDataToPrisma = (data: UpdateGroupData): Prisma.GroupUpdateInput => {
	const updateData: Prisma.GroupUpdateInput = {};

	if (data.name !== undefined) updateData.name = data.name;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
	if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
	if (data.sortBy !== undefined) updateData.sortBy = data.sortBy;
	if (data.filters !== undefined) updateData.filters = data.filters;

	return updateData;
};