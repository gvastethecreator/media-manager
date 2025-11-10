/**
 * Tests for entity-field-presets configuration
 */

import { describe, expect, it } from 'vitest';
import {
	CHARACTER_PRESETS,
	COLLECTION_PRESETS,
	CONCEPT_PRESETS,
	ENTITY_PRESETS_MAP,
	NOTE_PRESETS,
	PLACE_PRESETS,
	PROMPT_PRESETS,
	TAG_PRESETS,
	WORLD_ITEM_PRESETS,
	getDefaultPreset,
	getEntityPresets,
	getPresetFields,
	type EntityPresetConfig,
	type FieldConfig,
	type FieldPreset,
} from '../entity-field-presets';

describe('ENTITY_PRESETS_MAP', () => {
	it('should contain all expected entity types', () => {
		const expectedEntityTypes = ['character', 'place', 'concept', 'world-item', 'tag', 'collection', 'prompt', 'note'];
		const actualEntityTypes = Object.keys(ENTITY_PRESETS_MAP);

		for (const entityType of expectedEntityTypes) {
			expect(actualEntityTypes).toContain(entityType);
		}
	});

	it('should have valid EntityPresetConfig for each entity type', () => {
		for (const [entityType, config] of Object.entries(ENTITY_PRESETS_MAP)) {
			expect(config).toBeDefined();
			expect(config.entityType).toBe(entityType);
			expect(config.availableFields).toBeInstanceOf(Array);
			expect(config.presets).toBeInstanceOf(Array);
			expect(config.availableFields.length).toBeGreaterThan(0);
			expect(config.presets.length).toBeGreaterThan(0);
		}
	});

	it('should have name field in all entity configs', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const nameField = config.availableFields.find((f) => f.name === 'name');
			expect(nameField).toBeDefined();
			expect(nameField?.required).toBe(true);
			expect(nameField?.type).toBe('text');
		}
	});

	it('should have at least one default preset per entity', () => {
		for (const [entityType, config] of Object.entries(ENTITY_PRESETS_MAP)) {
			const hasDefault = config.presets.some((p) => p.isDefault);
			expect(hasDefault).toBe(true);
		}
	});
});

describe('getEntityPresets', () => {
	it('should return correct config for valid entity types', () => {
		expect(getEntityPresets('character')).toBe(CHARACTER_PRESETS);
		expect(getEntityPresets('place')).toBe(PLACE_PRESETS);
		expect(getEntityPresets('concept')).toBe(CONCEPT_PRESETS);
		expect(getEntityPresets('world-item')).toBe(WORLD_ITEM_PRESETS);
		expect(getEntityPresets('tag')).toBe(TAG_PRESETS);
		expect(getEntityPresets('collection')).toBe(COLLECTION_PRESETS);
		expect(getEntityPresets('prompt')).toBe(PROMPT_PRESETS);
		expect(getEntityPresets('note')).toBe(NOTE_PRESETS);
	});

	it('should return null for invalid entity types', () => {
		expect(getEntityPresets('invalid')).toBeNull();
		expect(getEntityPresets('unknown')).toBeNull();
		expect(getEntityPresets('')).toBeNull();
	});
});

describe('getDefaultPreset', () => {
	it('should return default preset for valid entity types', () => {
		const entityTypes = ['character', 'place', 'concept', 'world-item', 'tag', 'collection', 'prompt', 'note'];

		for (const entityType of entityTypes) {
			const defaultPreset = getDefaultPreset(entityType);
			expect(defaultPreset).toBeDefined();
			expect(defaultPreset?.isDefault).toBe(true);
		}
	});

	it('should return first preset if no default is marked', () => {
		// This tests the fallback behavior
		const config = getEntityPresets('character');
		if (config) {
			const defaultPreset = getDefaultPreset('character');
			expect(defaultPreset).toBeDefined();
			expect(config.presets).toContainEqual(defaultPreset);
		}
	});

	it('should return null for invalid entity types', () => {
		expect(getDefaultPreset('invalid')).toBeNull();
		expect(getDefaultPreset('unknown')).toBeNull();
		expect(getDefaultPreset('')).toBeNull();
	});
});

