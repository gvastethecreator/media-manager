'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type * as React from 'react';
import { useCallback, useState } from 'react';
import { BaseCard } from './entity-card';

interface JsonEntityCardProps {
	entity: any;
	entityType: string;
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Componente que muestra una entidad en formato JSON estilizado
 * Muestra todos los datos de la entidad según el esquema de Prisma
 */
export function JsonEntityCard({
	entity,
	entityType,
	className,
	onClick,
}: JsonEntityCardProps) {
	const [expanded, setExpanded] = useState(false);
	const [copied, setCopied] = useState(false);

	// Simplificar el manejo de eventos
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (onClick) {
				onClick(e);
			}
		},
		[onClick]
	);

	// Función para copiar el JSON al portapapeles
	const copyToClipboard = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			const jsonStr = JSON.stringify(entity, null, 2);
			navigator.clipboard.writeText(jsonStr);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Error al copiar JSON:', error);
		}
	}, [entity]);

	// Función para alternar la expansión
	const toggleExpanded = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(prev => !prev);
	}, []);

	// Formatear la visualización del JSON
	const formattedJson = JSON.stringify(entity, null, 2);

	return (
		<BaseCard
			className={cn('json-entity-card', className)}
			onClick={handleClick}
		>
			<div className="json-entity-card-content flex flex-col h-full overflow-hidden bg-white text-black font-mono text-sm">
				{/* Cabecera con tipo de entidad y botones */}
				<div className="json-entity-card-header p-3 border-b bg-gray-100 flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							onClick={toggleExpanded}
						>
							{expanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
						<h3 className="font-bold text-gray-800">
							{entityType}: {entity.name || entity.id}
						</h3>
					</div>

					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={copyToClipboard}
					>
						{copied ? (
							<Check className="h-4 w-4 text-green-500" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* Contenido JSON */}
				<div
					className={cn(
						"json-entity-card-content p-3 overflow-auto",
						expanded ? "max-h-96" : "max-h-24"
					)}
				>
					<pre className="text-xs whitespace-pre-wrap break-all">
						{formattedJson}
					</pre>
				</div>

				{/* Indicador de más contenido */}
				{!expanded && formattedJson.length > 200 && (
					<div className="text-center text-xs py-1 bg-gray-100 text-gray-500 border-t">
						Click para expandir
					</div>
				)}
			</div>
		</BaseCard>
	);
}