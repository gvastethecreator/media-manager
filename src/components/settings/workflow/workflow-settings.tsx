// Settings para Workflow
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function WorkflowSettings() {
	return (
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
					<span>Workflows</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-3">
				<div className="flex flex-col gap-4">
					<span className="text-xs text-muted-foreground">
						Configuraciones y gestión de archivos de workflow (JSON).
					</span>
					{/* Aquí irán controles y opciones específicas */}
				</div>
			</CardContent>
		</Card>
	);
}