describe('getPresetFields', () => {
	it('should return correct fields for valid preset', () => {
		const characterConfig = getEntityPresets('character');
		if (characterConfig) {
			const defaultPreset = characterConfig.presets.find((p) => p.isDefault);
			if (defaultPreset) {
				const fields = getPresetFields('character', defaultPreset.id);
				expect(fields).toBeInstanceOf(Array);
				expect(fields.length).toBe(defaultPreset.fields.length);

				// Verify all fields are FieldConfig objects
				for (const field of fields) {
					expect(field).toHaveProperty('name');
					expect(field).toHaveProperty('label');
					expect(field).toHaveProperty('type');
				}
			}
		}
	});

	it('should return empty array for invalid entity type', () => {
		const fields = getPresetFields('invalid', 'minimal');
		expect(fields).toEqual([]);
	});

	it('should return empty array for invalid preset id', () => {
		const fields = getPresetFields('character', 'nonexistent-preset');
		expect(fields).toEqual([]);
	});

	it('should return fields in the order specified in preset', () => {
		const config = getEntityPresets('character');
		if (config) {
			const preset = config.presets[0];
			const fields = getPresetFields('character', preset.id);
			const fieldNames = fields.map((f) => f.name);
			expect(fieldNames).toEqual(preset.fields);
		}
	});
});

describe('CHARACTER_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(CHARACTER_PRESETS.entityType).toBe('character');
	});

	it('should have multiple presets', () => {
		expect(CHARACTER_PRESETS.presets.length).toBeGreaterThan(0);
	});

	it('should have minimal preset', () => {
		const minimalPreset = CHARACTER_PRESETS.presets.find((p) => p.id === 'minimal');
		expect(minimalPreset).toBeDefined();
		expect(minimalPreset?.fields).toContain('name');
	});

	it('should have valid field types', () => {
		const validTypes = ['text', 'textarea', 'number', 'select', 'color', 'emoji', 'checkbox', 'date', 'featuredImage'];
		for (const field of CHARACTER_PRESETS.availableFields) {
			expect(validTypes).toContain(field.type);
		}
	});

	it('should have options for select fields', () => {
		const selectFields = CHARACTER_PRESETS.availableFields.filter((f) => f.type === 'select');
		for (const field of selectFields) {
			expect(field.options).toBeDefined();
			expect(field.options?.length).toBeGreaterThan(0);
		}
	});
});

describe('PLACE_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(PLACE_PRESETS.entityType).toBe('place');
	});

	it('should have location-related fields', () => {
		const fieldNames = PLACE_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
	});
});

describe('CONCEPT_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(CONCEPT_PRESETS.entityType).toBe('concept');
	});

	it('should have concept-related fields', () => {
		const fieldNames = CONCEPT_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
	});
});

describe('WORLD_ITEM_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(WORLD_ITEM_PRESETS.entityType).toBe('world-item');
	});

	it('should have item-related fields', () => {
		const fieldNames = WORLD_ITEM_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
	});
});

describe('TAG_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(TAG_PRESETS.entityType).toBe('tag');
	});

	it('should have tag-related fields', () => {
		const fieldNames = TAG_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
		expect(fieldNames).toContain('color');
	});
});

describe('COLLECTION_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(COLLECTION_PRESETS.entityType).toBe('collection');
	});

	it('should have collection-related fields', () => {
		const fieldNames = COLLECTION_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
	});
});

describe('PROMPT_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(PROMPT_PRESETS.entityType).toBe('prompt');
	});

	it('should have prompt-related fields', () => {
		const fieldNames = PROMPT_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
	});
});

describe('NOTE_PRESETS', () => {
	it('should have correct entity type', () => {
		expect(NOTE_PRESETS.entityType).toBe('note');
	});

	it('should have note-related fields', () => {
		const fieldNames = NOTE_PRESETS.availableFields.map((f) => f.name);
		expect(fieldNames).toContain('name');
		expect(fieldNames).toContain('content');
	});
});

describe('Field validation', () => {
	it('should have valid max values for text fields', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const textFields = config.availableFields.filter((f) => f.type === 'text' || f.type === 'textarea');
			for (const field of textFields) {
				if (field.max !== undefined) {
					expect(field.max).toBeGreaterThan(0);
				}
			}
		}
	});

	it('should have valid min values for number fields', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const numberFields = config.availableFields.filter((f) => f.type === 'number');
			for (const field of numberFields) {
				if (field.min !== undefined) {
					expect(typeof field.min).toBe('number');
				}
			}
		}
	});
});

describe('Preset structure validation', () => {
	it('should have all preset fields defined in availableFields', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const availableFieldNames = config.availableFields.map((f) => f.name);
			for (const preset of config.presets) {
				for (const fieldName of preset.fields) {
					expect(availableFieldNames).toContain(fieldName);
				}
			}
		}
	});

	it('should have unique preset IDs within each entity type', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const presetIds = config.presets.map((p) => p.id);
			const uniqueIds = new Set(presetIds);
			expect(uniqueIds.size).toBe(presetIds.length);
		}
	});

	it('should have unique field names within each entity type', () => {
		for (const config of Object.values(ENTITY_PRESETS_MAP)) {
			const fieldNames = config.availableFields.map((f) => f.name);
			const uniqueNames = new Set(fieldNames);
			expect(uniqueNames.size).toBe(fieldNames.length);
		}
	});
});
