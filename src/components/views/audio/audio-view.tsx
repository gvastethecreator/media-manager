import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio/audio.store';
import type { AudioWithStats } from '@/types/entities/audio';
import type { ViewProps } from '../types';
import AudioContentView from './audio-content-view';

const viewLogger = clientLogger.withContext('AudioView');

/**
 * Vista de archivos de audio
 * Muestra una lista de audios con cards TCG y soporte para reproducción.
 */
export function AudioView(_props: ViewProps) {
	const navigate = useNavigate();

	// Usar el store completo para evitar errores de tipado
	const audioStore = useAudioStore();
	const audios = audioStore.audios || [];
	const loading = audioStore.loading || false;
	const error = audioStore.error || null;
	const fetchAudios = audioStore.fetchAudios;
	const createAudio = audioStore.createAudio;
	const updateAudio = audioStore.updateAudio;
	const deleteAudio = audioStore.deleteAudio;

	const [showForm, setShowForm] = useState(false);
	const [newAudioName, setNewAudioName] = useState('');
	const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
	const [currentAudio, setCurrentAudio] = useState<AudioWithStats | null>(null);
	const [editingAudio, setEditingAudio] = useState<AudioWithStats | null>(null);

	useEffect(() => {
		if (audios.length === 0) {
			viewLogger.info('Store de audios vacío, cargando desde el servidor...');
			fetchAudios();
		}
	}, [fetchAudios, audios.length]);

	const handleAudioClick = useCallback(
		(audio: AudioWithStats) => {
			viewLogger.info('🖱️ Click en audio:', audio.name);
			// Navegar a la vista de contenido específica del audio
			navigate(`/audio/${audio.id}`);
		},
		[navigate]
	);

	const handleEditAudio = useCallback((audio: AudioWithStats) => {
		setEditingAudio(audio);
		setNewAudioName(audio.name);
		setShowForm(true);
	}, []);

	const handleDeleteAudio = useCallback(
		async (audioId: string) => {
			try {
				await deleteAudio(audioId);
				viewLogger.info('Audio eliminado exitosamente');
			} catch (error) {
				viewLogger.error('Error al eliminar audio:', error);
			}
		},
		[deleteAudio]
	);

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.[0]) {
			setNewAudioFile(event.target.files[0]);
		}
	}, []);

	const handleCreateAudio = useCallback(async () => {
		if (newAudioName.trim() === '' || !newAudioFile) {
			return;
		}

		try {
			const audioData = {
				name: newAudioName,
				file: newAudioFile,
				description: '',
				isFavorite: false,
			};

			if (editingAudio) {
				await updateAudio(editingAudio.id, audioData as any);
			} else {
				await createAudio(audioData as any);
			}

			setNewAudioName('');
			setNewAudioFile(null);
			setShowForm(false);
			setEditingAudio(null);
		} catch (error) {
			viewLogger.error('Error al crear/editar audio:', error);
		}
	}, [newAudioName, newAudioFile, editingAudio, createAudio, updateAudio]);

	// Obtener audios como array
	const sortedAudios = useMemo(() => {
		return audios;
	}, [audios]);

	return (
		<AudioContentView
			audios={sortedAudios}
			isLoading={loading}
			error={error}
			showForm={showForm}
			newAudioName={newAudioName}
			newAudioFile={newAudioFile}
			currentAudio={currentAudio}
			editingAudio={editingAudio}
			setShowForm={setShowForm}
			setNewAudioName={setNewAudioName}
			setNewAudioFile={setNewAudioFile}
			setCurrentAudio={setCurrentAudio}
			setEditingAudio={setEditingAudio}
			handleAudioClick={handleAudioClick}
			handleEditAudio={handleEditAudio}
			handleDeleteAudio={handleDeleteAudio}
			handleFileChange={handleFileChange}
			handleCreateAudio={handleCreateAudio}
		/>
	);
}
