import { Copy, Download, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';

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
        <div className="fixed inset-x-4 top-4 z-[9999] flex items-center justify-between pointer-events-none">
            <div className="flex space-x-2 pointer-events-auto">
                <Button onClick={onZoomIn} size="icon" title="Acercar" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <ZoomIn className="h-5 w-5" />
                </Button>
                <Button onClick={onZoomOut} size="icon" title="Alejar" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <Button onClick={onReset} size="icon" title="Restablecer vista" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <RotateCcw className="h-5 w-5" />
                </Button>
                <Button onClick={onCopy} size="icon" title="Copiar" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <Copy className="h-5 w-5" />
                </Button>
                <Button onClick={onDownload} size="icon" title="Descargar" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                    <Download className="h-5 w-5" />
                </Button>
            </div>

            <Button onClick={onClose} ref={closeButtonRef} size="icon" title="Cerrar" variant="ghost" className="pointer-events-auto text-white hover:bg-white/20 hover:text-white">
                <X className="h-6 w-6" />
            </Button>
        </div>
    );
});
