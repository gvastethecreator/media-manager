/**
 * @file Pruebas para los transformadores de Tag
 * @module tests/entities/tag
 */

import {
  extendTag,
  fromTagComplete,
  toTagComplete
} from '../../transformers/tag/serializers';
import type { TagBase, TagComplete } from '../../types/entities/tag';

describe('Tag Serializers', () => {
  const mockTagBase: TagBase = {
    id: 'tag1',
    name: 'Test Tag',
    emoji: '🏷️',
    color: '#3b82f6',
    description: 'Test description',
    shortcut: 'tt',
    category: 'test',
    featuredImage: null,
    isFavorite: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  describe('toTagComplete', () => {
    it('should convert a TagBase to TagComplete', () => {
      const result = toTagComplete(mockTagBase);

      // Verificar que el resultado sea un TagComplete
      expect(result).toEqual(mockTagBase);

      // Verificar que los campos sean idénticos ya que Tag no usa campos JSON
      expect(result.id).toBe(mockTagBase.id);
      expect(result.name).toBe(mockTagBase.name);
      expect(result.emoji).toBe(mockTagBase.emoji);
      expect(result.color).toBe(mockTagBase.color);
    });
  });

  describe('fromTagComplete', () => {
    it('should convert a TagComplete to TagBase', () => {
      const tagComplete: TagComplete = { ...mockTagBase };
      const result = fromTagComplete(tagComplete);

      // Verificar que el resultado sea un TagBase
      expect(result).toEqual(tagComplete);

      // Verificar que los campos sean idénticos ya que Tag no usa campos JSON
      expect(result.id).toBe(tagComplete.id);
      expect(result.name).toBe(tagComplete.name);
      expect(result.emoji).toBe(tagComplete.emoji);
      expect(result.color).toBe(tagComplete.color);
    });
  });

  describe('extendTag', () => {
    it('should extend a TagBase with UI properties', () => {
      const result = extendTag(mockTagBase);

      // Verificar que el resultado sea un TagExtended
      expect(result).toHaveProperty('isSelected', false);
      expect(result).toHaveProperty('isHighlighted', false);
      expect(result).toHaveProperty('isEditing', false);
      expect(result).toHaveProperty('isExpanded', false);

      // Verificar que los campos base se mantengan
      expect(result.id).toBe(mockTagBase.id);
      expect(result.name).toBe(mockTagBase.name);
      expect(result.emoji).toBe(mockTagBase.emoji);
      expect(result.color).toBe(mockTagBase.color);
    });

    it('should extend a TagComplete with UI properties', () => {
      const tagComplete: TagComplete = { ...mockTagBase };
      const result = extendTag(tagComplete);

      // Verificar que el resultado sea un TagExtended
      expect(result).toHaveProperty('isSelected', false);
      expect(result).toHaveProperty('isHighlighted', false);
      expect(result).toHaveProperty('isEditing', false);
      expect(result).toHaveProperty('isExpanded', false);

      // Verificar que los campos base se mantengan
      expect(result.id).toBe(tagComplete.id);
      expect(result.name).toBe(tagComplete.name);
      expect(result.emoji).toBe(tagComplete.emoji);
      expect(result.color).toBe(tagComplete.color);
    });
  });
});