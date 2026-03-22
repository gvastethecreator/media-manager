import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/lib/api/client';

interface MinimalItem {
	id: string;
	label: string;
}

type EntityKey =
	| 'albums'
	| 'collections'
	| 'concepts'
	| 'characters'
	| 'groups'
	| 'notes'
	| 'places'
	| 'properties'
	| 'prompts'
	| 'tags'
	| 'wildcards'
	| 'worldItems';

interface CatalogSection {
	error?: string;
	items: MinimalItem[];
	loaded: boolean;
	loading: boolean;
}

type CatalogState = Record<EntityKey, CatalogSection> & {
	lastPreloadAt?: number;
};

interface CatalogActions {
	getItems: (key: EntityKey) => MinimalItem[];
	preload: () => Promise<void>;
}

export type EntityCatalogStore = CatalogState & CatalogActions;

function toParams(limit = 15) {
	const params = new URLSearchParams();
	params.set('limit', String(limit));
	params.set('sortBy', 'updatedAt');
	params.set('sortOrder', 'desc');
	return params.toString();
}

function mapList(resp: any, labelKey = 'name'): MinimalItem[] {
	const data = Array.isArray(resp)
		? resp
		: Array.isArray(resp?.data)
			? resp.data
			: Array.isArray(resp?.images)
				? resp.images
				: [];
	return data.slice(0, 15).map((x: any) => ({ id: String(x.id), label: x[labelKey] ?? 'Sin nombre' }));
}

const initialSection: CatalogSection = { items: [], loading: false, loaded: false };

export const useEntityCatalogStore = create<EntityCatalogStore>()(
	devtools(
		immer((set, get) => ({
			albums: { ...initialSection },
			collections: { ...initialSection },
			concepts: { ...initialSection },
			characters: { ...initialSection },
			groups: { ...initialSection },
			notes: { ...initialSection },
			places: { ...initialSection },
			properties: { ...initialSection },
			prompts: { ...initialSection },
			tags: { ...initialSection },
			wildcards: { ...initialSection },
			worldItems: { ...initialSection },
			lastPreloadAt: undefined,

			async preload() {
				// Evitar recargas muy frecuentes (1 min)
				const now = Date.now();
				if (get().lastPreloadAt && now - (get().lastPreloadAt as number) < 60_000) return;

				// Marcar loading
				set((s) => {
					for (const k of Object.keys(s) as Array<keyof CatalogState>) {
						const key = k as EntityKey;
						if ((s as any)[key]?.loaded) continue; // no tocar los ya cargados
						if ((s as any)[key]) (s as any)[key].loading = true;
					}
				});

				const params = toParams(15);

				try {
					const [
						albums,
						collections,
						concepts,
						characters,
						groups,
						notes,
						places,
						properties,
						prompts,
						tags,
						wildcards,
						worldItems,
					] = await Promise.all([
						apiClient.get(`/albums?${params}`),
						apiClient.get(`/collections?${params}`),
						apiClient.get(`/concepts?${params}`),
						apiClient.get(`/characters?${params}`),
						apiClient.get(`/groups?${params}`),
						apiClient.get(`/notes?${params}`),
						apiClient.get(`/places?${params}`),
						apiClient.get(`/properties?${params}`),
						apiClient.get(`/prompts?${params}`),
						apiClient.get(`/tags?${params}`),
						apiClient.get(`/wildcards?${params}`),
						apiClient.get(`/world-items?${params}`),
					]);

					set((s) => {
						s.albums = { items: mapList(albums, 'name'), loading: false, loaded: true };
						s.collections = { items: mapList(collections, 'name'), loading: false, loaded: true };
						s.concepts = { items: mapList(concepts, 'name'), loading: false, loaded: true };
						s.characters = { items: mapList(characters, 'name'), loading: false, loaded: true };
						s.groups = { items: mapList(groups, 'name'), loading: false, loaded: true };
						s.notes = { items: mapList(notes, 'title'), loading: false, loaded: true };
						s.places = { items: mapList(places, 'name'), loading: false, loaded: true };
						s.properties = { items: mapList(properties, 'name'), loading: false, loaded: true };
						s.prompts = { items: mapList(prompts, 'name'), loading: false, loaded: true };
						s.tags = { items: mapList(tags, 'name'), loading: false, loaded: true };
						s.wildcards = { items: mapList(wildcards, 'name'), loading: false, loaded: true };
						s.worldItems = { items: mapList(worldItems, 'name'), loading: false, loaded: true };
						s.lastPreloadAt = now;
					});
				} catch (err: any) {
					const msg = err?.message || 'Error al precargar entidades';
					set((s) => {
						for (const k of Object.keys(s) as Array<keyof CatalogState>) {
							const key = k as EntityKey;
							if ((s as any)[key]) {
								(s as any)[key].loading = false;
								(s as any)[key].loaded = false;
								(s as any)[key].error = msg;
							}
						}
					});
				}
			},

			getItems(key: EntityKey) {
				return get()[key].items;
			},
		})),
		{ name: 'entity-catalog-store' }
	)
);
