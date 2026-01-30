import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface BasicSettingsProps {
	/**
	 * Título de la sección de configuración
	 */
	title: string;

	/**
	 * Descripción de la funcionalidad
	 */
	description: string;

	/**
	 * Icono opcional para mostrar junto al título
	 */
	icon?: ReactNode;

	/**
	 * Contenido personalizado adicional si se necesita
	 */
	children?: ReactNode;
}

/**
 * Componente base para configuraciones simples que solo muestran un placeholder
 * Evita duplicar código en settings que aún no tienen funcionalidad implementada
 */
export function BasicSettingsCard({ title, description, icon, children }: BasicSettingsProps) {
	return (
		<ScrollArea className="h-[calc(100vh-8rem)] w-full">
			<Card className="rounded-dt-md border-none bg-muted/30 shadow-sm">
				<CardHeader className="space-y-0 p-3 pb-2">
					<CardTitle className="flex items-center gap-2 text-heading-sm text-muted-foreground">
						{icon}
						<span>{title}</span>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="space-y-stack-sm p-4">
					<p className="text-body-sm text-muted-foreground">{description}</p>
					{children && children}
					{!children && (
						<p className="text-caption text-muted-foreground/60 italic">Configuraciones pendientes de implementación</p>
					)}
				</CardContent>
			</Card>
		</ScrollArea>
	);
}
