# Resumen del Sistema de Tarjetas de Entidad

## Propósito

El sistema de tarjetas de entidad proporciona una forma unificada y visualmente atractiva de representar diferentes tipos de entidades (carpetas, álbumes, etiquetas, etc.) en la interfaz de usuario. Permite una experiencia coherente mientras mantiene la flexibilidad para mostrar información específica de cada tipo de entidad.

## Componentes Principales

- **EntityCardAdapter**: Punto de entrada principal que determina qué tipo de tarjeta renderizar basado en el tipo de entidad.
- **EntityCardWrapper**: Contenedor que proporciona funcionalidades comunes como efectos visuales, interactividad y modo de explosión de capas.
- **Layouts específicos**: Implementaciones para cada tipo de entidad (FolderCardLayout, AlbumCardLayout, etc.).
- **Sistema de capas**: Permite separar visualmente los componentes de la tarjeta para una mejor comprensión de su estructura.

## Características Clave

- **Adaptabilidad**: Se ajusta a diferentes tipos de entidades manteniendo una apariencia coherente.
- **Personalización visual**: Soporta diferentes presets de diseño, efectos y configuraciones visuales.
- **Interactividad**: Incluye estados hover, click y animaciones para mejorar la experiencia del usuario.
- **Modo de explosión**: Permite ver las diferentes capas de la tarjeta separadas para entender su estructura.
- **Rendimiento optimizado**: Utiliza técnicas para minimizar el impacto en el rendimiento de los efectos visuales.

## Recientes Mejoras y Correcciones

- **Adaptación Responsiva**: Se han añadido clases para que las tarjetas se adapten al tamaño completo de su contenedor.
- **Documentación Visual**: Se han agregado diagramas Mermaid para visualizar la arquitectura y flujo de datos.
- **Rediseño de Tarjetas de Carpeta**: Se ha implementado un nuevo diseño inspirado en cartas de Magic/Pokémon TCG con bordes estilizados, efectos visuales mejorados y una estética más atractiva.
- **Mejoras Visuales**: Se han añadido efectos de resplandor, texturas sutiles y decoraciones de esquinas para dar más profundidad y atractivo visual.
- **Sistema de Rareza Mejorado**: Se ha refinado el sistema de rareza con gradientes, animaciones y efectos visuales específicos para cada nivel.

## Próximos Pasos

- Implementar más presets de diseño para diferentes contextos de uso.
- Mejorar la accesibilidad de las tarjetas.
- Optimizar aún más el rendimiento para grandes cantidades de tarjetas.
- Añadir más opciones de personalización para el usuario final.
