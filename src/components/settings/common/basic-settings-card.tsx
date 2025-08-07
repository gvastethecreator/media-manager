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
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						{icon}
						<span>{title}</span>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-3">
					<div className="flex flex-col gap-4">
						<span className="text-muted-foreground text-xs">{description}</span>
						{children && children}
						{!children && (
							<span className="text-muted-foreground/70 text-xs italic">
								Configuraciones pendientes de implementación
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		</ScrollArea>
	);
}
