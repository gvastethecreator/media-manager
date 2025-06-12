# 🏪 Store de Imágenes (Image Store)

## Descripción

Store Zustand para la gestión de imágenes, con slices para core, UI y filtros. Garantiza que solo se almacenen arrays de imágenes validadas y planas.

---

## 🛡️ Robustez y Validación

- Antes de agregar imágenes al store (`addImages`), se filtran y loguean nulos, promesas y datos corruptos.
- Nunca se propagan arrays inconsistentes a la UI.
- Se documenta y advierte sobre la importancia de mantener la integridad de los datos.

---

## 📝 Checklist de robustez

- [x] Validación de arrays en entrada
- [x] Logging de exclusiones
- [x] Arrays nunca contienen promesas ni nulos
- [x] Documentación y advertencias en cada función

---

## ⚠️ Advertencias

- Si modificas la estructura de Image o la lógica de transformación, actualiza este README y los tests.
- No propagar nunca datos inconsistentes a la UI.

---

## Última revisión

- Fecha: 2025-06-11
- Estado: 🟢 Validación y robustez reforzadas.
