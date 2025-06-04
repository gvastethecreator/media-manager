/**
 * @file Tests unitarios para Character Store
 * @description Validación completa de las funcionalidades del store de personajes
 */

import { useCharacterStore } from '@/store/entities/character';
import { transformCharacterToExtended } from '@/transformers/character/transformer';
import type { CharacterBase, CharacterExtended } from '@/types/entities/character';
import { generateCharacterId } from '@/utils/character';
import { act, renderHook } from '@testing-library/react';

// 🎭 Mock de dependencias externas
jest.mock('@/transformers/character/transformer');
jest.mock('@/utils/character');

const mockTransformCharacterToExtended = transformCharacterToExtended as jest.MockedFunction<
	typeof transformCharacterToExtended
>;
const mockGenerateCharacterId = generateCharacterId as jest.MockedFunction<typeof generateCharacterId>;

describe('Character Store', () => {
	beforeEach(() => {
		// 🧹 Limpiar mocks y store state
		jest.clearAllMocks();

		// Reset del store antes de cada test
		const { result } = renderHook(() => useCharacterStore());
		act(() => {
			result.current.resetState();
		});

		// 🔧 Configurar mocks por defecto
		mockGenerateCharacterId.mockReturnValue('test-character-id');
		mockTransformCharacterToExtended.mockImplementation((character: CharacterBase) => ({
			...character,
			isSelected: false,
			isHighlighted: false,
			isExpanded: false,
			isEditing: false,
			displayOrder: 0,
		} as CharacterExtended));
	});

	describe('🏗️ Estado Inicial', () => {
		it('debería tener el estado inicial correcto', () => {
			const { result } = renderHook(() => useCharacterStore());

			expect(result.current.characters).toEqual({});
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.selectedCharacterId).toBeNull();
			expect(result.current.hoveredCharacterId).toBeNull();
			expect(result.current.expandedCharacterIds).toEqual([]);
			expect(result.current.activeFilters).toEqual([]);
			expect(result.current.searchTerm).toBe('');
			expect(result.current.currentSortOption).toBe('name_asc');
			expect(result.current.groupBy).toBe('none');
		});

		it('debería tener configuración de vista por defecto correcta', () => {
			const { result } = renderHook(() => useCharacterStore());

			expect(result.current.viewConfig).toEqual({
				mode: 'grid',
				gridColumns: 3,
				cardSize: 'medium',
				showStats: true,
				showDescription: true,
				defaultView: 'cards',
			});
		});
	});

	describe('📋 Operaciones CRUD', () => {
		const mockCharacter: CharacterBase = {
			id: 'character-1',
			name: 'Aragorn',
			description: 'Ranger del Norte',
			emoji: '🗡️',
			color: '#8B4513',
			level: 20,
			class: 'ranger',
			race: 'human',
			alignment: 'lawful good',
			category: 'fantasy',
			type: 'protagonist',
			backstory: 'Heredero de Isildur',
			stats: '{"strength": 16, "dexterity": 18}',
			psychologicalProfile: 'Valiente y noble',
			socialProfile: 'Líder natural',
			relationships: '[]',
			goals: '["Reclamar el trono"]',
			fears: '["Fallar a su pueblo"]',
			beliefs: '["Honor ante todo"]',
			personality: '["Valiente", "Noble"]',
			skills: '["Supervivencia", "Liderazgo"]',
			abilities: '["Rastreo", "Combate"]',
			featuredImage: null,
			isFavorite: false,
			sortBy: 'name',
			filters: '[]',
			createdAt: new Date(),
			updatedAt: new Date(),
			shortcut: null,
		};

		describe('✅ addCharacter', () => {
			it('debería añadir un personaje correctamente', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.addCharacter(mockCharacter);
				});

				expect(mockTransformCharacterToExtended).toHaveBeenCalledWith(mockCharacter);
				expect(result.current.characters['character-1']).toBeDefined();
				expect(result.current.characters['character-1'].name).toBe('Aragorn');
			});

			it('debería generar ID si no existe', () => {
				const { result } = renderHook(() => useCharacterStore());
				const characterWithoutId = { ...mockCharacter };
				delete (characterWithoutId as any).id;

				act(() => {
					result.current.addCharacter(characterWithoutId);
				});

				expect(mockGenerateCharacterId).toHaveBeenCalled();
				expect(result.current.characters['test-character-id']).toBeDefined();
			});

			it('debería manejar CharacterExtended directamente', () => {
				const { result } = renderHook(() => useCharacterStore());
				const extendedCharacter: CharacterExtended = {
					...mockCharacter,
					isSelected: true,
					isHighlighted: false,
					isExpanded: false,
					isEditing: false,
					displayOrder: 0,
				};

				act(() => {
					result.current.addCharacter(extendedCharacter);
				});

				expect(result.current.characters['character-1'].isSelected).toBe(true);
			});
		});

		describe('📝 updateCharacter', () => {
			beforeEach(() => {
				const { result } = renderHook(() => useCharacterStore());
				act(() => {
					result.current.addCharacter(mockCharacter);
				});
			});

			it('debería actualizar un personaje existente', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.updateCharacter('character-1', {
						name: 'Strider',
						level: 25,
						description: 'Rey de Gondor',
					});
				});

				const updatedCharacter = result.current.characters['character-1'];
				expect(updatedCharacter.name).toBe('Strider');
				expect(updatedCharacter.level).toBe(25);
				expect(updatedCharacter.description).toBe('Rey de Gondor');
				expect(updatedCharacter.updatedAt).toBeInstanceOf(Date);
			});

			it('debería serializar datos complejos', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.updateCharacter('character-1', {
						stats: { strength: 20, dexterity: 16 } as any,
						goals: ['Reclamar trono', 'Derrotar Sauron'] as any,
					});
				});

				const character = result.current.characters['character-1'];
				expect(typeof character.stats).toBe('string');
				expect(typeof character.goals).toBe('string');
			});

			it('no debería hacer nada si el personaje no existe', () => {
				const { result } = renderHook(() => useCharacterStore());
				const initialState = { ...result.current };

				act(() => {
					result.current.updateCharacter('non-existent', { name: 'Test' });
				});

				expect(result.current.characters).toEqual(initialState.characters);
			});
		});

		describe('🗑️ removeCharacter', () => {
			beforeEach(() => {
				const { result } = renderHook(() => useCharacterStore());
				act(() => {
					result.current.addCharacter(mockCharacter);
				});
			});

			it('debería eliminar un personaje existente', () => {
				const { result } = renderHook(() => useCharacterStore());

				expect(result.current.characters['character-1']).toBeDefined();

				act(() => {
					result.current.removeCharacter('character-1');
				});

				expect(result.current.characters['character-1']).toBeUndefined();
			});

			it('no debería causar errores al eliminar personaje inexistente', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.removeCharacter('non-existent');
				});

				expect(result.current.characters['character-1']).toBeDefined();
			});
		});
	});

	describe('🔄 Operaciones por Lotes', () => {
		const characters: CharacterBase[] = [
			{ ...mockCharacter, id: 'char-1', name: 'Legolas' },
			{ ...mockCharacter, id: 'char-2', name: 'Gimli' },
			{ ...mockCharacter, id: 'char-3', name: 'Gandalf' },
		];

		describe('bulkAddCharacters', () => {
			it('debería añadir múltiples personajes', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.bulkAddCharacters(characters);
				});

				expect(Object.keys(result.current.characters)).toHaveLength(3);
				expect(result.current.characters['char-1'].name).toBe('Legolas');
				expect(result.current.characters['char-2'].name).toBe('Gimli');
				expect(result.current.characters['char-3'].name).toBe('Gandalf');
			});
		});

		describe('bulkUpdateCharacters', () => {
			beforeEach(() => {
				const { result } = renderHook(() => useCharacterStore());
				act(() => {
					result.current.bulkAddCharacters(characters);
				});
			});

			it('debería actualizar múltiples personajes', () => {
				const { result } = renderHook(() => useCharacterStore());

				const updates = [
					{ id: 'char-1', data: { level: 30 } },
					{ id: 'char-2', data: { level: 25 } },
					{ id: 'char-3', data: { level: 99 } },
				];

				act(() => {
					result.current.bulkUpdateCharacters(updates);
				});

				expect(result.current.characters['char-1'].level).toBe(30);
				expect(result.current.characters['char-2'].level).toBe(25);
				expect(result.current.characters['char-3'].level).toBe(99);
			});

			it('debería actualizar fecha de modificación en todos', () => {
				const { result } = renderHook(() => useCharacterStore());
				const beforeUpdate = new Date();

				const updates = [
					{ id: 'char-1', data: { level: 30 } },
					{ id: 'char-2', data: { level: 25 } },
				];

				act(() => {
					result.current.bulkUpdateCharacters(updates);
				});

				expect(result.current.characters['char-1'].updatedAt).toBeInstanceOf(Date);
				expect(result.current.characters['char-2'].updatedAt).toBeInstanceOf(Date);
				expect(result.current.characters['char-1'].updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
			});
		});

		describe('bulkRemoveCharacters', () => {
			beforeEach(() => {
				const { result } = renderHook(() => useCharacterStore());
				act(() => {
					result.current.bulkAddCharacters(characters);
				});
			});

			it('debería eliminar múltiples personajes', () => {
				const { result } = renderHook(() => useCharacterStore());

				expect(Object.keys(result.current.characters)).toHaveLength(3);

				act(() => {
					result.current.bulkRemoveCharacters(['char-1', 'char-3']);
				});

				expect(Object.keys(result.current.characters)).toHaveLength(1);
				expect(result.current.characters['char-1']).toBeUndefined();
				expect(result.current.characters['char-2']).toBeDefined();
				expect(result.current.characters['char-3']).toBeUndefined();
			});
		});
	});

	describe('⭐ Operaciones Especializadas', () => {
		beforeEach(() => {
			const { result } = renderHook(() => useCharacterStore());
			act(() => {
				result.current.addCharacter(mockCharacter);
			});
		});

		describe('toggleFavorite', () => {
			it('debería cambiar el estado de favorito', () => {
				const { result } = renderHook(() => useCharacterStore());

				expect(result.current.characters['character-1'].isFavorite).toBe(false);

				act(() => {
					result.current.toggleFavorite('character-1');
				});

				expect(result.current.characters['character-1'].isFavorite).toBe(true);

				act(() => {
					result.current.toggleFavorite('character-1');
				});

				expect(result.current.characters['character-1'].isFavorite).toBe(false);
			});
		});

		describe('setFeaturedImage', () => {
			it('debería establecer imagen destacada', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.setFeaturedImage('character-1', 'image-123');
				});

				expect(result.current.characters['character-1'].featuredImage).toBe('image-123');
			});

			it('debería permitir limpiar imagen destacada', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.setFeaturedImage('character-1', 'image-123');
				});

				act(() => {
					result.current.setFeaturedImage('character-1', null);
				});

				expect(result.current.characters['character-1'].featuredImage).toBeNull();
			});
		});

		describe('Level Management', () => {
			it('incrementLevel debería aumentar el nivel', () => {
				const { result } = renderHook(() => useCharacterStore());

				expect(result.current.characters['character-1'].level).toBe(20);

				act(() => {
					result.current.incrementLevel('character-1');
				});

				expect(result.current.characters['character-1'].level).toBe(21);
			});

			it('decrementLevel debería disminuir el nivel', () => {
				const { result } = renderHook(() => useCharacterStore());

				expect(result.current.characters['character-1'].level).toBe(20);

				act(() => {
					result.current.decrementLevel('character-1');
				});

				expect(result.current.characters['character-1'].level).toBe(19);
			});

			it('decrementLevel no debería bajar de 1', () => {
				const { result } = renderHook(() => useCharacterStore());

				// Primero bajamos a nivel 1
				act(() => {
					result.current.updateCharacter('character-1', { level: 1 });
				});

				act(() => {
					result.current.decrementLevel('character-1');
				});

				expect(result.current.characters['character-1'].level).toBe(1);
			});
		});
	});

	describe('🔧 Estado de Carga y Errores', () => {
		it('setLoading debería actualizar estado de carga', () => {
			const { result } = renderHook(() => useCharacterStore());

			act(() => {
				result.current.setLoading(true);
			});

			expect(result.current.isLoading).toBe(true);

			act(() => {
				result.current.setLoading(false);
			});

			expect(result.current.isLoading).toBe(false);
		});

		it('setError debería establecer mensaje de error', () => {
			const { result } = renderHook(() => useCharacterStore());

			act(() => {
				result.current.setError('Error de test');
			});

			expect(result.current.error).toBe('Error de test');
		});

		it('clearError debería limpiar mensaje de error', () => {
			const { result } = renderHook(() => useCharacterStore());

			act(() => {
				result.current.setError('Error de test');
			});

			act(() => {
				result.current.clearError();
			});

			expect(result.current.error).toBeNull();
		});
	});

	describe('🔗 Gestión de Relaciones', () => {
		beforeEach(() => {
			const { result } = renderHook(() => useCharacterStore());
			act(() => {
				result.current.addCharacter(mockCharacter);
			});
		});

		describe('addRelationship', () => {
			it('debería añadir una relación entre personajes', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.addRelationship('character-1', 'char-2', 'Legolas', 'friend', 9);
				});

				const character = result.current.characters['character-1'];
				const relationships = JSON.parse(character.relationships || '[]');

				expect(relationships).toHaveLength(1);
				expect(relationships[0]).toMatchObject({
					id: 'char-2',
					name: 'Legolas',
					type: 'friend',
					strength: 9,
				});
			});

			it('debería manejar relationships inicialmente vacías', () => {
				const { result } = renderHook(() => useCharacterStore());

				// Establecer relationships como undefined
				act(() => {
					result.current.updateCharacter('character-1', { relationships: undefined as any });
				});

				act(() => {
					result.current.addRelationship('character-1', 'char-2', 'Legolas', 'friend', 9);
				});

				const character = result.current.characters['character-1'];
				const relationships = JSON.parse(character.relationships || '[]');
				expect(relationships).toHaveLength(1);
			});
		});

		describe('removeRelationship', () => {
			it('debería eliminar una relación existente', () => {
				const { result } = renderHook(() => useCharacterStore());

				// Primero añadir relación
				act(() => {
					result.current.addRelationship('character-1', 'char-2', 'Legolas', 'friend', 9);
				});

				// Luego eliminarla
				act(() => {
					result.current.removeRelationship('character-1', 'char-2');
				});

				const character = result.current.characters['character-1'];
				const relationships = JSON.parse(character.relationships || '[]');
				expect(relationships).toHaveLength(0);
			});
		});

		describe('updateCharacterRelations', () => {
			it('debería actualizar relaciones por lotes', () => {
				const { result } = renderHook(() => useCharacterStore());

				act(() => {
					result.current.updateCharacterRelations('character-1', {
						groupIds: ['group-1', 'group-2'],
						propertyIds: ['prop-1'],
						wildcardIds: ['wild-1', 'wild-2', 'wild-3'],
					});
				});

				const character = result.current.characters['character-1'];
				expect(character.groups).toEqual([{ id: 'group-1' }, { id: 'group-2' }]);
				expect(character.properties).toEqual([{ id: 'prop-1' }]);
				expect(character.wildcards).toEqual([{ id: 'wild-1' }, { id: 'wild-2' }, { id: 'wild-3' }]);
			});
		});
	});

	describe('🔄 Operaciones de Restablecimiento', () => {
		beforeEach(() => {
			const { result } = renderHook(() => useCharacterStore());
			act(() => {
				result.current.addCharacter(mockCharacter);
				result.current.setLoading(true);
				result.current.setError('Test error');
			});
		});

		it('resetCharacters debería limpiar solo los personajes', () => {
			const { result } = renderHook(() => useCharacterStore());

			expect(Object.keys(result.current.characters)).toHaveLength(1);
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe('Test error');

			act(() => {
				result.current.resetCharacters();
			});

			expect(result.current.characters).toEqual({});
			expect(result.current.isLoading).toBe(true); // No debería cambiar
			expect(result.current.error).toBe('Test error'); // No debería cambiar
		});

		it('resetState debería limpiar todo el estado', () => {
			const { result } = renderHook(() => useCharacterStore());

			expect(Object.keys(result.current.characters)).toHaveLength(1);
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe('Test error');

			act(() => {
				result.current.resetState();
			});

			expect(result.current.characters).toEqual({});
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});
	});

	describe('⚡ Tests de Performance', () => {
		it('debería manejar grandes cantidades de personajes eficientemente', () => {
			const { result } = renderHook(() => useCharacterStore());

			// Crear 1000 personajes
			const largeCharacterSet = Array.from({ length: 1000 }, (_, index) => ({
				...mockCharacter,
				id: `char-${index}`,
				name: `Character ${index}`,
				level: index % 100 + 1,
			}));

			const startTime = performance.now();

			act(() => {
				result.current.bulkAddCharacters(largeCharacterSet);
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(Object.keys(result.current.characters)).toHaveLength(1000);
			expect(duration).toBeLessThan(1000); // Debería tomar menos de 1 segundo
		});

		it('debería manejar actualizaciones por lotes eficientemente', () => {
			const { result } = renderHook(() => useCharacterStore());

			// Primero añadir personajes
			const characters = Array.from({ length: 500 }, (_, index) => ({
				...mockCharacter,
				id: `char-${index}`,
				name: `Character ${index}`,
			}));

			act(() => {
				result.current.bulkAddCharacters(characters);
			});

			// Luego hacer update masivo
			const updates = characters.map((char, index) => ({
				id: char.id,
				data: { level: index % 50 + 1 },
			}));

			const startTime = performance.now();

			act(() => {
				result.current.bulkUpdateCharacters(updates);
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(duration).toBeLessThan(500); // Debería ser rápido
		});
	});

	describe('🧹 Casos Edge', () => {
		it('debería manejar personajes con datos malformados', () => {
			const { result } = renderHook(() => useCharacterStore());

			const malformedCharacter = {
				...mockCharacter,
				stats: 'invalid-json{',
				relationships: null,
				goals: undefined,
			} as any;

			expect(() => {
				act(() => {
					result.current.addCharacter(malformedCharacter);
				});
			}).not.toThrow();

			expect(result.current.characters['character-1']).toBeDefined();
		});

		it('debería manejar operaciones en personajes inexistentes sin errores', () => {
			const { result } = renderHook(() => useCharacterStore());

			expect(() => {
				act(() => {
					result.current.toggleFavorite('non-existent');
					result.current.incrementLevel('non-existent');
					result.current.setFeaturedImage('non-existent', 'img-1');
					result.current.addRelationship('non-existent', 'other', 'Other', 'friend', 5);
				});
			}).not.toThrow();
		});

		it('debería manejar datos duplicados correctamente', () => {
			const { result } = renderHook(() => useCharacterStore());

			act(() => {
				result.current.addCharacter(mockCharacter);
			});

			// Intentar añadir el mismo personaje de nuevo
			act(() => {
				result.current.addCharacter(mockCharacter);
			});

			expect(Object.keys(result.current.characters)).toHaveLength(1);
		});
	});
});
