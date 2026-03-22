import Editor from '@monaco-editor/react';
import { Check, Copy, Download, FileJson } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toastService } from '@/lib/ui/toast';

interface CodeViewerProps {
	file: {
		id: string;
		name: string;
		content?: string;
		url?: string;
		language?: string;
	};
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CodeViewer({ isOpen, onOpenChange, file }: CodeViewerProps) {
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	const [language, setLanguage] = useState('plaintext');

	const loadContent = useCallback(async () => {
		if (!file) return;
		setLoading(true);
		try {
			let content = '';
			if (file.content) content = file.content;
			else if (file.url) {
				const res = await fetch(file.url);
				if (res.ok) content = await res.text();
			}
			setCode(content);

			if (file.language) {
				setLanguage(file.language);
			} else if (file.name.endsWith('.json')) setLanguage('json');
			else if (file.name.endsWith('.js')) setLanguage('javascript');
			else if (file.name.endsWith('.ts')) setLanguage('typescript');
			else if (file.name.endsWith('.md')) setLanguage('markdown');
			else setLanguage('plaintext');
		} catch (error) {
			toastService.error('Error al cargar el archivo');
		} finally {
			setLoading(false);
		}
	}, [file]);

	const handleClose = useCallback(
		(open: boolean) => {
			if (!open) {
				setCode('');
				setLoading(false);
			}
			onOpenChange(open);
		},
		[onOpenChange]
	);

	useEffect(() => {
		if (isOpen) loadContent();
	}, [isOpen, loadContent]);

	const handleDownload = () => {
		const blob = new Blob([code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
		toastService.success('Código copiado');
	};

	return (
		<Dialog onOpenChange={handleClose} open={isOpen}>
			<DialogContent className="flex h-[85vh] max-w-[90vw] flex-col overflow-hidden p-0">
				<DialogHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-3">
					<div className="flex items-center gap-2 truncate">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
							<FileJson className="h-4 w-4 text-blue-500" />
						</div>
						<DialogTitle className="truncate font-medium text-sm">{file.name}</DialogTitle>
					</div>
					<div className="flex items-center gap-2">
						<Button
							className="h-7 gap-1.5 text-xs"
							disabled={loading || !code}
							onClick={handleDownload}
							size="sm"
							variant="outline"
						>
							<Download className="h-3.5 w-3.5" /> Descargar
						</Button>
						<Button
							className="h-7 w-7 p-0"
							disabled={loading || !code}
							onClick={handleCopy}
							size="icon"
							variant="ghost"
						>
							{copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
						</Button>
					</div>
				</DialogHeader>
				<div className="flex-1 overflow-hidden">
					{loading ? (
						<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
							Cargando archivo...
						</div>
					) : (
						<Editor
							height="100%"
							language={language}
							onChange={(value) => setCode(value || '')}
							options={{ readOnly: true, minimap: { enabled: true }, fontSize: 12, lineNumbers: 'on' }}
							theme="vs-dark"
							value={code}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
