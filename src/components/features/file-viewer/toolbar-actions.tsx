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
        <div className="fixed inset-x-4 top-4 z-[9999] flex items-center justify-between">
            <div className="flex space-x-2">
                <Button onClick={onZoomIn} size="icon" title="Acercar" variant="outline">
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={onZoomOut} size="icon" title="Alejar" variant="outline">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={onReset} size="icon" title="Restablecer vista" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={onCopy} size="icon" title="Copiar" variant="outline">
                    <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={onDownload} size="icon" title="Descargar" variant="outline">
                    <Download className="h-4 w-4" />
                </Button>
            </div>

            <Button onClick={onClose} ref={closeButtonRef} size="icon" title="Cerrar" variant="outline">
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
});
