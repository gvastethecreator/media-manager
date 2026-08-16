/**
 * @file Wrapper de animación sobre GSAP
 * @module lib/animation
 * @description API de animación respaldada por GSAP para el sistema de transiciones
 */

import gsap from 'gsap';

// ============================================================================
// Tipos de animación
// ============================================================================

export interface AnimationInstance {
	pause: () => void;
	play: () => void;
	progress: number;
	restart: () => void;
	reverse: () => void;
	seek: (progress: number) => void;
}

export interface AnimationTimelineInstance extends AnimationInstance {
	add: (params: unknown, offset?: string | number) => AnimationTimelineInstance;
}

export interface AnimationParams extends Record<string, unknown> {
	autoplay?: boolean;
	begin?: (anim: AnimationInstance) => void;
	complete?: (anim: AnimationInstance) => void;
	delay?: number | ((el: HTMLElement, i: number) => number);
	direction?: 'normal' | 'reverse' | 'alternate';
	duration?: number;
	easing?: string;
	loop?: boolean | number;
	targets?: string | NodeList | HTMLElement[] | HTMLElement | Record<string, unknown>;
	update?: (anim: AnimationInstance) => void;
}

// ============================================================================
// Mapeo de easings legacy → GSAP
// ============================================================================

function mapEasing(easing?: string): string {
	if (!easing) return 'power2.out';
	const map: Record<string, string> = {
		easeInOutCubic: 'power2.inOut',
		easeOutExpo: 'expo.out',
		easeInExpo: 'expo.in',
		easeOutQuad: 'power1.out',
		easeInOutSine: 'sine.inOut',
		easeOutCubic: 'power2.out',
		easeInCubic: 'power2.in',
		linear: 'none',
	};
	return map[easing] ?? easing;
}

// ============================================================================
// Adaptador GSAP Tween → AnimationInstance
// ============================================================================

function wrapTween(tween: gsap.core.Tween): AnimationInstance {
	return {
		pause: () => tween.pause(),
		play: () => tween.play(),
		get progress() {
			return tween.progress() * 100;
		},
		restart: () => tween.restart(),
		reverse: () => tween.reverse(),
		seek: (progress: number) => tween.progress(progress / 100),
	};
}

// ============================================================================
// API pública
// ============================================================================

/**
 * Crea una animación GSAP
 */
export async function animate(params: AnimationParams): Promise<AnimationInstance> {
	const {
		targets,
		duration = 400,
		easing,
		delay = 0,
		begin,
		complete,
		update,
		loop,
		direction,
		autoplay = true,
		...props
	} = params;

	const fromProps: Record<string, unknown> = {};
	const toProps: Record<string, unknown> = {};
	let hasArrayProps = false;

	for (const [key, value] of Object.entries(props)) {
		if (Array.isArray(value) && value.length === 2) {
			fromProps[key] = value[0];
			toProps[key] = value[1];
			hasArrayProps = true;
		} else {
			toProps[key] = value;
		}
	}

	const wrapper = { progress: 0 } as AnimationInstance;

	const gsapVars: gsap.TweenVars = {
		...toProps,
		duration: (duration as number) / 1000,
		ease: mapEasing(easing as string | undefined),
		delay: typeof delay === 'number' ? delay / 1000 : 0,
		paused: !autoplay,
		repeat: loop === true ? -1 : typeof loop === 'number' ? loop - 1 : 0,
		yoyo: direction === 'alternate',
		onStart: () => begin?.(wrapper),
		onComplete: () => complete?.(wrapper),
		onUpdate(this: gsap.core.Tween) {
			wrapper.progress = (this?.progress?.() ?? 0) * 100;
			update?.(wrapper);
		},
	};

	let tween: gsap.core.Tween;

	if (hasArrayProps) {
		tween = gsap.fromTo(targets as gsap.TweenTarget, { ...fromProps }, gsapVars);
	} else {
		tween = gsap.to(targets as gsap.TweenTarget, gsapVars);
	}

	Object.assign(wrapper, wrapTween(tween));
	return wrapper;
}

/**
 * Crea una línea de tiempo GSAP
 */
export async function createTimeline(params?: AnimationParams): Promise<AnimationTimelineInstance> {
	const tl = gsap.timeline({
		paused: params?.autoplay === false,
		repeat: params?.loop === true ? -1 : typeof params?.loop === 'number' ? params.loop - 1 : 0,
		yoyo: params?.direction === 'alternate',
	});

	const instance = wrapTween(tl as unknown as gsap.core.Tween) as AnimationTimelineInstance;
	instance.add = (addParams: unknown, offset?: string | number) => {
		const p = addParams as AnimationParams;
		const { targets, duration = 400, easing, delay = 0, ...rest } = p;
		tl.to(
			targets as gsap.TweenTarget,
			{
				...rest,
				duration: (duration as number) / 1000,
				ease: mapEasing(easing as string | undefined),
				delay: typeof delay === 'number' ? delay / 1000 : 0,
			},
			offset
		);
		return instance;
	};
	return instance;
}

/**
 * Anima un conjunto de elementos con stagger
 */
export async function stagger(
	elements: string | NodeList | HTMLElement[],
	params: AnimationParams & { stagger?: number | ((el: HTMLElement, i: number) => number) }
): Promise<AnimationInstance> {
	const { stagger: staggerVal, duration = 400, easing, delay = 0, ...rest } = params;
	const gsapStagger = typeof staggerVal === 'number' ? staggerVal / 1000 : undefined;
	const tween = gsap.to(elements as gsap.TweenTarget, {
		...rest,
		duration: (duration as number) / 1000,
		ease: mapEasing(easing as string | undefined),
		delay: typeof delay === 'number' ? delay / 1000 : 0,
		stagger: gsapStagger,
	});
	return wrapTween(tween);
}

/**
 * Utilidad para crear una animación que se puede reproducir/pausar
 */
export async function createControllableAnimation(params: AnimationParams): Promise<{
	play: () => void;
	pause: () => void;
	restart: () => void;
	reverse: () => void;
	seek: (progress: number) => void;
	instance: AnimationInstance;
}> {
	const instance = await animate({ ...params, autoplay: false });
	return {
		play: () => instance.play(),
		pause: () => instance.pause(),
		restart: () => instance.restart(),
		reverse: () => instance.reverse(),
		seek: (progress: number) => instance.seek(progress),
		instance,
	};
}

export default animate;
