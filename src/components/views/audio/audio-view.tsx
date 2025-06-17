// Vista de archivos de audio
import { AudioCard } from '@/components/entities/audio/audio-card';

/**
 * Vista de ejemplo para archivos de audio
 * Mostrará una lista de audios con cards y soporte futuro para reproducción.
 */
export function AudioView() {
	// Ejemplo de datos mock
	const audios = [
		{ name: 'Intro', format: 'mp3' },
		{ name: 'Entrevista', format: 'wav' },
	];

	return (
		<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{audios.map((audio) => (
				<AudioCard key={audio.name} name={audio.name} format={audio.format} />
			))}
			{/* Próximamente: reproductor de audio */}
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Esta vista lista archivos de audio y permitirá reproducción.
 * - Extensible para controles de audio y metadatos.
 */
