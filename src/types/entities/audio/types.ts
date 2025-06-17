// Tipos canónicos para Audio
export interface Audio {
	id: string;
	name: string;
	filePath: string;
	format: string;
	duration?: number;
	size: number;
	createdAt: string;
	updatedAt: string;
}
