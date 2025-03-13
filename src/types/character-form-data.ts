export interface CharacterFormData {
	/**
	 * Nombre del personaje
	 */
	name: string;

	/**
	 * Descripción corta del personaje
	 */
	description?: string;

	/**
	 * Emoji que representa al personaje
	 */
	emoji: string;

	/**
	 * Color principal del personaje en formato hexadecimal
	 */
	color: string;

	/**
	 * Nivel del personaje (1-20)
	 */
	level: number;

	/**
	 * Clase del personaje (Guerrero, Mago, etc.)
	 */
	class: string;

	/**
	 * Raza del personaje (Humano, Elfo, etc.)
	 */
	race: string;

	/**
	 * Alineamiento del personaje
	 */
	alignment: string;

	/**
	 * Historia de fondo del personaje
	 */
	backstory: string;

	/**
	 * Estadísticas en formato JSON
	 */
	stats: string;

	/**
	 * Campo por el cual ordenar
	 */
	sortBy: string;

	/**
	 * Filtros en formato JSON
	 */
	filters: string;

	/**
	 * Perfil psicológico del personaje
	 */
	psychologicalProfile: string;

	/**
	 * Perfil social del personaje
	 */
	socialProfile: string;

	/**
	 * Relaciones del personaje en formato JSON
	 */
	relationships: string;

	/**
	 * Objetivos del personaje en formato JSON
	 */
	goals: string;

	/**
	 * Miedos del personaje en formato JSON
	 */
	fears: string;

	/**
	 * Creencias del personaje en formato JSON
	 */
	beliefs: string;

	/**
	 * Rasgos de personalidad en formato JSON
	 */
	personality: string;

	/**
	 * Imagen destacada del personaje
	 */
	featuredImage: string | null;

	/**
	 * Indica si el personaje es favorito
	 */
	isFavorite: boolean;
}
