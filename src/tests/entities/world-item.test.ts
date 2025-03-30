/**
 * @file Pruebas para los transformadores de WorldItem
 * @module tests/entities/world-item
 */

import {
  deserializeWorldItemAttributes,
  deserializeWorldItemEffects,
  deserializeWorldItemFilters,
  deserializeWorldItemRequirements,
  deserializeWorldItemStats,
  deserializeWorldItemTags,
  fromExtendedWorldItem,
  serializeWorldItemAttributes,
  serializeWorldItemEffects,
  serializeWorldItemFilters,
  serializeWorldItemRequirements,
  serializeWorldItemStats,
  serializeWorldItemTags,
  toExtendedWorldItem
} from '../../transformers/world-item/serializers';
import type { WorldItemBase, WorldItemExtended } from '../../types/entities/world-item';

describe('WorldItem Serializers', () => {
  // Mock de un objeto WorldItemBase con campos JSON como strings
  const mockWorldItemBase: WorldItemBase = {
    id: 'world-item-123',
    name: 'Espada de fuego',
    emoji: '🔥',
    color: '#ff5500',
    description: 'Una poderosa espada encantada con fuego',
    shortcut: null,
    type: 'weapon',
    rarity: 'rare',
    size: 'medium',
    origin: 'Montaña de Fuego',
    category: 'combat',
    sortBy: 'name_asc',
    featuredImage: null,
    isFavorite: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),

    // Campos JSON almacenados como strings
    attributes: JSON.stringify(['fire', 'magic', 'sharp']),
    effects: JSON.stringify(['burn', 'light']),
    requirements: JSON.stringify({ strength: 10, level: 5 }),
    stats: JSON.stringify({ damage: 15, weight: 3, durability: 100 }),
    filters: JSON.stringify({ showInInventory: true, materials: ['steel', 'ruby'] }),
    tags: JSON.stringify(['weapon', 'fire', 'magic'])
  };

  describe('Serialización/Deserialización de Atributos', () => {
    it('debería deserializar correctamente un array de atributos', () => {
      const result = deserializeWorldItemAttributes(mockWorldItemBase.attributes);
      expect(result).toEqual(['fire', 'magic', 'sharp']);
    });

    it('debería manejar valores empty_array', () => {
      expect(deserializeWorldItemAttributes('empty_array')).toEqual([]);
    });

    it('debería manejar valores null', () => {
      expect(deserializeWorldItemAttributes(null)).toEqual([]);
    });

    it('debería serializar correctamente un array de atributos', () => {
      const attributes = ['water', 'ice', 'cold'];
      const result = serializeWorldItemAttributes(attributes);
      expect(JSON.parse(result)).toEqual(attributes);
    });

    it('debería manejar arrays vacíos en serialización', () => {
      expect(serializeWorldItemAttributes([])).toBe('empty_array');
    });
  });

  describe('Serialización/Deserialización de Efectos', () => {
    it('debería deserializar correctamente un array de efectos', () => {
      const result = deserializeWorldItemEffects(mockWorldItemBase.effects);
      expect(result).toEqual(['burn', 'light']);
    });

    it('debería serializar correctamente un array de efectos', () => {
      const effects = ['freeze', 'slow'];
      const result = serializeWorldItemEffects(effects);
      expect(JSON.parse(result)).toEqual(effects);
    });
  });

  describe('Serialización/Deserialización de Requisitos', () => {
    it('debería deserializar correctamente un objeto de requisitos', () => {
      const result = deserializeWorldItemRequirements(mockWorldItemBase.requirements);
      expect(result).toEqual({ strength: 10, level: 5 });
    });

    it('debería serializar correctamente un objeto de requisitos', () => {
      const requirements = { intelligence: 12, class: 'mage' };
      const result = serializeWorldItemRequirements(requirements);
      expect(JSON.parse(result)).toEqual(requirements);
    });
  });

  describe('Serialización/Deserialización de Estadísticas', () => {
    it('debería deserializar correctamente un objeto de estadísticas', () => {
      const result = deserializeWorldItemStats(mockWorldItemBase.stats);
      expect(result).toEqual({ damage: 15, weight: 3, durability: 100 });
    });

    it('debería serializar correctamente un objeto de estadísticas', () => {
      const stats = { armor: 8, speed: -1 };
      const result = serializeWorldItemStats(stats);
      expect(JSON.parse(result)).toEqual(stats);
    });
  });

  describe('Serialización/Deserialización de Filtros', () => {
    it('debería deserializar correctamente un objeto de filtros', () => {
      const result = deserializeWorldItemFilters(mockWorldItemBase.filters);
      expect(result).toEqual({ showInInventory: true, materials: ['steel', 'ruby'] });
    });

    it('debería serializar correctamente un objeto de filtros', () => {
      const filters = { hideFromShop: true, minLevel: 3 };
      const result = serializeWorldItemFilters(filters);
      expect(JSON.parse(result)).toEqual(filters);
    });
  });

  describe('Serialización/Deserialización de Tags', () => {
    it('debería deserializar correctamente un array de tags', () => {
      const result = deserializeWorldItemTags(mockWorldItemBase.tags);
      expect(result).toEqual(['weapon', 'fire', 'magic']);
    });

    it('debería serializar correctamente un array de tags', () => {
      const tags = ['armor', 'metal', 'heavy'];
      const result = serializeWorldItemTags(tags);
      expect(JSON.parse(result)).toEqual(tags);
    });
  });

  describe('Transformación completa (toExtendedWorldItem)', () => {
    it('debería transformar correctamente un WorldItemBase a WorldItemExtended', () => {
      const result = toExtendedWorldItem(mockWorldItemBase);

      // Verificar campos básicos
      expect(result.id).toBe(mockWorldItemBase.id);
      expect(result.name).toBe(mockWorldItemBase.name);

      // Verificar campos JSON deserializados
      expect(result.attributes).toEqual(['fire', 'magic', 'sharp']);
      expect(result.effects).toEqual(['burn', 'light']);
      expect(result.requirements).toEqual({ strength: 10, level: 5 });
      expect(result.stats).toEqual({ damage: 15, weight: 3, durability: 100 });
      expect(result.filters).toEqual({ showInInventory: true, materials: ['steel', 'ruby'] });
      expect(result.tags).toEqual(['weapon', 'fire', 'magic']);

      // Verificar que las fechas sean instancias de Date
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Transformación inversa (fromExtendedWorldItem)', () => {
    it('debería transformar correctamente un WorldItemExtended a WorldItemBase', () => {
      // Primero crear un objeto extendido para probarlo
      const extendedItem: Partial<WorldItemExtended> = {
        id: 'world-item-456',
        name: 'Escudo helado',
        emoji: '❄️',
        color: '#5555ff',

        // Campos como objetos/arrays (ya deserializados)
        attributes: ['ice', 'defense', 'block'],
        effects: ['freeze', 'protect'],
        requirements: { constitution: 8, level: 3 },
        stats: { defense: 20, weight: 5, durability: 150 },
        filters: { category: 'shield', minLevel: 3 },
        tags: ['shield', 'ice', 'rare']
      };

      const result = fromExtendedWorldItem(extendedItem);

      // Verificar campos básicos
      expect(result.id).toBe(extendedItem.id);
      expect(result.name).toBe(extendedItem.name);

      // Verificar que los campos sean serializados a strings JSON
      expect(typeof result.attributes).toBe('string');
      expect(typeof result.effects).toBe('string');
      expect(typeof result.requirements).toBe('string');
      expect(typeof result.stats).toBe('string');
      expect(typeof result.filters).toBe('string');
      expect(typeof result.tags).toBe('string');

      // Verificar que los datos sean consistentes al deserializarlos de nuevo
      if (result.attributes && extendedItem.attributes) {
        expect(JSON.parse(result.attributes)).toEqual(extendedItem.attributes);
      }

      if (result.effects && extendedItem.effects) {
        expect(JSON.parse(result.effects)).toEqual(extendedItem.effects);
      }

      if (result.requirements && extendedItem.requirements) {
        expect(JSON.parse(result.requirements)).toEqual(extendedItem.requirements);
      }

      if (result.stats && extendedItem.stats) {
        expect(JSON.parse(result.stats)).toEqual(extendedItem.stats);
      }

      if (result.filters && extendedItem.filters) {
        expect(JSON.parse(result.filters)).toEqual(extendedItem.filters);
      }

      if (result.tags && extendedItem.tags) {
        expect(JSON.parse(result.tags)).toEqual(extendedItem.tags);
      }
    });

    it('debería manejar correctamente campos indefinidos', () => {
      const partialItem: Partial<WorldItemExtended> = {
        name: 'Item parcial',
        // Solo definimos algunos campos
        attributes: ['special'],
        stats: { quality: 10 }
      };

      const result = fromExtendedWorldItem(partialItem);

      // Verificar que solo contiene los campos definidos
      expect(result.name).toBe(partialItem.name);
      expect(result.attributes).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.effects).toBeUndefined();
      expect(result.requirements).toBeUndefined();
      expect(result.filters).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });
  });
});