import type { Document } from '@prisma/client';

/**
 * 🗿 Modelo base de Document, sin los campos que se moverán a stats.
 * Por consistencia, mantenemos los datos crudos separados de las estadísticas.
 */
export type DocumentBase = Omit<Document, 'wordCount' | 'charCount'>;

/**
 * 📊 Estadísticas calculadas y derivadas para un Document.
 */
export interface DocumentStatistics {
	wordCount: number;
	charCount: number;
	readingTime: number; // en minutos
	versionCount: number; // para futuras implementaciones
}

/**
 * ✨ Modelo extendido de Document con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface DocumentWithStats extends DocumentBase {
	stats: DocumentStatistics;
}