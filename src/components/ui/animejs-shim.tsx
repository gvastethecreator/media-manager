'use client';

import { animate, type JSAnimation, set } from 'animejs';
import type { JSX } from 'react';
import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

// Types for motion compatibility
type EasingType = 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | string;
type AnimationVariantType = 'spring' | 'tween' | 'inertia' | 'decay' | 'keyframes';

interface TransitionConfig {
	duration?: number;
	ease?: string | EasingType;
	delay?: number;
	type?: AnimationVariantType;
	stiffness?: number;
	damping?: number;
	mass?: number;
	staggerChildren?: number;
}

// Variants support
interface AnimationVariants {
	[key: string]: AnimationState;
}

// Context for AnimatePresence
interface AnimatePresenceContextType {
	mode?: 'wait' | 'sync';
	onExitComplete?: () => void;
}

const AnimatePresenceContext = createContext<AnimatePresenceContextType>({});

interface AnimationState {
	opacity?: number;
	x?: number;
	y?: number;
	scale?: number;
	rotation?: number;
	rotateX?: number;
	rotateY?: number;
	rotateZ?: number;
	filter?: string;
	transition?: TransitionConfig;
	// Support for variants
	[key: string]: any;
}

interface MotionProps {
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onMouseMove?: (event: React.MouseEvent) => void;
	onBlur?: () => void;
	onFocus?: () => void;
	// Animation props
	initial?: AnimationState | false | string;
	animate?: AnimationState | string;
	exit?: AnimationState | string;
	whileHover?: AnimationState;
	whileTap?: AnimationState;
	transition?: TransitionConfig;
	layout?: boolean;
	layoutId?: string;
	// Variants support
	variants?: AnimationVariants;
	// Drag props for compatibility
	drag?: boolean | 'x' | 'y';
	dragConstraints?: object;
	onDrag?: (event: any, info: any) => void;
	onDragStart?: (event: any, info: any) => void;
	onDragEnd?: (event: any, info: any) => void;
	onWheel?: (event: any) => void;
}

// Helper function to resolve variant or direct animation state
function resolveAnimation(
	variants: AnimationVariants | undefined,
	animation: AnimationState | string | false | undefined,
	fallback: AnimationState = {}
): AnimationState | null {
	if (animation === false) return null;
	if (typeof animation === 'string' && variants) {
		return variants[animation] || fallback;
	}
	if (typeof animation === 'object') {
		return animation;
	}
	return fallback;
}

// Map common GSAP/Framer easings to Anime.js
function mapEasing(ease?: string): string {
	if (!ease) return 'easeOutQuad';
	const map: Record<string, string> = {
		'power1.in': 'easeInQuad',
		'power1.out': 'easeOutQuad',
		'power1.inOut': 'easeInOutQuad',
		'power2.in': 'easeInQuad', // Anime uses Quad/Cubic etc
		'power2.out': 'easeOutQuad',
		'power2.inOut': 'easeInOutQuad',
		'power3.in': 'easeInCubic',
		'power3.out': 'easeOutCubic',
		'power3.inOut': 'easeInOutCubic',
		'back.in': 'easeInBack',
		'back.out': 'easeOutBack',
		'back.inOut': 'easeInOutBack',
		linear: 'linear',
	};
	return map[ease] || ease;
}

// Helper to remove undefined keys
function cleanProps(props: Record<string, any>) {
	const clean: Record<string, any> = {};
	Object.keys(props).forEach((key) => {
		if (props[key] !== undefined) {
			clean[key] = props[key];
		}
	});
	return clean;
}

// Map properties to Anime.js format
function mapProperties(props: AnimationState) {
	const { x, y, rotation, rotateX, rotateY, rotateZ, transition, ...rest } = props;
	return cleanProps({
		...rest,
		translateX: x,
		translateY: y,
		rotate: rotation,
		rotateX,
		rotateY,
		rotateZ,
	});
}

