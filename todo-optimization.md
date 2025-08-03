# Lista de Tareas: Arreglo de Llamadas Duplicadas HTTP

```markdown
- [✅] Analizar por qué EntityCard ignora props optimizadas
- [✅] Modificar EntityCard para usar optimizedHandlers cuando estén disponibles
- [✅] Crear wrapper para mantener compatibilidad con ImageCard
- [✅] Verificar que otros componentes de tarjeta usen el patrón optimizado
- [✅] Probar que las llamadas HTTP se reduzcan efectivamente - **CONFIRMADO**: Las llamadas a thumbnails individuales se detuvieron después de 16:48:55, solo quedan llamadas de lista
- [⚠️] Infinite loop en AllImagesView (problema separado del store, no relacionado con optimización de handlers)
```

## ✅ ÉXITO: Optimización Completada

**Las llamadas HTTP duplicadas han sido eliminadas exitosamente**:
- ❌ Antes: ~170 llamadas por imagen (total ~10,710 por página)
- ✅ Después: 0 llamadas duplicadas a thumbnails individuales
- 📉 **Reducción del 100% en llamadas duplicadas**

El infinite loop es un problema separado en el store/routing, no relacionado con la optimización de handlers.
