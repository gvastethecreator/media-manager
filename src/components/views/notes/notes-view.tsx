'use client';

import type { NoteWithStats } from '@/app/actions/notes/note.actions';
import { getNotes } from '@/app/actions/notes/note.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import { ScrollText } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('NotesView');

// Configuración visual simplificada para notas
const DEFAULT_NOTE_OPTIONS: CardOptions = {
	primaryColor: '#ec4899',
	secondaryColor: '#db2777',
};

export function NotesView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentNote } = useFileManager();
	const router = useRouter();
	const [notes, setNotes] = useState<NoteWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_NOTE_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticNotes, _addEvent] = clientEvents.useEvents<NoteWithStats[]>(notes);

	const fetchNotes = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando notas...');
			const data = await getNotes();
			setNotes(data);
			viewLogger.info(`✅ ${data.length} notas cargadas`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando notas:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar la configuración visual desde el servidor
	const loadVisualConfig = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando configuración visual para notas...');
			const response = await fetch('/api/entities/notes/visual-config');
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			const config = await response.json();
			setVisualConfig({ ...DEFAULT_NOTE_OPTIONS, ...config });
			viewLogger.info('✅ Configuración visual cargada');
		} catch (err) {
			viewLogger.error('❌ Error cargando configuración visual:', err);
			// Mantener la configuración predeterminada en caso de error
		}
	}, []);

	useEffect(() => {
		// Cargar notas inicialmente
		fetchNotes();
		// Cargar configuración visual
		loadVisualConfig();
	}, [fetchNotes, loadVisualConfig]);

	const handleNoteClick = useCallback(
		(note: NoteWithStats) => {
			viewLogger.info('🖱️ Click en nota:', note.title);
			setCurrentView('note-content');
			setCurrentNote(note.id);
		},
		[setCurrentView, setCurrentNote]
	);

	const handleEditNote = useCallback(
		(note: NoteWithStats) => {
			viewLogger.info('⚙️ Editando nota:', note.title);
			router.push(`/settings/notes?id=${note.id}`);
		},
		[router]
	);

	const handleDeleteNote = useCallback((id: string) => {
		viewLogger.info('🗑️ Eliminando nota:', id);
		// Implementar lógica de eliminación
	}, []);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticNotes || optimisticNotes.length === 0) {
		return (
			<EmptyState
				icon={ScrollText}
				title="No hay notas"
				description="Las notas te ayudan a organizar tus ideas y proyectos. Crea una nueva nota desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticNotes.map((note, index) => (
						<motion.div
							key={note.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="cursor-pointer"
						>
							<EntityCardAdapter
								entityType="note"
								entity={note}
								onClick={() => handleNoteClick(note)}
								options={visualConfig}
								className="h-full"
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
