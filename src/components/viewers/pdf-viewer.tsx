import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toastService } from '@/lib/ui/toast';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
	file: { id: string; name: string; url: string };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PdfViewer({ isOpen, onOpenChange, file }: PdfViewerProps) {
	const [numPages, setNumPages] = useState(0);
	const [pageNumber, setPageNumber] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
		setNumPages(nextNumPages);
		setLoading(false);
		setError(null);
	};

	const onDocumentLoadError = () => {
		setLoading(false);
		setError('No se pudo cargar el PDF');
		toastService.error('Error al cargar el documento PDF');
	};

	const changePage = (offset: number) => setPageNumber((prev) => Math.max(1, Math.min(numPages, prev + offset)));

	const handleClose = (open: boolean) => {
		if (!open) {
			setPageNumber(1);
			setLoading(true);
			setError(null);
			setNumPages(0);
		}
		onOpenChange(open);
	};

	return (
		<Dialog onOpenChange={handleClose} open={isOpen}>
			<DialogContent className="flex h-[85vh] max-w-[90vw] flex-col overflow-hidden p-0">
				<DialogHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-4 py-3">
					<div className="flex items-center gap-2 truncate">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--entity-document)/10">
							<FileText className="h-4 w-4 text-(--entity-document)" />
						</div>
						<DialogTitle className="truncate font-medium text-sm">{file.name}</DialogTitle>
					</div>
					<Button
						className="h-7 gap-1.5 text-xs"
						onClick={() => window.open(file.url, '_blank')}
						size="sm"
						variant="outline"
					>
						<Download className="h-3.5 w-3.5" /> Descargar
					</Button>
				</DialogHeader>
				<div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-neutral-900">
					{loading && (
						<div className="flex flex-col items-center gap-2 text-white">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="text-sm">Cargando...</span>
						</div>
					)}
					{error && <p className="text-destructive text-sm">{error}</p>}
					{!(loading || error) && (
						<Document file={file.url} onLoadError={onDocumentLoadError} onLoadSuccess={onDocumentLoadSuccess}>
							<Page className="shadow-lg" pageNumber={pageNumber} />
						</Document>
					)}
				</div>
				{!(loading || error) && (
					<div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
						<Button
							className="h-8 w-8 p-0"
							disabled={pageNumber <= 1}
							onClick={() => changePage(-1)}
							size="icon"
							variant="outline"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="font-medium text-sm tabular-nums">
							Página {pageNumber} de {numPages}
						</span>
						<Button
							className="h-8 w-8 p-0"
							disabled={pageNumber >= numPages}
							onClick={() => changePage(1)}
							size="icon"
							variant="outline"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
