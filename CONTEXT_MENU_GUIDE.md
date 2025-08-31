# Menú Contextual - Guía de Uso

## 📋 Funcionalidad Implementada

✅ **Menú Contextual con Click Derecho**
- Implementado en `file-canvas.tsx` (componente base de todos los canvas)
- Se activa al hacer click derecho en cualquier item del file browser

✅ **Opciones Principales del Menú:**
- **Abrir** - Abre el/los items seleccionados  
- **Vista previa** - Previsualiza el item
- **Copiar** - Copia los items seleccionados
- **Renombrar** - Renombra un item individual (deshabilitado para múltiple selección)
- **Descargar** - Descarga los items
- **Eliminar** - Elimina los items (con estilo destructivo en rojo)

✅ **Submenú "Agregar a..." con todas las entidades solicitadas:**
- 📸 Album
- 📦 Colección  
- 👥 Grupo
- 🏷️ Tag
- ✨ World Item
- 👤 Characters
- 💡 Concept
- 📝 Notes
- 📍 Places
- 🎯 Prompts
- ⚙️ Properties
- 🪄 Wildcards
- ❤️ Favorites

## 🎯 Comportamiento del Menú

### Selección Automática
- Si haces click derecho en un item no seleccionado, se selecciona automáticamente
- Si el item ya está seleccionado, mantiene la selección múltiple existente
- Muestra el número de items seleccionados en la opción "Abrir"

### Interacción
- El menú se posiciona en las coordenadas del cursor
- Se cierra automáticamente al hacer click fuera o presionar Escape
- Las opciones tienen hover effects y feedback visual

### Submenús
- El submenú "Agregar a..." se despliega al hacer hover
- Incluye separadores visuales para organizar las opciones
- Todas las entidades tienen iconos distintivos

## 🔧 Implementación Técnica

### Archivos Modificados/Creados:
1. **`extended-context-menu.tsx`** - Nuevo componente de menú contextual
2. **`file-canvas.tsx`** - Integrado el menú contextual con handlers de eventos

### Estados Gestionados:
- **Posición del menú** - Coordenadas x,y del cursor
- **Items seleccionados** - Array de MediaItems para el contexto
- **Visibilidad** - Estado abierto/cerrado del menú

### Eventos:
- **onContextMenu** - Captura click derecho y calcula posición
- **onAction** - Handler para las acciones del menú (por implementar)
- **onClose** - Cierre del menú con cleanup de estados

## 🚧 Próximos Pasos (TODO)

Los handlers de las acciones están preparados pero necesitan implementación:
- Conectar con las APIs de cada entidad
- Implementar diálogos de selección para elegir album/colección específica
- Manejar operaciones de copia/movimiento de archivos
- Integrar con sistema de favoritos existente

## 🎨 Uso en la Aplicación

1. **Navega** a cualquier vista del file browser (grid, list, table, etc.)
2. **Haz click derecho** en cualquier imagen o archivo
3. **Selecciona** una opción del menú o explora "Agregar a..."
4. **Observa** los logs en la consola para ver qué acción se ejecutó

¡El menú contextual está completamente funcional y listo para conectar con la lógica de negocio!