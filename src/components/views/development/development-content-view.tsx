import { memo } from 'react';

export const DevelopmentContentView = memo(function DevelopmentContentView() {
	return (
		<div className="h-full w-full flex items-center justify-center text-muted-foreground">
			<h2>Vista de Desarrollo en Construcción</h2>
		</div>
	);
});

export default DevelopmentContentView;
