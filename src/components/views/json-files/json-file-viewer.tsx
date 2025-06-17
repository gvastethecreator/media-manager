// Visor avanzado para archivos JSON
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

/**
 * Componente visor de JSON con tres modos:
 * - Formateado (raw)
 * - Objeto (árbol)
 * - Diagrama (mermaid)
 */
export function JsonFileViewer({ json, name }: { json: any; name: string }) {
	const [tab, setTab] = useState<'raw' | 'tree' | 'diagram'>('raw');

	// Generar diagrama mermaid básico (solo ejemplo)
	const getMermaid = (obj: any) => {
		// Solo soporta objetos simples para demo
		if (!obj || typeof obj !== 'object') return 'graph TD\nA[Empty]';
		let out = 'graph TD\n';
		Object.entries(obj).forEach(([k, v], i) => {
			out += `A --> B${i}[${k}: ${typeof v}]\n`;
		});
		return out;
	};

	// Copiar al portapapeles
	const handleCopy = (mode: 'raw' | 'tree') => {
		let text = '';
		if (mode === 'raw') text = JSON.stringify(json, null, 2);
		if (mode === 'tree') text = JSON.stringify(json);
		navigator.clipboard.writeText(text);
	};

	const handleTabChange = (value: string) => {
		if (value === 'raw' || value === 'tree' || value === 'diagram') setTab(value);
	};

	return (
		<Card className="p-4 w-full max-w-2xl mx-auto mt-6">
			<h2 className="font-bold mb-2">{name}</h2>
			<Tabs value={tab} onValueChange={handleTabChange} className="w-full">
				<TabsList>
					<TabsTrigger value="raw">Formateado</TabsTrigger>
					<TabsTrigger value="tree">Objeto</TabsTrigger>
					<TabsTrigger value="diagram">Diagrama</TabsTrigger>
				</TabsList>
				<TabsContent value="raw">
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-muted-foreground">JSON formateado</span>
						<Button size="sm" variant="outline" onClick={() => handleCopy('raw')}>Copiar</Button>
					</div>
					<pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-96">
						{JSON.stringify(json, null, 2)}
					</pre>
				</TabsContent>
				<TabsContent value="tree">
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-muted-foreground">Vista objeto</span>
						<Button size="sm" variant="outline" onClick={() => handleCopy('tree')}>Copiar</Button>
					</div>
					<div className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-96">
						<JsonView data={json} />
					</div>
				</TabsContent>
				<TabsContent value="diagram">
					<div className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-96">
						{/* Aquí se podría renderizar mermaid con un componente real */}
						<pre>{getMermaid(json)}</pre>
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}

/**
 * 📝 Documentación:
 * - Permite visualizar JSON en modo formateado, árbol y diagrama (mermaid).
 * - Extensible para edición y renderizado real de mermaid.
 */
