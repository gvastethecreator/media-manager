'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ReactNode } from 'react';

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
		<Card className="bg-muted/30 rounded-sm border-none">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
					{icon}
					<span>{title}</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-3">
				<div className="flex flex-col gap-4">
					<span className="text-xs text-muted-foreground">{description}</span>
					{children && children}
					{!children && (
						<span className="text-xs text-muted-foreground/70 italic">
							Configuraciones pendientes de implementación
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
