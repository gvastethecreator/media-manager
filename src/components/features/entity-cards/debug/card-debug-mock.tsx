'use client';

import { createContext, useContext, useState } from 'react';

// Tipo de herramientas de depuración disponibles
export type DebugTool = 'showRenders' | 'showProps' | 'logEvents';

// Interfaz del contexto de depuración
interface CardDebugContextType {
	activeDebugTools: DebugTool[];
	toggleDebugTool: (tool: DebugTool) => void;
	isDebugToolActive: (tool: DebugTool) => boolean;
}

// Valor por defecto para el contexto de depuración
const defaultDebugContext: CardDebugContextType = {
	activeDebugTools: [],
	toggleDebugTool: () => { },
	isDebugToolActive: () => false,
};

// Crear contexto
const CardDebugContext = createContext<CardDebugContextType>(defaultDebugContext);

// Hook para usar el contexto de depuración
export const useCardDebug = () => useContext(CardDebugContext);

// Proveedor del contexto de depuración
export function CardDebugProvider({ children }: { children: React.ReactNode }) {
	const [activeDebugTools, setActiveDebugTools] = useState<DebugTool[]>([]);

	// Función para activar/desactivar una herramienta de depuración
	const toggleDebugTool = (tool: DebugTool) => {
		setActiveDebugTools(prev =>
			prev.includes(tool)
				? prev.filter(t => t !== tool)
				: [...prev, tool]
		);
	};

	// Función para verificar si una herramienta está activa
	const isDebugToolActive = (tool: DebugTool) => {
		return activeDebugTools.includes(tool);
	};

	const contextValue = {
		activeDebugTools,
		toggleDebugTool,
		isDebugToolActive,
	};

	return (
		<CardDebugContext.Provider value={contextValue}>
			{children}
		</CardDebugContext.Provider>
	);
}