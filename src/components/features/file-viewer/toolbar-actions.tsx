import { Copy, Download, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACTION_BUTTON_CLASS =
	'text-white hover:bg-white/15 hover:text-white focus-visible:ring-1 focus-visible:ring-white/30';
const ACTION_PANEL_CLASS = 'rounded-dt-lg border border-white/10 bg-black/40 p-1 backdrop-blur';

export const ToolbarActions = memo(function ToolbarActionsImpl({
	onZoomIn,
	onZoomOut,
	onReset,
	onCopy,
	onDownload,
	onClose,
	closeButtonRef,
}: {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onReset: () => void;
	onCopy: () => void;
	onDownload: () => void;
	onClose: () => void;
	closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
	return (
		<div className="pointer-events-none fixed inset-x-4 top-4 z-9999 flex items-center justify-between">
			<div className={cn('pointer-events-auto flex items-center gap-1', ACTION_PANEL_CLASS)}>
				<Button className={ACTION_BUTTON_CLASS} onClick={onZoomIn} size="icon" title="Acercar" variant="ghost">
					<ZoomIn className="h-5 w-5" />
				</Button>
				<Button className={ACTION_BUTTON_CLASS} onClick={onZoomOut} size="icon" title="Alejar" variant="ghost">
					<ZoomOut className="h-5 w-5" />
				</Button>
				<Button className={ACTION_BUTTON_CLASS} onClick={onReset} size="icon" title="Restablecer vista" variant="ghost">
					<RotateCcw className="h-5 w-5" />
				</Button>
				<Button className={ACTION_BUTTON_CLASS} onClick={onCopy} size="icon" title="Copiar" variant="ghost">
					<Copy className="h-5 w-5" />
				</Button>
				<Button className={ACTION_BUTTON_CLASS} onClick={onDownload} size="icon" title="Descargar" variant="ghost">
					<Download className="h-5 w-5" />
				</Button>
			</div>

			<Button
				className={cn('pointer-events-auto', ACTION_PANEL_CLASS, ACTION_BUTTON_CLASS)}
				onClick={onClose}
				ref={closeButtonRef}
				size="icon"
				title="Cerrar"
				variant="ghost"
			>
				<X className="h-6 w-6" />
			</Button>
		</div>
	);
});
