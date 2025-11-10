/**
 * @file Formulario de personajes con sistema de presets
 * @module components/settings/characters/character-preset-form
 * @description Versión actualizada que usa el sistema de presets configurables
 */

import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreateCharacter, useUpdateCharacter } from '@/lib/api/characters';
import { toastService } from '@/lib/ui/toast';
import type { CharacterWithStats } from '@/types/entities/character/types';

interface CharacterPresetFormProps {
	/** Personaje a editar (opcional) */
	character?: CharacterWithStats | null;
	/** Si está en modo edición */
	isEditing?: boolean;
	/** Callback al crear exitosamente */
	onCreated?: (character: CharacterWithStats) => void;
	/** Callback al actualizar exitosamente */
	onUpdated?: (character: CharacterWithStats) => void;
	/** Callback al cancelar */
	onCancel?: () => void;
}

/**
 * Formulario de personajes con presets configurables
 *
 * Soporta 5 niveles de detalle:
 * - Mínimo (⚡): Solo nombre + emoji
 * - Básico (📝): Info esencial
 * - Estándar (👤): Perfil completo
 * - RPG (🎲): Stats y habilidades
 * - Completo (📋): Todos los campos
 */
export function CharacterPresetForm({
	character,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CharacterPresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// React Query hooks
	const createCharacterMutation = useCreateCharacter();
	const updateCharacterMutation = useUpdateCharacter();

	// Preparar datos iniciales si estamos editando
	const initialData = isEditing && character ? {
		name: character.name,
		description: character.description,
		emoji: character.emoji,
		color: character.color,
		age: character.age,
		gender: character.gender,
		species: character.species,
		occupation: character.occupation,
		personality: character.personality,
		background: character.background,
		relationships: character.relationships,
		class: character.class,
		level: character.level,
		alignment: character.alignment,
		skills: character.skills,
		equipment: character.equipment,
		notes: character.notes,
		isFavorite: character.isFavorite,
	} : undefined;

	// Manejar submit del formulario
	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			// Preparar datos para el API
			const characterData = {
				name: data.name,
				description: data.description || null,
				emoji: data.emoji || '👤',
				color: data.color || '#3b82f6',
				category: data.category || null,
				age: data.age || null,
				gender: data.gender || null,
				species: data.species || null,
				occupation: data.occupation || null,
				personality: data.personality || null,
				background: data.background || null,
				relationships: data.relationships || null,
				skills: data.skills || null,
				equipment: data.equipment || null,
				notes: data.notes || null,
				isFavorite: data.isFavorite || false,
				// Campos con valores por defecto
				totalImages: 0,
				totalVideos: 0,
				featuredImage: null,
				parentId: null,
			};

			if (isEditing && character) {
				// Actualizar personaje existente
				const updated = await updateCharacterMutation.mutateAsync({
					id: character.id,
					data: characterData,
				});

				toastService.success('Personaje actualizado correctamente');
				onUpdated?.(updated);
			} else {
				// Crear nuevo personaje
				const created = await createCharacterMutation.mutateAsync(characterData);

				toastService.success('Personaje creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el personaje`, {
				description: errorMessage,
			});
			throw error; // Re-throw para que PresetForm maneje el estado de error
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="character"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear personaje'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
