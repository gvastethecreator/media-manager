import { useEffect, useCallback } from "react";

/**
 * Hook optimizado para manejar el efecto de brillo en las tarjetas
 * @param elementRef Referencia al elemento que tendrá el efecto
 */
export function useGlowEffect(elementRef: React.RefObject<HTMLElement>) {
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      requestAnimationFrame(() => {
        elementRef.current?.style.setProperty("--mouse-x", `${x}px`);
        elementRef.current?.style.setProperty("--mouse-y", `${y}px`);
      });
    },
    [elementRef]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("mousemove", handleMouseMove);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
    };
  }, [elementRef, handleMouseMove]);
}
