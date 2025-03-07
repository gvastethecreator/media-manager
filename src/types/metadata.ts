export interface AIMetadata {
	type: 'stable-diffusion' | 'comfyui' | 'invoke-ai' | 'novel-ai';
	prompt?: string;
	negative_prompt?: string;
	model?: string;
	steps?: number;
	cfg_scale?: number;
	cfg?: number;
	seed?: number;
	sampler?: string;
	scheduler?: string;
	clip_skip?: number;
	workflow?: string;
	raw?: string;
	extra_params?: Record<string, string | number | boolean | null | undefined>;
}

export interface FileMetadata {
	dimensions?: {
		width: number;
		height: number;
	};
	fileSystem?: {
		created: string;
		modified: string;
		size: number;
	};
	mimeType?: string;
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;
	exif?: {
		make?: string;
		model?: string;
		software?: string;
		dateTime?: string;
		exposureTime?: number;
		fNumber?: number;
		iso?: number;
		focalLength?: number;
		lens?: string;
		copyright?: string;
		artist?: string;
		description?: string;
		gps?: {
			latitude: number;
			longitude: number;
			altitude?: number;
		};
	};
	xmp?: {
		title?: string;
		creator?: string;
		rights?: string;
		subject?: string[];
		rating?: number;
	};
	iptc?: {
		headline?: string;
		caption?: string;
		keywords?: string[];
		copyright?: string;
		source?: string;
	};
	generation?: AIMetadata;
}
