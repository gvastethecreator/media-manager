import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { favorites, profiles, tasks } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { createTask, listTasks, toggleTaskFavorite, updateTask } from '../task.service';

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `task-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Task Service Test Profile',
		emoji: '📋',
		color: '#6366f1',
		description: 'Perfil activo para tests de tasks',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createRawTask = async (title: string, overrides?: Partial<typeof tasks.$inferInsert>) => {
	const now = new Date();
	const [task] = await db
		.insert(tasks)
		.values({
			id: `task-test-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			title,
			description: null,
			status: 'pending',
			priority: 'medium',
			emoji: '📋',
			color: '#6366f1',
			category: null,
			tags: null,
			dueDate: null,
			completedAt: null,
			estimatedHours: null,
			actualHours: null,
			progress: 0,
			assignedTo: null,
			parentTaskId: null,
			projectId: null,
			notes: null,
			featuredImage: null,
			isFavorite: false,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();

	return task;
};

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.TASK));
	await db.delete(tasks);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('TaskService favorites convergence', () => {
	it('createTask persists favorite state through the local favorite flag', async () => {
		await ensureActiveProfile();

		const created = await createTask({
			title: `create-canonical-favorite-${Date.now()}`,
			isFavorite: true,
		});

		expect(created.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TASK, created.id)).toBe(false);
	});

	it('listTasks resolves isFavorite=true from local favorites and ignores stale canonical rows', async () => {
		await ensureActiveProfile();
		const localFavorite = await createRawTask('local-favorite', { isFavorite: true });
		const staleCanonical = await createRawTask('stale-canonical', { isFavorite: false });
		await createRawTask('regular-task', { isFavorite: false });

		await favoriteService.set(FavoriteEntityType.TASK, staleCanonical.id, true);

		const result = await listTasks({ isFavorite: true, limit: 50, offset: 0 });

		expect(result.total).toBe(1);
		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0]?.id).toBe(localFavorite.id);
		expect(result.tasks[0]?.isFavorite).toBe(true);
	});

	it('listTasks resolves isFavorite=false from local favorites and ignores stale canonical rows', async () => {
		await ensureActiveProfile();
		const localFavorite = await createRawTask('negative-local-favorite', { isFavorite: true });
		const staleCanonical = await createRawTask('negative-stale-canonical', { isFavorite: false });
		const regularTask = await createRawTask('negative-regular-task', { isFavorite: false });

		await favoriteService.set(FavoriteEntityType.TASK, staleCanonical.id, true);

		const result = await listTasks({ isFavorite: false, limit: 50, offset: 0, sortBy: 'title', sortOrder: 'asc' });

		expect(result.total).toBe(2);
		expect(result.tasks.map((task) => task.id).sort()).toEqual([regularTask.id, staleCanonical.id].sort());
		expect(result.tasks.every((task) => task.isFavorite === false)).toBe(true);
		expect(result.tasks.some((task) => task.id === localFavorite.id)).toBe(false);
	});

	it('updateTask persists favorite state through the local favorite flag', async () => {
		await ensureActiveProfile();
		const task = await createRawTask('update-target', { isFavorite: false });

		const updated = await updateTask(task.id, { isFavorite: true });

		expect(updated.id).toBe(task.id);
		expect(updated.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TASK, task.id)).toBe(false);
	});

	it('toggleTaskFavorite alternates the local favorite flag', async () => {
		await ensureActiveProfile();
		const task = await createRawTask('toggle-target', { isFavorite: false });

		const toggled = await toggleTaskFavorite(task.id);

		expect(toggled.id).toBe(task.id);
		expect(toggled.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.TASK, task.id)).toBe(false);
	});
});