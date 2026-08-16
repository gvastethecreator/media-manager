import React from 'react';
import { cn } from '@/lib/utils';

interface JSONSyntaxHighlighterProps {
	className?: string;
	content: string;
	maxHeight?: string;
	showLineNumbers?: boolean;
}

/**
 * Aplica syntax highlighting básico a contenido JSON
 */
const highlightJSON = (jsonString: string): React.ReactNode => {
	// Escapar HTML para evitar XSS
	const escapeHtml = (text: string): string => {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	};

	// Tokenizar el JSON para highlighting
	const tokens: Array<{ type: string; value: string }> = [];
	let i = 0;

	while (i < jsonString.length) {
		const char = jsonString[i];

		// Espacios en blanco
		if (/\s/.test(char)) {
			const start = i;
			while (i < jsonString.length && /\s/.test(jsonString[i])) {
				i++;
			}
			tokens.push({ type: 'whitespace', value: jsonString.slice(start, i) });
			continue;
		}

		// Strings
		if (char === '"') {
			const start = i;
			i++; // Skip opening quote
			while (i < jsonString.length && jsonString[i] !== '"') {
				if (jsonString[i] === '\\') i++; // Skip escaped character
				i++;
			}
			i++; // Skip closing quote
			tokens.push({ type: 'string', value: jsonString.slice(start, i) });
			continue;
		}

		// Numbers
		if (/\d/.test(char) || (char === '-' && /\d/.test(jsonString[i + 1] || ''))) {
			const start = i;
			if (char === '-') i++;
			while (i < jsonString.length && /[\d.eE+-]/.test(jsonString[i])) {
				i++;
			}
			tokens.push({ type: 'number', value: jsonString.slice(start, i) });
			continue;
		}

		// Booleans and null
		if (char === 't' && jsonString.slice(i, i + 4) === 'true') {
			tokens.push({ type: 'boolean', value: 'true' });
			i += 4;
			continue;
		}
		if (char === 'f' && jsonString.slice(i, i + 5) === 'false') {
			tokens.push({ type: 'boolean', value: 'false' });
			i += 5;
			continue;
		}
		if (char === 'n' && jsonString.slice(i, i + 4) === 'null') {
			tokens.push({ type: 'null', value: 'null' });
			i += 4;
			continue;
		}

		// Punctuation
		if ('{}[]:,'.includes(char)) {
			tokens.push({ type: 'punctuation', value: char });
			i++;
			continue;
		}

		// Default: otros caracteres
		tokens.push({ type: 'default', value: char });
		i++;
	}

	// Convertir tokens a JSX con colores
	return tokens.map((token, index) => {
		let className = '';
		switch (token.type) {
			case 'string':
				className = 'text-[color:var(--status-success)]';
				break;
			case 'number':
				className = 'text-[color:var(--status-info)]';
				break;
			case 'boolean':
				className = 'text-[color:var(--status-warning)]';
				break;
			case 'null':
				className = 'text-destructive';
				break;
			case 'punctuation':
				className = 'text-muted-foreground';
				break;
			default:
				className = 'text-foreground';
		}

		return (
			<span className={className} key={index}>
				{token.value}
			</span>
		);
	});
};

export const JSONSyntaxHighlighter: React.FC<JSONSyntaxHighlighterProps> = ({
	content,
	className,
	maxHeight = '400px',
	showLineNumbers = false,
}) => {
	// Validar que el contenido sea JSON válido
	let formattedContent = content;
	try {
		const parsed = JSON.parse(content);
		formattedContent = JSON.stringify(parsed, null, 2);
	} catch {
		// Si no es JSON válido, usar el contenido original
		formattedContent = content;
	}

	const lines = formattedContent.split('\n');
	const highlightedContent = highlightJSON(formattedContent);

	return (
		<div
			className={cn('relative w-full overflow-auto rounded-md border border-border/60 bg-muted/40', className)}
			style={{ maxHeight }}
		>
			<div className="relative">
				<pre className="p-4 text-sm leading-relaxed">
					{showLineNumbers && (
						<div className="absolute top-0 left-0 w-12 bg-muted/60 p-4 text-right">
							{lines.map((_, index) => (
								<div className="text-muted-foreground" key={index}>
									{index + 1}
								</div>
							))}
						</div>
					)}
					<code className={cn('font-mono', showLineNumbers && 'ml-12')}>{highlightedContent}</code>
				</pre>
			</div>
		</div>
	);
};

/**
 * Componente colapsible para JSON grande
 */
interface CollapsibleJSONProps {
	className?: string;
	collapsedHeight?: string;
	content: string;
	defaultExpanded?: boolean;
	maxHeight?: string;
	showLineNumbers?: boolean;
}

export const CollapsibleJSON: React.FC<CollapsibleJSONProps> = ({
	content,
	maxHeight = '600px',
	collapsedHeight = '200px',
	className,
	defaultExpanded = false,
	showLineNumbers = false,
}) => {
	const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

	// Determinar si necesita ser colapsible
	const lines = content.split('\n');
	const needsCollapse = lines.length > 15 || content.length > 2000;

	if (!needsCollapse) {
		return (
			<JSONSyntaxHighlighter
				className={className}
				content={content}
				maxHeight={maxHeight}
				showLineNumbers={showLineNumbers}
			/>
		);
	}

	return (
		<div className={cn('relative', className)}>
			<JSONSyntaxHighlighter
				content={content}
				maxHeight={isExpanded ? maxHeight : collapsedHeight}
				showLineNumbers={showLineNumbers}
			/>

			{/* Overlay gradient cuando está colapsado */}
			{!isExpanded && (
				<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-muted/60 to-transparent" />
			)}

			{/* Botón para expandir/colapsar */}
			<div className="mt-2 flex justify-center">
				<button
					className="rounded-md bg-primary/10 px-3 py-1 text-primary text-sm hover:bg-primary/20"
					onClick={() => setIsExpanded(!isExpanded)}
					type="button"
				>
					{isExpanded ? (
						<>
							<span className="mr-1">↑</span>
							Colapsar JSON ({lines.length} lines)
						</>
					) : (
						<>
							<span className="mr-1">↓</span>
							Expandir JSON ({lines.length} lines)
						</>
					)}
				</button>
			</div>
		</div>
	);
};
