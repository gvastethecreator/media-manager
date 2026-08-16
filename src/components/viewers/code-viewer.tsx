import { Check, Copy, Download, FileText, RefreshCw } from 'lucide-react';
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
	};
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CodeViewer({ isOpen, onOpenChange, file }: CodeViewerProps) {
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadContent = useCallback(
		async (signal?: AbortSignal) => {
			setLoading(true);
			setCode('');
			setError(null);
			try {
				let content = '';
				if (file.content) content = file.content;
				else if (file.url) {
					const response = await fetch(file.url, { signal });
					if (!response.ok) throw new Error(`The server returned ${response.status}.`);
					content = await response.text();
				}
				if (signal?.aborted) return;
				setCode(content);
			} catch (error) {
				if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
				setError('File content could not be loaded.');
				toastService.error('Could not load file');
			} finally {
				if (!signal?.aborted) setLoading(false);
			}
		},
		[file]
	);

	const handleClose = useCallback(
		(open: boolean) => {
			if (!open) {
				setCode('');
				setError(null);
				setLoading(true);
			}
			onOpenChange(open);
		},
		[onOpenChange]
	);

	useEffect(() => {
		if (!isOpen) return;
		const controller = new AbortController();
		void loadContent(controller.signal);
		return () => controller.abort();
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

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toastService.success('Contenido copiado');
		} catch {
			toastService.error('Content could not be copied');
		}
	};

	return (
		<Dialog onOpenChange={handleClose} open={isOpen}>
			<DialogContent className="flex h-[85vh] max-w-[90vw] flex-col overflow-hidden p-0">
				<DialogHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-3 pr-14">
					<div className="flex items-center gap-2 truncate">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--entity-document)/10">
							<FileText className="h-4 w-4 text-(--entity-document)" />
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
							<Download className="h-3.5 w-3.5" /> Download
						</Button>
						<Button
							className="h-7 w-7 p-0"
							disabled={loading || !code}
							onClick={handleCopy}
							size="icon"
							variant="ghost"
						>
							{copied ? <Check className="h-3.5 w-3.5 text-dt-success-500" /> : <Copy className="h-3.5 w-3.5" />}
						</Button>
					</div>
				</DialogHeader>
				<div className="flex-1 overflow-hidden">
					{loading ? (
						<div className="flex h-full items-center justify-center text-muted-foreground text-sm" role="status">
							Loading file...
						</div>
					) : error ? (
						<div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
							<p className="text-destructive text-sm">{error}</p>
							<Button onClick={() => void loadContent()} size="sm" variant="outline">
								<RefreshCw className="h-3.5 w-3.5" /> Retry
							</Button>
						</div>
					) : (
						<pre
							aria-label="Contenido del documento"
							className="h-full overflow-auto bg-muted/20 p-4 font-mono text-foreground text-xs leading-5 whitespace-pre-wrap break-words"
							data-testid="document-content"
						>
							{code}
						</pre>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
