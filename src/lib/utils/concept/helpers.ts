import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeTags } from '@/transformers/concept';
import { ConceptCategory } from '@/types/entities/concept/enums';
import type { ConceptBase, ConceptExtended } from '@/types/entities/concept/types';

const helpersLogger = serverLogger.withContext('ConceptHelpers');

/**
 * Genera un color aleatorio para un concepto
 * @returns Color en formato hexadecimal
 */
export function generateRandomConceptColor(): string {
	const colors = [
		'#3b82f6', // blue
		'#8b5cf6', // purple
		'#ec4899', // pink
		'#f43f5e', // rose
		'#ef4444', // red
		'#f97316', // orange
		'#f59e0b', // amber
		'#eab308', // yellow
		'#84cc16', // lime
		'#22c55e', // green
		'#10b981', // emerald
		'#14b8a6', // teal
		'#06b6d4', // cyan
		'#0ea5e9', // sky
		'#6366f1', // indigo
		'#a855f7', // violet
	];

	return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Genera un emoji aleatorio para un concepto basado en su categoría
 * @param category Categoría del concepto
 * @returns Emoji relacionado con la categoría
 */
export function generateEmojiForCategory(category?: string): string {
	const categoryEmojis: Record<string, string[]> = {
		[ConceptCategory.GENERAL]: ['💡', '🧠', '💭', '✨'],
		[ConceptCategory.STORYLINE]: ['📚', '📖', '📜', '🔖'],
		[ConceptCategory.WORLDBUILDING]: ['🌍', '🏰', '🗺️', '🌄'],
		[ConceptCategory.CHARACTER_DEVELOPMENT]: ['👤', '👪', '👑', '🎭'],
		[ConceptCategory.SETTING]: ['🏕️', '🏙️', '🏝️', '🪐'],
		[ConceptCategory.THEME]: ['🎨', '🖌️', '🎭', '📊'],
		[ConceptCategory.PLOT]: ['📋', '📝', '📈', '🧩'],
		[ConceptCategory.LORE]: ['📔', '🏛️', '⏳', '🗿'],
		[ConceptCategory.MECHANICS]: ['⚙️', '🔧', '🎮', '🎲'],
		[ConceptCategory.OTHER]: ['❓', '🔍', '📌', '🔮'],
	};

	const defaultEmojis = ['💡', '📝', '🧠', '💭'];

	if (!category || !categoryEmojis[category]) {
		return defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
	}

	const emojis = categoryEmojis[category];
	return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Calcula las estadísticas de uso de conceptos
 * @param concepts Lista de conceptos
 * @returns Objeto con estadísticas
 */
export function calculateConceptsStats(concepts: ConceptBase[]): {
	total: number;
	byCategory: Record<string, number>;
	favorites: number;
	withImages: number;
	withRelations: number;
} {
	try {
		let favorites = 0;
		let withImages = 0;
		let withRelations = 0;
		const byCategory: Record<string, number> = {};

		// Análisis de cada concepto
		for (const concept of concepts) {
			// Conteo por categoría
			const category = concept.category || 'uncategorized';
			byCategory[category] = (byCategory[category] || 0) + 1;

			// Otros conteos
			if (concept.isFavorite) favorites++;

			// Si hay recuento disponible
			if ('_count' in concept && concept._count) {
				const count = concept._count as {
					images?: number;
					videos?: number;
					prompts?: number;
					notes?: number;
					characters?: number;
					places?: number;
					worldItems?: number;
					properties?: number;
					wildcards?: number;
					groups?: number;
					albums?: number;
					collections?: number;
					tags?: number;
				};

				if (count.images && count.images > 0) {
					withImages++;
				}

				if (
					(count.places && count.places > 0) ||
					(count.worldItems && count.worldItems > 0) ||
					(count.notes && count.notes > 0) ||
					(count.prompts && count.prompts > 0)
				) {
					withRelations++;
				}
			}
		}

		return {
			total: concepts.length,
			byCategory,
			favorites,
			withImages,
			withRelations,
		};
	} catch (error) {
		helpersLogger.error('❌ Error al calcular estadísticas de conceptos:', error);
		return { total: 0, byCategory: {}, favorites: 0, withImages: 0, withRelations: 0 };
	}
}

/**
 * Encuentra conceptos relacionados por tags o categoría
 * @param concept Concepto de referencia
 * @param allConcepts Lista completa de conceptos
 * @param maxResults Número máximo de resultados
 * @returns Lista de conceptos relacionados
 */
export function findRelatedConcepts(
	concept: ConceptExtended,
	allConcepts: ConceptExtended[],
	maxResults = 5
): ConceptExtended[] {
	try {
		// Evitar incluir el mismo concepto
		const otherConcepts = allConcepts.filter((c) => c.id !== concept.id);

		// Si no hay otros conceptos para comparar
		if (otherConcepts.length === 0) return [];

		const conceptCategory = concept.category || '';

		// Calcular puntuación de relación para cada concepto
		const scoredConcepts = otherConcepts.map((c) => {
			let score = 0;

			// Puntos por categoría coincidente
			if (c.category === conceptCategory) {
				score += 3;
			}

			// Puntos por tipo coincidente
			if (c.type === concept.type && concept.type) {
				score += 2;
			}

			return { concept: c, score };
		});

		// Ordenar por puntuación y tomar los mejores
		const bestMatches = scoredConcepts
			.filter((sc) => sc.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults);

		// Si no hay suficientes conceptos relacionados, añadir algunos de la misma categoría
		if (bestMatches.length < maxResults && conceptCategory) {
			const sameCategoryNotIncluded = otherConcepts
				.filter((c) => c.category === conceptCategory && !bestMatches.some((m) => m.concept.id === c.id))
				.slice(0, maxResults - bestMatches.length)
				.map((c) => ({ concept: c, score: 1 }));

			bestMatches.push(...sameCategoryNotIncluded);
		}

		// Convertir a conceptos extendidos
		return bestMatches.map((match) => {
			return {
				...match.concept,
				totalAssociations:
					'stats' in match.concept && (match.concept as any).stats ? (match.concept as any).stats.totalAssociations : 0,
				lastUsed: match.concept.updatedAt,
				usageCount:
					'_count' in match.concept && match.concept._count
						? Object.values(match.concept._count as Record<string, number>).reduce(
								(sum: number, count: number) => sum + count,
								0
							)
						: 0,
			};
		});
	} catch (error) {
		helpersLogger.error('❌ Error al calcular conceptos relacionados:', error);
		return [];
	}
}

/**
 * Extrae palabras clave de un texto para sugerir tags
 * @param text Texto para analizar
 * @param existingTags Tags ya asignados
 * @param maxSuggestions Número máximo de sugerencias
 * @returns Lista de tags sugeridos
 */
export function suggestTagsFromText(text: string, existingTags: string[] = [], maxSuggestions = 5): string[] {
	try {
		if (!text) return [];

		// Palabras a ignorar (stopwords)
		const stopwords = new Set([
			'a',
			'al',
			'algo',
			'algunas',
			'algunos',
			'ante',
			'antes',
			'como',
			'con',
			'contra',
			'cual',
			'cuando',
			'de',
			'del',
			'desde',
			'donde',
			'durante',
			'e',
			'el',
			'ella',
			'ellas',
			'ellos',
			'en',
			'entre',
			'era',
			'erais',
			'eran',
			'eras',
			'eres',
			'es',
			'esa',
			'esas',
			'ese',
			'eso',
			'esos',
			'esta',
			'estaba',
			'estabais',
			'estaban',
			'estabas',
			'estad',
			'estada',
			'estadas',
			'estado',
			'estados',
			'estamos',
			'estando',
			'estar',
			'estaremos',
			'estará',
			'estarán',
			'estarás',
			'estaré',
			'estaréis',
			'estaría',
			'estaríais',
			'estaríamos',
			'estarían',
			'estarías',
			'estas',
			'este',
			'estemos',
			'esto',
			'estos',
			'estoy',
			'estuve',
			'estuviera',
			'estuvierais',
			'estuvieran',
			'estuvieras',
			'estuvieron',
			'estuviese',
			'estuvieseis',
			'estuviesen',
			'estuvieses',
			'estuvimos',
			'estuviste',
			'estuvisteis',
			'estuviéramos',
			'estuviésemos',
			'estuvo',
			'fue',
			'fuera',
			'fuerais',
			'fueran',
			'fueras',
			'fueron',
			'fuese',
			'fueseis',
			'fuesen',
			'fueses',
			'fui',
			'fuimos',
			'fuiste',
			'fuisteis',
			'fuéramos',
			'fuésemos',
			'ha',
			'habida',
			'habidas',
			'habido',
			'habidos',
			'habiendo',
			'habremos',
			'habrá',
			'habrán',
			'habrás',
			'habré',
			'habréis',
			'habría',
			'habríais',
			'habríamos',
			'habrían',
			'habrías',
			'habéis',
			'había',
			'habíais',
			'habíamos',
			'habían',
			'habías',
			'han',
			'has',
			'hasta',
			'hay',
			'haya',
			'hayamos',
			'hayan',
			'hayas',
			'hayáis',
			'he',
			'hemos',
			'hube',
			'hubiera',
			'hubierais',
			'hubieran',
			'hubieras',
			'hubieron',
			'hubiese',
			'hubieseis',
			'hubiesen',
			'hubieses',
			'hubimos',
			'hubiste',
			'hubisteis',
			'hubiéramos',
			'hubiésemos',
			'hubo',
			'la',
			'las',
			'le',
			'les',
			'lo',
			'los',
			'me',
			'mi',
			'mis',
			'mucho',
			'muchos',
			'muy',
			'más',
			'mí',
			'mía',
			'mías',
			'mío',
			'míos',
			'nada',
			'ni',
			'no',
			'nos',
			'nosotras',
			'nosotros',
			'nuestra',
			'nuestras',
			'nuestro',
			'nuestros',
			'o',
			'os',
			'otra',
			'otras',
			'otro',
			'otros',
			'para',
			'pero',
			'poco',
			'por',
			'porque',
			'que',
			'quien',
			'quienes',
			'qué',
			'se',
			'sea',
			'seamos',
			'sean',
			'seas',
			'seremos',
			'será',
			'serán',
			'serás',
			'seré',
			'seréis',
			'sería',
			'seríais',
			'seríamos',
			'serían',
			'serías',
			'seáis',
			'si',
			'sido',
			'siendo',
			'sin',
			'sobre',
			'sois',
			'somos',
			'son',
			'soy',
			'su',
			'sus',
			'suya',
			'suyas',
			'suyo',
			'suyos',
			'sí',
			'también',
			'tanto',
			'te',
			'tendremos',
			'tendrá',
			'tendrán',
			'tendrás',
			'tendré',
			'tendréis',
			'tendría',
			'tendríais',
			'tendríamos',
			'tendrían',
			'tendrías',
			'tened',
			'tenemos',
			'tenga',
			'tengamos',
			'tengan',
			'tengas',
			'tengo',
			'tengáis',
			'tenida',
			'tenidas',
			'tenido',
			'tenidos',
			'teniendo',
			'tenéis',
			'tenía',
			'teníais',
			'teníamos',
			'tenían',
			'tenías',
			'ti',
			'tiene',
			'tienen',
			'tienes',
			'todo',
			'todos',
			'tu',
			'tus',
			'tuve',
			'tuviera',
			'tuvierais',
			'tuvieran',
			'tuvieras',
			'tuvieron',
			'tuviese',
			'tuvieseis',
			'tuviesen',
			'tuvieses',
			'tuvimos',
			'tuviste',
			'tuvisteis',
			'tuviéramos',
			'tuviésemos',
			'tuvo',
			'tuya',
			'tuyas',
			'tuyo',
			'tuyos',
			'tú',
			'un',
			'una',
			'uno',
			'unos',
			'vosotras',
			'vosotros',
			'vuestra',
			'vuestras',
			'vuestro',
			'vuestros',
			'y',
			'ya',
			'yo',
			'él',
			'éramos',
		]);

		// Normalizar texto y dividir en palabras
		const words = text
			.toLowerCase()
			.replace(/[^\wáéíóúüñ\s]/g, '')
			.split(/\s+/)
			.map((word) => word.trim())
			.filter((word) => word.length > 3 && !stopwords.has(word));

		// Contar frecuencia de palabras
		const wordCounts: Record<string, number> = {};
		for (const word of words) {
			wordCounts[word] = (wordCounts[word] || 0) + 1;
		}

		// Convertir a array y ordenar por frecuencia
		const sortedWords = Object.entries(wordCounts)
			.sort((a, b) => b[1] - a[1])
			.map((entry) => entry[0]);

		// Filtrar palabras que ya existen como tags
		const newTags = sortedWords.filter((word) => !existingTags.includes(word));

		// Tomar las mejores sugerencias
		return newTags.slice(0, maxSuggestions);
	} catch (error) {
		helpersLogger.error('❌ Error al sugerir tags desde texto:', error);
		return [];
	}
}
