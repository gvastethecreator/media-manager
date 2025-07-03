import { Music } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { AudioCard } from '@/components/cards/audio-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio';
import type { AudioWithStats } from '@/types/entities/audio';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('AudioView');

const MemoizedAudioCard = React.memo(
	({ audio, onAudioClick }: { audio: AudioWithStats; onAudioClick: () => void }) => (
		<AudioCard audio={audio} onClick={onAudioClick} className="h-full" />
	),
	(prevProps, nextProps) =>
		prevProps.audio.id === nextProps.audio.id &&
		prevProps.audio.name === nextProps.audio.name &&
		prevProps.audio.updatedAt === nextProps.audio.updatedAt
);
MemoizedAudioCard.displayName = 'MemoizedAudioCard';

/**
 * Vista de archivos de audio
 * Muestra una lista de audios con cards TCG y soporte para reproducción.
 */
export function AudioView(_props: ViewProps) {
	// Usar selectores individuales para evitar recrear objetos
	const audiosRecord = useAudioStore((s) => s.audios);
	const isLoading = useAudioStore((s) => s.isLoading);
	const error = useAudioStore((s) => s.error);
	const loadAudios = useAudioStore((s) => s.loadAudios);
	const getSortedAudios = useAudioStore((s) => s.getSortedAudios);

	useEffect(() => {
		if (Object.keys(audiosRecord).length === 0) {
			viewLogger.info('Store de audios vacío, cargando desde el servidor...');
			loadAudios();
		}
	}, [loadAudios, audiosRecord]);

	const handleAudioClick = useCallback((audio: AudioWithStats) => {
		viewLogger.info('🖱️ Click en audio:', audio.name);
		// Lógica de navegación o apertura de reproductor aquí
	}, []);

	// Cachear el resultado de getSortedAudios
	const sortedAudios = useMemo(() => {
		return getSortedAudios();
	}, [getSortedAudios, audiosRecord]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && Object.keys(audiosRecord).length === 0) {
		return <LoadingScreen />;
	}

	if (sortedAudios.length === 0) {
		return (
			<EmptyState
				icon={Music}
				title="No hay archivos de audio"
				description="Sube archivos de audio para comenzar a usar el reproductor."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{sortedAudios.map((audio, index) => {
						const onAudioClick = () => handleAudioClick(audio);
						return (
							<motion.div
								key={audio.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-audio-id={audio.id}
								>
									<MemoizedAudioCard audio={audio} onAudioClick={onAudioClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa AudioCard TCG con efectos holográficos
 * - Integra store Zustand para gestión de estado
 * - Soporte para reproducción integrada con controles
 * - Animaciones fluidas con motion/react
 * - Lazy loading y memoización para rendimiento
 */
