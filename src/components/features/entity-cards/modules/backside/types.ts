// Tipo para las opciones de backside
export interface BacksideOptions {
	enabled: boolean;
	layoutType?: string;
	colorMode?: string;
	customColor?: string;
	opacity?: number;
	blurBackground?: boolean;
	blurAmount?: number;
	showAttributes?: boolean;
	showDescription?: boolean;
	showStats?: boolean;
	showMetadata?: boolean;
	showRelations?: boolean;
	maxDescriptionLength?: number;
	flipAnimation?: string;
	flipDuration?: number;
	enableAutoFlip?: boolean;
	autoFlipDelay?: number;
	flipTrigger?: string;
	headingStyle?: string;
	infoStyle?: string;
	separatorStyle?: string;
}

// Tipos para la integración con el sistema de cartas
export interface BacksideSystemProps {
	options: {
		backside?: BacksideOptions;
	};
	onChange: (options: { backside?: BacksideOptions }) => void;
	disabled?: boolean;
}
