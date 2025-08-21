'use client';

import { Slider as SliderPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Slider({ className, children, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={cn('relative flex h-4 w-full touch-none select-none items-center', className)}
			data-slot="slider"
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-accent">
				<SliderPrimitive.Range className="absolute h-full bg-primary" />
			</SliderPrimitive.Track>
			{children}
		</SliderPrimitive.Root>
	);
}

function SliderThumb({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Thumb>) {
	return (
		<SliderPrimitive.Thumb
			className={cn(
				'box-content block size-4 shrink-0 cursor-pointer rounded-full border-[2px] border-primary bg-primary-foreground shadow-black/5 shadow-xs outline-hidden focus:outline-hidden',
				className
			)}
			data-slot="slider-thumb"
			{...props}
		/>
	);
}

export { Slider, SliderThumb };
