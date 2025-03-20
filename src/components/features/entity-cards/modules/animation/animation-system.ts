export interface AnimationOptions {
	enabled?: boolean;
	hoverEffect?: boolean;
	clickEffect?: boolean;
	entranceAnimation?: EntranceAnimation;
	exitAnimation?: ExitAnimation;
	transitionDuration?: number;
	timingFunction?: string;
	hoverScale?: number;
	hoverRotation?: boolean;
	liftHeight?: number;
	maxRotation?: number;
	disableAnimations?: boolean;
}