# Desarrollo de Pantallas de Configuración para Entidades

## Estado Actual
- [x] Iniciar tarea
- [x] Configuración de Albums
  - [x] Listar albums existentes
  - [x] Estadísticas de albums
  - [x] Formulario de creación/edición
  - [x] Previsualización con album-card
  - [x] Diseño compacto de tres paneles en una vista
- [x] Configuración de Tags
  - [x] Listar tags con estadísticas
  - [x] Formulario para crear/editar tags
  - [x] Previsualización de tag
  - [x] Filtrado por categoría/uso
- [x] Configuración de Collections
  - [x] Listar collections con estadísticas
  - [x] Formulario para crear/editar collections
  - [x] Previsualización de collection
  - [x] Filtrado por categoría/favoritos
- [x] Configuración de Characters
  - [x] Listar characters con estadísticas
  - [x] Formulario para crear/editar characters
  - [x] Previsualización de character
  - [x] Filtrado por clase/categoría/favoritos
- [x] Configuración de Places
  - [x] Listar places con estadísticas
  - [x] Formulario para crear/editar places
  - [x] Previsualización de place
  - [x] Filtrado por tipo/región/favoritos
- [x] Configuración de World Items
  - [x] Listar world items con estadísticas
  - [x] Formulario para crear/editar world items
  - [x] Previsualización de world item
  - [x] Filtrado por tipo/rareza/favoritos
- [x] Configuración de Concepts
  - [x] Listar concepts con estadísticas
  - [x] Formulario para crear/editar concepts
  - [x] Previsualización de concept
  - [x] Filtrado por categoría/favoritos
- [ ] Configuración de Prompts
- [ ] Configuración de Notes
- [ ] Configuración de Folders
- [ ] Configuración de Visual Presets

## Progreso

### Albums
- ✅ Implementado listado de albums con estadísticas y funcionalidades CRUD
- ✅ Agregado formulario con validación para crear/editar albums
- ✅ Integración con AlbumCard para previsualización
- ✅ Creados componentes reutilizables: ColorPicker y EmojiPicker
- ✅ Rediseñado con layout compacto de dos paneles en una sola vista
- ✅ Optimizado espaciado, tamaños y controles
- ✅ Implementado scrolling en ambos paneles para mejor uso del espacio

### World Items
- ✅ Implementado listado con diseño compacto
- ✅ Agregado sistema de filtros en popover
- ✅ Diseño de previsualización en tiempo real
- ✅ Vista integrada con lista, formulario y preview simultáneos

### Tags
- ✅ Implementado listado de tags con estadísticas
- ✅ Implementado formulario para crear/editar tags
- ✅ Implementado previsualización de tags
- ✅ Implementado filtrado por categoría y uso
- ✅ Implementado sugerencias automáticas de emoji y color

### Collections
- ✅ Implementado listado de colecciones con estadísticas completas
- ✅ Implementado formulario para crear/editar colecciones con campos específicos
- ✅ Implementado previsualización de colecciones
- ✅ Implementado filtrado por categoría y favoritos
- ✅ Implementado sugerencias basadas en categoría o nombre

### Characters
- ✅ Implementado listado completo de personajes con estadísticas detalladas
- ✅ Creado formulario avanzado para personajes con validación Zod
- ✅ Implementada previsualización de personajes con sus atributos principales
- ✅ Añadido filtrado múltiple por clase, categoría y favoritos
- ✅ Implementadas estadísticas detalladas con distribución por clases y razas
- ✅ Agregada funcionalidad de sugerencias basadas en clase o nombre

### Places
- ✅ Implementado listado completo de lugares con estadísticas y contadores
- ✅ Creado formulario completo para lugares con todos los campos específicos
- ✅ Implementada visualización previa que muestra el lugar con su color y emoji
- ✅ Añadido sistema de filtrado por tipos, regiones y favoritos
- ✅ Implementadas estadísticas detalladas incluyendo distribución por tipos y regiones
- ✅ Agregada funcionalidad para sugerir colores y emojis basados en el tipo o nombre

### Concepts
- ✅ Implementado listado completo de conceptos con estadísticas detalladas
- ✅ Creado formulario para conceptos con validación Zod incluyendo contenido extenso
- ✅ Implementada previsualización de conceptos que muestra color, emoji y categoría
- ✅ Añadido sistema de filtrado por categoría, texto y favoritos
- ✅ Integrado sistema para parsear y mostrar etiquetas en formato JSON
- ✅ Implementada actualización en tiempo real de la vista previa

## Lineamientos de Diseño Actualizados

### Estructura Común para Configuración de Entidades
1. **Layout de Dos Paneles**:
   - Panel izquierdo: Lista compacta de entidades (1/3 del ancho)
   - Panel derecho: Formulario y previsualización (2/3 del ancho)

2. **Optimizaciones de Espacio**:
   - Reducción de padding (py-2, px-3)
   - Espaciado entre elementos (space-y-1)
   - Tamaños de fuente más pequeños (text-xs, text-[10px])
   - Altura fija con scroll en ambos paneles h-[calc(100vh-8rem)]

3. **Controles de Formulario**:
   - Botones pequeños (size="sm", h-6, h-7)
   - Iconos reducidos (h-3.5 w-3.5)
   - Botones de acción en el encabezado del panel derecho

4. **Vista Previa**:
   - Tamaño reducido (w-[180px])
   - Actualización en tiempo real al editar
   - Vista previa por defecto con bordes punteados

5. **Estilos Consistentes**:
   - Usar las mismas clases de espaciado y tamaño en todos los componentes
   - Mantener proporciones similares entre paneles
   - Usar colores muted para fondos y bordes

### Próximos Pasos: Prompts
Para la implementación de Prompts, seguir estos pasos:

1. Analizar la estructura actual de Prompts en el esquema de Prisma
2. Implementar `prompts-settings.tsx` siguiendo el patrón establecido
3. Crear formulario con validación para prompts
4. Agregar visualización previa según el diseño actual
5. Implementar filtrado por categoría/tipo

### Mejoras Generales a Implementar
- [x] Reducir el padding general en los componentes
- [x] Optimizar el espacio con ScrollArea en ambos paneles
- [x] Agregar botones de acción en el encabezado
- [x] Mejorar la organización del formulario
- [ ] Implementar confirmación antes de eliminar elementos
- [ ] Optimizar rendimiento para colecciones grandes
- [ ] Añadir animaciones sutiles para mejorar la experiencia de usuario
