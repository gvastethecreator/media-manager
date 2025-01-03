import { createContext, useContext, useRef } from "react";

interface AnimationContextType {
	getAnimationDelay: (index: number, columns: number) => number;
	lastAnimatedIndex: React.MutableRefObject<number>;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
	const lastAnimatedIndex = useRef<number>(0);

	const getAnimationDelay = (index: number, columns: number) => {
		// Calculamos el retraso basado en la posición real en la grilla
		const row = Math.floor(index / columns);
		const col = index % columns;

		// Usamos una función más suave para el retraso
		const baseDelay = 0.05; // Retraso base entre elementos
		const rowDelay = row * (baseDelay * 0.5);
		const colDelay = col * baseDelay;

		// Aseguramos que las animaciones sean secuenciales
		const totalDelay = Math.max(
			rowDelay + colDelay,
			lastAnimatedIndex.current * baseDelay
		);
		lastAnimatedIndex.current = index;

		return totalDelay;
	};

	return (
		<AnimationContext.Provider value={{ getAnimationDelay, lastAnimatedIndex }}>
			{children}
		</AnimationContext.Provider>
	);
}

export const useAnimation = () => {
	const context = useContext(AnimationContext);
	if (!context) {
		throw new Error("useAnimation must be used within an AnimationProvider");
	}
	return context;
};
