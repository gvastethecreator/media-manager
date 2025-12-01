import { Copy, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/lib/logger/client-logger';

export interface JsonViewerProps {
	/**
	 * Contenido JSON como string
	 */
	content: string;
	/**
	 * Altura máxima del viewer en píxeles
	 * @default 300
	 */
	maxHeight?: number;
	/**
	 * Si debe estar expandido por defecto
	 * @default false
	 */
	defaultExpanded?: boolean;
	/**
	 * Clases CSS adicionales
	 */
	className?: string;
	/**
	 * Si debe mostrar syntax highlighting
	 * @default true
	 */
	enableSyntaxHighlight?: boolean;
	/**
	 * Límite de líneas antes de mostrar scroll
	 * @default 15
	 */
	maxLines?: number;
}

/**
 * Componente para mostrar contenido JSON con formato, scroll y controles
 */
export const JsonViewer: React.FC<JsonViewerProps> = ({
	content,
	maxHeight = 300,
	defaultExpanded = false,
	className,
	enableSyntaxHighlight = true,
	maxLines = 15,
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const [copied, setCopied] = useState(false);

	// Intentar formatear el JSON si es válido
	const formattedContent = React.useMemo(() => {
		try {
			const parsed = JSON.parse(content);
			return JSON.stringify(parsed, null, 2);
		} catch {
			// Si no es JSON válido, devolver el contenido original
			return content;
		}
	}, [content]);

	// Determinar si necesita scroll basado en líneas
	const lines = formattedContent.split('\n');
	const needsScroll = lines.length > maxLines;

	// Contenido a mostrar (colapsado o expandido)
	const displayContent = expanded || !needsScroll ? formattedContent : `${lines.slice(0, maxLines).join('\n')}\n...`;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(formattedContent);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			clientLogger.error('Error copying to clipboard:', error);
		}
	};

	// Función para aplicar syntax highlighting básico con componentes seguros
	const renderHighlightedContent = (text: string) => {
		if (!enableSyntaxHighlight) {
			return <pre className="whitespace-pre-wrap break-words">{text}</pre>;
		}

		// Para evitar dangerouslySetInnerHTML, usamos un componente simple sin highlighting avanzado
		// Se puede mejorar con una librería como react-syntax-highlighter si se necesita
		return <pre className="whitespace-pre-wrap break-words text-green-600 dark:text-green-400">{text}</pre>;
	};

	return (
		<div className={cn('w-full', className)}>
			{/* Header con controles */}
			<div className="mb-2 flex items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					{needsScroll && (
						<Button className="h-6 px-2 text-xs" onClick={() => setExpanded(!expanded)} size="sm" variant="ghost">
							{expanded ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
							{expanded ? 'Colapsar' : 'Expandir'}
						</Button>
					)}
				</div>

				<Button className="h-6 px-2 text-xs" onClick={handleCopy} size="sm" variant="ghost">
					<Copy className="mr-1 h-3 w-3" />
					{copied ? 'Copiado!' : 'Copiar'}
				</Button>
			</div>

			{/* Contenedor del JSON */}
			<div
				className={cn(
					'relative overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs',
					expanded && needsScroll && 'scrollbar-thin scrollbar-thumb-border'
				)}
				style={{
					maxHeight: expanded || !needsScroll ? maxHeight : 'auto',
				}}
			>
				{renderHighlightedContent(displayContent)}

				{/* Indicador de contenido truncado */}
				{!expanded && needsScroll && (
					<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t from-muted/30 to-transparent" />
				)}
			</div>

			{/* Info adicional */}
			<div className="mt-1 text-muted-foreground text-xs">
				{lines.length} líneas • {formattedContent.length} caracteres
			</div>
		</div>
	);
};

export default JsonViewer;
