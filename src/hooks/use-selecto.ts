/**
 * Hook para integrar Selecto con el sistema de selección avanzada
 * Proporciona selección visual de arrastrar para seleccionar múltiples elementos
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Selecto from 'selecto';

interface UseSelectoProps {
	/** Contenedor donde se aplicará la selección */
	container?: string | HTMLElement;
	/** Selector de elementos que se pueden seleccionar */
	selectableTargets?: string[];
	/** Callback cuando se seleccionan elementos */
	onSelect?: (elements: Element[]) => void;
	/** Callback cuando se deseleccionan elementos */
	onDeselect?: (elements: Element[]) => void;
	/** Si la selección está habilitada */
	enabled?: boolean;
}

export function useSelecto({
	container,
	selectableTargets = ['[data-selectable]'],
	onSelect,
	onDeselect,
	enabled = true,
}: UseSelectoProps = {}) {
	const selectoRef = useRef<Selecto | null>(null);
	const [isActive, setIsActive] = useState(false);

	// Inicializar Selecto
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const containerElement =
			typeof container === 'string'
				? (document.querySelector(container) as HTMLElement)
				: (container as HTMLElement) || document.body;

		if (!containerElement) {
			return;
		}

		const selecto = new Selecto({
			container: containerElement,
			selectableTargets,
			hitRate: 0,
			selectByClick: false, // Deshabilitamos click simple para evitar conflictos
			selectFromInside: false,
			continueSelect: false,
			toggleContinueSelect: 'ctrl',
			keyContainer: window,
			preventClickEventOnDrag: true,
			ratio: 0,
			// Estilos del área de selección
			dragContainer: containerElement,
			boundContainer: containerElement,
		});

		// Eventos de Selecto
		selecto.on('dragStart', (e: any) => {
			setIsActive(true);

			// Si no se presiona Ctrl, limpiar selección previa
			if (!(e.inputEvent?.ctrlKey || e.inputEvent?.metaKey)) {
				const selectedElements = document.querySelectorAll('[data-selected="true"]');
				for (const el of selectedElements) {
					el.setAttribute('data-selected', 'false');
					el.classList.remove('selecto-selected');
				}
				onDeselect?.(Array.from(selectedElements));
			}
		});

		selecto.on('selectEnd', (e: any) => {
			setIsActive(false);

			const { added, removed } = e;

			// Actualizar clases y atributos de elementos seleccionados
			if (added) {
				for (const el of added as Element[]) {
					el.setAttribute('data-selected', 'true');
					el.classList.add('selecto-selected');
				}
			}

			if (removed) {
				for (const el of removed as Element[]) {
					el.setAttribute('data-selected', 'false');
					el.classList.remove('selecto-selected');
				}
			}

			// Llamar callbacks
			if (added?.length > 0) {
				onSelect?.(added);
			}
			if (removed?.length > 0) {
				onDeselect?.(removed);
			}
		});

		selecto.on('drag', (e: any) => {
			// Optimización: actualizar solo elementos visibles
			const { added, removed } = e;

			if (added) {
				for (const el of added as Element[]) {
					if (!el.classList.contains('selecto-selecting')) {
						el.classList.add('selecto-selecting');
					}
				}
			}

			if (removed) {
				for (const el of removed as Element[]) {
					el.classList.remove('selecto-selecting');
				}
			}
		});

		selectoRef.current = selecto;

		return () => {
			selecto.destroy();
			selectoRef.current = null;
			setIsActive(false);
		};
	}, [container, enabled, onSelect, onDeselect, selectableTargets]);

	// Métodos para controlar la selección programáticamente
	const selectAll = useCallback(() => {
		if (!selectoRef.current) {
			return;
		}

		const allElements = document.querySelectorAll(selectableTargets.join(', '));
		for (const el of allElements) {
			el.setAttribute('data-selected', 'true');
			el.classList.add('selecto-selected');
		}
		onSelect?.(Array.from(allElements));
	}, [selectableTargets, onSelect]);

	const clearSelection = useCallback(() => {
		const selectedElements = document.querySelectorAll('[data-selected="true"]');
		for (const el of selectedElements) {
			el.setAttribute('data-selected', 'false');
			el.classList.remove('selecto-selected', 'selecto-selecting');
		}
		onDeselect?.(Array.from(selectedElements));
	}, [onDeselect]);

	const getSelected = useCallback((): Element[] => {
		return Array.from(document.querySelectorAll('[data-selected="true"]'));
	}, []);

	const enableSelection = useCallback(() => {
		if (selectoRef.current) {
			// Recrear selecto ya que no tiene método enable/disable
			selectoRef.current.destroy();
			// Se reiniciará en el próximo efecto
		}
	}, []);

	const disableSelection = useCallback(() => {
		if (selectoRef.current) {
			selectoRef.current.destroy();
			selectoRef.current = null;
		}
	}, []);

	return {
		selectoRef,
		isActive,
		selectAll,
		clearSelection,
		getSelected,
		enable: enableSelection,
		disable: disableSelection,
	};
}
