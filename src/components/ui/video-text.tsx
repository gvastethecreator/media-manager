'use client';

import * as React from 'react';
import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface VideoTextProps {
	/**
	 * The video source URL or array of sources for multiple formats
	 */
	src: string | string[];
	/**
	 * The content to display (will have the video "inside" it)
	 */
	children: ReactNode;
	/**
	 * Additional className for the container
	 */
	className?: string;
	/**
	 * Whether to autoplay the video
	 * @default true
	 */
	autoPlay?: boolean;
	/**
	 * Whether to mute the video
	 * @default true
	 */
	muted?: boolean;
	/**
	 * Whether to loop the video
	 * @default true
	 */
	loop?: boolean;
	/**
	 * Whether to preload the video
	 * @default "auto"
	 */
	preload?: 'auto' | 'metadata' | 'none';
	/**
	 * Font size for the text mask (in viewport width units or CSS units)
	 * @default "20vw"
	 */
	fontSize?: string | number;
	/**
	 * Font weight for the text mask
	 * @default "bold"
	 */
	fontWeight?: string | number;
	/**
	 * Callback when video starts playing
	 */
	onPlay?: () => void;
	/**
	 * Callback when video is paused
	 */
	onPause?: () => void;
	/**
	 * Callback when video ends
	 */
	onEnded?: () => void;
}

/**
 * VideoText displays content with a background video fill effect.
 * The video is masked by the content, creating a dynamic animated text look.
 */
export function VideoText({
	src,
	children,
	className = '',
	autoPlay = true,
	muted = true,
	loop = true,
	preload = 'auto',
	fontSize = '20vw',
	fontWeight = 'bold',
	onPlay,
	onPause,
	onEnded,
}: VideoTextProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const video = videoRef.current;
		if (!(canvas && video)) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationId: number;

		const updateCanvas = () => {
			if (video.paused || video.ended) return;

			// Set canvas size to match video
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 360;

			// Draw video frame
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

			animationId = requestAnimationFrame(updateCanvas);
		};

		const handleVideoLoad = () => {
			updateCanvas();
		};

		const handleResize = () => {
			if (containerRef.current && video.videoWidth) {
				const rect = containerRef.current.getBoundingClientRect();
				// Scale canvas to fit container while maintaining aspect ratio
				const scale = Math.min(rect.width / video.videoWidth, rect.height / video.videoHeight);
				canvas.style.width = `${video.videoWidth * scale}px`;
				canvas.style.height = `${video.videoHeight * scale}px`;
			}
		};

		video.addEventListener('loadeddata', handleVideoLoad);
		video.addEventListener('play', updateCanvas);
		window.addEventListener('resize', handleResize);

		return () => {
			video.removeEventListener('loadeddata', handleVideoLoad);
			video.removeEventListener('play', updateCanvas);
			window.removeEventListener('resize', handleResize);
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	}, []);

	const sources = Array.isArray(src) ? src : [src];
	const content = React.Children.toArray(children).join('');

	return (
		<div className={cn('relative inline-block overflow-hidden', className)} ref={containerRef}>
			{/* Hidden video element */}
			<video
				autoPlay={autoPlay}
				className="pointer-events-none absolute opacity-0"
				crossOrigin="anonymous"
				loop={loop}
				muted={muted}
				onEnded={onEnded}
				onPause={onPause}
				onPlay={onPlay}
				playsInline
				preload={preload}
				ref={videoRef}
			>
				{sources.map((source, index) => (
					<source key={index} src={source} />
				))}
				Your browser does not support the video tag.
			</video>

			{/* Canvas that shows the masked video */}
			<canvas
				className="block"
				ref={canvasRef}
				style={{
					width: '100%',
					height: 'auto',
				}}
			/>

			{/* Text overlay with mix-blend-mode to create mask effect */}
			<div
				className="pointer-events-none absolute inset-0 flex items-center justify-center"
				style={{
					fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
					fontWeight,
					fontFamily: 'system-ui, -apple-system, sans-serif',
					color: 'black',
					background: 'white',
					mixBlendMode: 'screen',
				}}
			>
				<span className="whitespace-nowrap">{content}</span>
			</div>
		</div>
	);
}