// Enhanced motion component factory with variants support
function createMotionComponent(tag: keyof JSX.IntrinsicElements) {
	return function MotionComponent(props: MotionProps & React.HTMLAttributes<HTMLElement>) {
		const {
			children,
			initial = { opacity: 0 },
			animate: animateProp = { opacity: 1 },
			exit,
			whileHover,
			whileTap,
			transition = { duration: 0.3 },
			variants,
			className,
			style,
			onClick,
			onMouseEnter,
			onMouseLeave,
			onMouseMove,
			onBlur,
			onFocus,
			layout,
			layoutId,
			drag,
			dragConstraints,
			onDrag,
			onDragStart,
			onDragEnd,
			onWheel,
			...restProps
		} = props;

		const elementRef = useRef<HTMLElement>(null);
		const presenceContext = useContext(AnimatePresenceContext);
		const activeAnimationRef = useRef<JSAnimation | null>(null);

		// Resolve animations using variants
		const resolvedInitial = resolveAnimation(variants, initial);
		const resolvedAnimate = resolveAnimation(variants, animateProp, { opacity: 1 });
		const resolvedExit = resolveAnimation(variants, exit);

		useEffect(() => {
			if (!elementRef.current) return;

			// Set initial state
			if (resolvedInitial) {
				const initialProps = mapProperties(resolvedInitial);
				if (Object.keys(initialProps).length > 0) {
					set(elementRef.current, initialProps);
				}
			}
		}, [resolvedInitial]); // Run once on mount

		// Animate to target state
		useEffect(() => {
			if (!(elementRef.current && resolvedAnimate)) return;

			const targetProps = mapProperties(resolvedAnimate);
			if (Object.keys(targetProps).length === 0) return;

			const animProps = {
				...targetProps,
				duration: (transition.duration || 0.3) * 1000, // Anime.js uses ms
				easing: mapEasing(transition.ease as string),
				delay: (transition.delay || 0) * 1000,
			};

			activeAnimationRef.current = animate(elementRef.current, animProps);

			return () => {
				// Optional: cleanup
			};
		}, [resolvedAnimate, transition]);

		// Handle exit animation
		useEffect(() => {
			if (resolvedExit && elementRef.current && presenceContext.mode === 'wait') {
				const targetProps = mapProperties(resolvedExit);
				if (Object.keys(targetProps).length === 0) return;

				const animProps = {
					...targetProps,
					duration: (transition.duration || 0.2) * 1000,
					easing: mapEasing(transition.ease as string),
					complete: () => {
						presenceContext.onExitComplete?.();
					},
				};

				const exitAnim = animate(elementRef.current, animProps);
				return () => {
					exitAnim.pause();
				};
			}
		}, [resolvedExit, presenceContext, transition]);

		// Handle hover animations
		const isHoverAnimatingRef = useRef(false);

		const handleMouseEnter = () => {
			if (whileHover && elementRef.current) {
				isHoverAnimatingRef.current = true;
				activeAnimationRef.current?.pause();

				const hoverProps = mapProperties(whileHover);
				if (Object.keys(hoverProps).length > 0) {
					animate(elementRef.current, {
						...hoverProps,
						duration: 150,
						easing: 'easeOutQuad',
						complete: () => {
							isHoverAnimatingRef.current = false;
						},
					});
				}
			}
			onMouseEnter?.();
		};

		const handleMouseLeave = () => {
			if (whileHover && elementRef.current && resolvedAnimate) {
				isHoverAnimatingRef.current = true;
				// Return to animate state
				const targetProps = mapProperties(resolvedAnimate);
				if (Object.keys(targetProps).length > 0) {
					animate(elementRef.current, {
						...targetProps,
						duration: 150,
						easing: 'easeOutQuad',
						complete: () => {
							isHoverAnimatingRef.current = false;
						},
					});
				}
			}
			onMouseLeave?.();
		};

		const handleClick = () => {
			if (whileTap && elementRef.current) {
				const tapProps = mapProperties(whileTap);
				if (Object.keys(tapProps).length > 0) {
					animate(elementRef.current, {
						...tapProps,
						duration: 80,
						easing: 'easeOutQuad',
						direction: 'alternate', // Simulate yoyo
					});
				}
			}
			onClick?.();
		};

		const Component = tag as any;

		return (
			<Component
				className={className}
				onBlur={onBlur}
				onClick={handleClick}
				onFocus={onFocus}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseMove={onMouseMove}
				onWheel={onWheel}
				ref={elementRef}
				style={style}
				{...restProps}
			>
				{children}
			</Component>
		);
	};
}

// Motion components
export const motion = {
	div: createMotionComponent('div'),
	button: createMotionComponent('button'),
	span: createMotionComponent('span'),
	img: createMotionComponent('img'),
	section: createMotionComponent('section'),
	article: createMotionComponent('article'),
	header: createMotionComponent('header'),
	footer: createMotionComponent('footer'),
	nav: createMotionComponent('nav'),
	main: createMotionComponent('main'),
	aside: createMotionComponent('aside'),
	h1: createMotionComponent('h1'),
	h2: createMotionComponent('h2'),
	h3: createMotionComponent('h3'),
	h4: createMotionComponent('h4'),
	h5: createMotionComponent('h5'),
	h6: createMotionComponent('h6'),
	p: createMotionComponent('p'),
	ul: createMotionComponent('ul'),
	ol: createMotionComponent('ol'),
	li: createMotionComponent('li'),
	form: createMotionComponent('form'),
	input: createMotionComponent('input'),
	textarea: createMotionComponent('textarea'),
	select: createMotionComponent('select'),
	label: createMotionComponent('label'),
	video: createMotionComponent('video'),
	canvas: createMotionComponent('canvas'),
	svg: createMotionComponent('svg'),
	path: createMotionComponent('path'),
};

// Enhanced AnimatePresence component
interface AnimatePresenceProps {
	children: ReactNode;
	mode?: 'wait' | 'sync';
	onExitComplete?: () => void;
}

export function AnimatePresence({ children, mode = 'sync', onExitComplete }: AnimatePresenceProps) {
	const contextValue = { mode, onExitComplete };

	return <AnimatePresenceContext.Provider value={contextValue}>{children}</AnimatePresenceContext.Provider>;
}

// Enhanced hook replacements
export function useMotionValue(initialValue: number) {
	const [value, setValue] = useState(initialValue);
	return {
		get: () => value,
		set: setValue,
		current: value,
	};
}

export function useSpring(source: any) {
	const [value, setValue] = useState(source?.current || source || 0);

	useEffect(() => {
		if (source?.current !== undefined) {
			setValue(source.current);
		} else if (typeof source === 'number') {
			setValue(source);
		}
	}, [source]);

	return value;
}

export function useTransform(source: any, inputRange: number[], outputRange: number[]) {
	const [value, setValue] = useState(outputRange[0] || 0);

	useEffect(() => {
		const currentValue = source?.current || source || 0;
		if (inputRange.length === 2 && outputRange.length === 2) {
			const progress = (currentValue - inputRange[0]) / (inputRange[1] - inputRange[0]);
			const clampedProgress = Math.max(0, Math.min(1, progress));
			const result = outputRange[0] + (outputRange[1] - outputRange[0]) * clampedProgress;
			setValue(result);
		}
	}, [source, inputRange, outputRange]);

	return value;
}

// Easing constants
export const Easing = {
	easeIn: 'easeInQuad',
	easeOut: 'easeOutQuad',
	easeInOut: 'easeInOutQuad',
	linear: 'linear',
} as const;

// Export types
export type { AnimationVariantType, AnimationVariants, AnimationState, MotionProps };
