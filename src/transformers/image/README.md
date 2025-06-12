# 🖼️ Transformador de Imágenes (Image)

## Descripción

Transformadores responsables de validar, mapear y extender la entidad **Image** para todos los flujos de la aplicación (persistencia, UI, API, estadísticas, etc.).

---

## 🔒 Robustez y Validación

- **Nunca** se propagan arrays nulos, promesas o datos corruptos.
- Todos los métodos de transformación (`transformImages`, `transformImagesToComplete`, `transformImagesToExtended`) filtran y loguean cualquier elemento inválido.
- Se documenta y loguea la causa de exclusión de cada elemento.
- Los arrays devueltos son siempre de objetos validados y planos.

---

## 🛡️ Ejemplo de validación y logging

```typescript
const result = transformImages([raw1, null, raw2, Promise.resolve(), raw3]);
// Solo se incluirán objetos válidos, el resto se loguea y se excluye
```

---

## 📝 Checklist de robustez

- [x] Validación de arrays en entrada y salida
- [x] Logging detallado de exclusiones
- [x] Arrays nunca contienen promesas ni nulos
- [x] Documentación y advertencias en cada función

---

## 🗺️ Diagrama de flujo (Mermaid)

```mermaid
graph TD
    A[Raw Images/Prisma] -->|transformImages| B[ImageBase[]]
    B -->|transformImagesToComplete| C[ImageComplete[]]
    C -->|transformImagesToExtended| D[ImageExtended[]]
    D -->|Store/UI| E[Visualización]
```

---

## ⚠️ Advertencias

- Si modificas la estructura de Image, actualiza los esquemas, validadores y este README.
- No propagar nunca datos inconsistentes a los stores ni a la UI.

---

## Última revisión

- Fecha: 2025-06-11
- Estado: 🟢 Validación y robustez reforzadas.
