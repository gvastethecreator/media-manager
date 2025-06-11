# Server Actions: Mejores Prácticas

- **Usar para mutaciones y lógica backend:** Server Actions para mutaciones y lógica de negocio.
- **Seguridad:** Validación de input y autorización.
- **Revalidación de caché:** Usa `revalidatePath` y `revalidateTag` tras mutaciones.
- **Manejo de errores:** Implementa manejo con `useFormState` y `useTransition`.
- **Lógica en servicios:** Extrae lógica compleja a servicios.
- **Logging:** Registra requests, errores y ejecuciones.
- **Testing:** Testea lógica backend en servicios.
- **Simplicidad:** Mantén Server Actions simples.
- **Uso con y sin forms:** Compatible con forms HTML y llamadas directas.
- **Errores estructurados:** Devuelve objetos de error consistentes.
- **Enfoque funcional:** Usa funciones puras.
- **Transacciones:** Usa transacciones para operaciones múltiples.
- **Integración de servicios externos:** Abstrae llamadas externas.
- **Progressive enhancement:** Soporta clientes JS y no-JS.
- **Eventos y side effects:** Usa patrones event-based para workflows complejos.
- **Organización modular:** Agrupa por dominio y naming claro.
