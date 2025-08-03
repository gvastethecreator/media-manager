/**
 * @file Test simple para verificar que el menú contextual funciona
 */

import { CustomContextMenu } from '@/components/features/file-browser/context-menu/custom-context-menu';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';

export function TestContextMenu() {
  const {
    isOpen,
    position,
    handleContextMenu,
    closeMenu,
  } = useCustomContextMenu();

  const handleAction = (action: string, data?: any) => {
    console.log('Acción ejecutada:', action, data);
    // eslint-disable-next-line no-alert
    alert(`Acción: ${action}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleContextMenu(e as any);
    }
  };

  return (
    <div className="p-8">
      <div
        className="w-full h-96 bg-muted border border-border rounded-lg flex items-center justify-center cursor-default"
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Área de prueba del menú contextual"
      >
        <p className="text-lg text-muted-foreground">
          Haz click derecho aquí para ver el menú contextual
        </p>
      </div>

      <CustomContextMenu
        isOpen={isOpen}
        onClose={closeMenu}
        position={position}
        selectedItems={[]} // Sin elementos seleccionados para probar menú de espacio vacío
        onAction={handleAction}
      />
    </div>
  );
}
