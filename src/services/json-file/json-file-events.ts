/**
 * @file JsonFile Event Constants
 * @module services/json-file/json-file-events
 * @description Event name constants for the JsonFile service
 */

export const JSON_FILE_EVENTS = {
	JSON_FILE_CREATED: 'json-file:created',
	JSON_FILE_UPDATED: 'json-file:updated',
	JSON_FILE_DELETED: 'json-file:deleted',
	JSON_FILES_CHANGED: 'json-files:changed',
} as const;
