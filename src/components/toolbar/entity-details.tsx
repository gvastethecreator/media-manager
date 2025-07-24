import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileIcon, FileText, FolderIcon, Hash, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';

// Definimos una interfaz para el tipo de retorno de getCurrentItem
interface EntityWithDynamicProperties {
	id: string | null;
	name: string;
	itemType: string;
	// Propiedades opcionales que pueden estar presentes
	count?: number;
	path?: string;
	totalSize?: number;
	lastIndexed?: Date;
	description?: string;
	createdAt?: Date;
	color?: string;
	emoji?: string;
}

/**
 * Componente que muestra información detallada sobre la entidad actual (carpeta, colección, etc.)
 * Se mostrará a la derecha de los breadcrumbs con un estilo más sutil
 *
 * NOTA: Este componente está deshabilitado temporalmente durante la migración a React Router
 */
export function EntityDetails() {
	// Componente deshabilitado durante la migración
	return null;
}
