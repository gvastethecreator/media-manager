/**
 * @file WorldItem Event Constants
 * @module services/world-item/world-item-events
 * @description Event name constants for the WorldItem service
 */

export const WORLD_ITEM_EVENTS = {
	WORLD_ITEM_CREATED: 'worldItem:created',
	WORLD_ITEM_UPDATED: 'worldItem:updated',
	WORLD_ITEM_DELETED: 'worldItem:deleted',
	WORLD_ITEMS_CHANGED: 'worldItems:changed',
} as const;
