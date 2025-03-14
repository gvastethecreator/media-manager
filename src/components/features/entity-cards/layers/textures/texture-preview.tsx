'use client';

import { Label } from '@/components/ui/label';
import { useId, useMemo } from 'react';
import type { TextureConfig } from '../../types/base-card-types';

interface TexturePreviewProps {
	texture: TextureConfig;
	options?: {
		scale?: number;
		blendMode?: string;
		noiseType?: string;
		animated?: boolean;
		animationSpeed?: number;
		density?: number;
		contrast?: number;
	};
}

export function TexturePreview({ texture, options = {} }: TexturePreviewProps) {
	const { scale = 1, density = 0.5, contrast = 1 } = options;

	const patternId = useId();

	const pattern = useMemo(() => {
		switch (texture.patternType) {
			case 'dots':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<circle cx="5" cy="5" r="1.5" fill={texture.color} />
						<circle cx="15" cy="5" r="1.5" fill={texture.color} />
						<circle cx="5" cy="15" r="1.5" fill={texture.color} />
						<circle cx="15" cy="15" r="1.5" fill={texture.color} />
					</pattern>
				);
			case 'lines':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<line x1="0" y1="10" x2="20" y2="10" stroke={texture.color} strokeWidth="1" />
					</pattern>
				);
			case 'grid':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<line x1="0" y1="10" x2="20" y2="10" stroke={texture.color} strokeWidth="0.5" />
						<line x1="10" y1="0" x2="10" y2="20" stroke={texture.color} strokeWidth="0.5" />
					</pattern>
				);
			case 'diagonal':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<line x1="0" y1="0" x2="20" y2="20" stroke={texture.color} strokeWidth="0.5" />
						<line x1="20" y1="0" x2="0" y2="20" stroke={texture.color} strokeWidth="0.5" />
					</pattern>
				);
			case 'waves':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<path d="M0,10 Q5,5 10,10 T20,10" stroke={texture.color} fill="none" strokeWidth="0.5" />
						<path d="M0,15 Q5,10 10,15 T20,15" stroke={texture.color} fill="none" strokeWidth="0.5" />
						<path d="M0,5 Q5,0 10,5 T20,5" stroke={texture.color} fill="none" strokeWidth="0.5" />
					</pattern>
				);
			case 'hexagons':
				return (
					<pattern
						id={patternId}
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
						patternTransform={`scale(${scale})`}
					>
						<polygon points="10,1 17,5 17,15 10,19 3,15 3,5" fill="none" stroke={texture.color} strokeWidth="0.5" />
					</pattern>
				);
			case 'noise':
				return (
					<filter id={patternId}>
						<feTurbulence type="fractalNoise" baseFrequency={density} numOctaves="3" result="noise" />
						<feColorMatrix
							type="matrix"
							values={`${contrast} 0 0 0 0  0 ${contrast} 0 0 0  0 0 ${contrast} 0 0  0 0 0 1 0`}
							in="noise"
						/>
					</filter>
				);
			default:
				return null;
		}
	}, [texture.patternType, texture.color, scale, density, contrast, patternId]);

	return (
		<div className="mt-2">
			<Label>Vista previa</Label>
			<div
				className="w-full aspect-video rounded-md border mt-1 flex items-center justify-center"
				style={{
					backgroundColor: texture.color,
					opacity: 1,
					backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(patternId)}')`,
					backgroundSize: '20px 20px',
				}}
			>
				{!pattern && !texture.patternType && <div className="text-sm text-muted-foreground">Selecciona un patrón</div>}
			</div>
		</div>
	);
}
