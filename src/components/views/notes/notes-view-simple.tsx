import { StickyNote } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesViewSimpleProps {
  className?: string;
}

const NotesViewSimple: React.FC<NotesViewSimpleProps> = ({ className }) => {
  const [isLoading] = React.useState(false);
  const [showForm] = React.useState(false);

  if (isLoading) {
    return <LoadingScreen message="Cargando notas..." />;
  }

  return (
    <ScrollArea className={className || 'flex-1'}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Vista de Notas</h2>
          <Button>
            <StickyNote className="h-4 w-4 mr-2" />
            Crear Nota
          </Button>
        </div>

        {!showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              icon={StickyNote}
              title="Sin notas"
              description="No hay notas disponibles en este momento. Crea tu primera nota para comenzar."
            />
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
};

export default NotesViewSimple;
