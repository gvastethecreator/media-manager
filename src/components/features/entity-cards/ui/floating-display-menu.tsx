'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronsLeft, Layers, Maximize2, Minimize2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useCardDisplay } from '../context/card-display-context';

export function FloatingDisplayMenu() {
	const { displayMode, setDisplayMode, isMenuVisible, toggleMenu } = useCardDisplay();
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Controlar el colapso del menú
	const toggleCollapse = () => {
		setIsCollapsed((prev) => !prev);
	};

	// Si el menú no es visible, no renderizar nada
	if (!isMenuVisible) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'fixed bottom-4 right-4 z-50 bg-card shadow-lg rounded-lg border border-border',
				isCollapsed ? 'w-12' : 'w-64'
			)}
		>
			{/* Cabecera del menú */}
			<div className="flex items-center justify-between p-2 border-b border-border">
				{!isCollapsed && <h3 className="text-sm font-medium">Modo de visualización</h3>}
				<div className="flex space-x-1 ml-auto">
					<Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleCollapse}>
						{isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
					</Button>
					<Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMenu}>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Contenido del menú */}
			{!isCollapsed && (
				<div className="p-3 space-y-2">
					<div className="text-xs text-muted-foreground mb-2">Selecciona cómo mostrar las tarjetas de entidades:</div>

					<Button
						variant={displayMode === 'simple' ? 'default' : 'outline'}
						size="sm"
						className="w-full justify-start"
						onClick={() => setDisplayMode('simple')}
					>
						<Minimize2 className="h-4 w-4 mr-2" />
						Modo Simple
					</Button>

					<Button
						variant={displayMode === 'complex' ? 'default' : 'outline'}
						size="sm"
						className="w-full justify-start"
						onClick={() => setDisplayMode('complex')}
					>
						<Layers className="h-4 w-4 mr-2" />
						Modo Completo
					</Button>

					<Button
						variant={displayMode === 'json' ? 'default' : 'outline'}
						size="sm"
						className="w-full justify-start"
						onClick={() => setDisplayMode('json')}
					>
						<ChevronsLeft className="h-4 w-4 mr-2" />
						Modo JSON
					</Button>

					<div className="text-xs text-muted-foreground mt-4">
						{displayMode === 'simple' && 'Modo optimizado para rendimiento.'}
						{displayMode === 'complex' && 'Modo con todas las características visuales.'}
						{displayMode === 'json' && 'Visualización de datos en formato JSON.'}
					</div>
				</div>
			)}
		</motion.div>
	);
}
