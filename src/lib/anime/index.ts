/**
 * @file Wrapper y exportaciones de anime.js
 * @module lib/anime
 * @description Exportación tipada y configurada de anime.js para el proyecto
 */

// Definir tipos locales para animejs
export interface AnimeInstance {
	play: () => void;
	pause: () => void;
	restart: () => void;
	reverse: () => void;
	seek: (progress: number) => void;
	progress: number;
}

export interface AnimeTimelineInstance extends AnimeInstance {
	add: (params: unknown, offset?: string | number) => AnimeTimelineInstance;
}

export interface AnimeParams extends Record<string, unknown> {
	targets?: string | NodeList | HTMLElement[] | HTMLElement | Record<string, unknown>;
	duration?: number;
	delay?: number | ((el: HTMLElement, i: number) => number);
	easing?: string;
	autoplay?: boolean;
	loop?: boolean | number;
	direction?: 'normal' | 'reverse' | 'alternate';
	update?: (anim: AnimeInstance) => void;
	complete?: (anim: AnimeInstance) => void;
	begin?: (anim: AnimeInstance) => void;
}

// Importar anime dinámicamente para evitar problemas SSR
let animeModule: typeof import('animejs') | null = null;

async function getAnime() {
	if (!animeModule) {
		animeModule = await import('animejs');
	}
	// La nueva versión de animejs exporta diferente
	return (animeModule as any).default || animeModule;
}

/**
 * Crea una animación con animejs
 */
export async function anime(params: AnimeParams): Promise<AnimeInstance> {
	const animeLib = await getAnime();
	return animeLib(params) as AnimeInstance;
}

/**
 * Función animate simplificada (alias de anime)
 */
export async function animate(params: AnimeParams): Promise<AnimeInstance> {
	return anime(params);
}

/**
 * Crea una línea de tiempo de animación
 */
export async function createTimeline(params?: AnimeParams): Promise<AnimeTimelineInstance> {
	const animeLib = await getAnime();
	return animeLib.timeline(params) as AnimeTimelineInstance;
}

/**
 * Anima un conjunto de elementos con stagger
 */
export async function stagger(
	elements: string | NodeList | HTMLElement[],
	params: AnimeParams & { stagger?: number | ((el: HTMLElement, i: number) => number) }
): Promise<AnimeInstance> {
	const animeLib = await getAnime();
	return animeLib({
		targets: elements,
		...params,
	}) as AnimeInstance;
}

/**
 * Utilidad para crear una animación que se puede reproducir/pausar
 */
export async function createControllableAnimation(params: AnimeParams): Promise<{
	play: () => void;
	pause: () => void;
	restart: () => void;
	reverse: () => void;
	seek: (progress: number) => void;
	instance: AnimeInstance;
}> {
	const animeLib = await getAnime();
	const instance = animeLib({
		autoplay: false,
		...params,
	}) as AnimeInstance;

	return {
		play: () => instance.play(),
		pause: () => instance.pause(),
		restart: () => instance.restart(),
		reverse: () => instance.reverse(),
		seek: (progress: number) => instance.seek(progress),
		instance,
	};
}

// Export default para compatibilidad
export { anime as default };
