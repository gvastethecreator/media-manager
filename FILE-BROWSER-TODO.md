Este documento es para ir anotando las tareas pendientes relacionadas con el navegador de archivos.

El archivo principal es "__file-browser.tsx__" , es nuestro core de navegación de archivos.
Este es usado por un componente llamado "__base-content-view.tsx__" que esta en la carpeta views.
El mismo tambien es llamado dependiendo la entidad que lo solicite, en este caso "__folder-content-view.tsx__" utiliza "__base-content-view.tsx__" para mostrar el contenido de una carpeta que a su vez este utiliza "__file-browser.tsx__" para navegar por los archivos de esa carpeta.

---

# Tareas pendientes:

## Menu contextual :
El menú contextual ocurre cuando hacemos click derecho en un elemento dentro del navegador de archivos.
- [ ] Agregar opciones de "Copiar" y "Pegar" para archivos y carpetas.
- [ ] Agregar opción de "Renombrar" para archivos y carpetas.
- [ ] Agregar opción de "Eliminar" para archivos y carpetas.
- [ ] Agregar opción de "Descargar" para archivos.
- [ ] Agregar opción de Mover archivos a otra ubicación
- [ ] Agregar opción de agregar a... todas las entidades.
- [ ] Agregar opción de "Ver en el explorador" para abrir la carpeta en el explorador del sistema.
- [ ] Agregar opción de "Abrir" para abrir el archivo en "__file-viewer.tsx__".
- [ ] Agregar opción de "Marcar" , esto le agrega una marca al archivo para luego realizar acciones masivas con todos los "marcados".

tambien debe haber soporte para el click derecho en espacios vacios o cuando tenemos muchos items seleccionados.

- [ ] Agregar opción de "Seleccionar todo" para seleccionar todos los archivos y carpetas en la vista actual ( espacio vacio  )

---

# Mejoras en las vistas de archivos:

## Vista de lista:
En modo lista se ven en una lista vertical de items.
Cada item de esta lista es una fila con información relevante : desde el thumbnail, nombre, descripción, prompts, tags, entidades relacionadas, todo organizado de una manera compacta y fácil de leer con iconos, colores, etc. actualmente el modo lista solo es una fila simple con el nombre y el thumbnail.
- [ ] hacer una auditoria de la lista actual y ver que falta.
- [ ] Agregar funcionalidad compartida con la main toolbar y las settings de personalización.

## Vista de mosaico :
En modo mosaico se ven en una cuadrícula de items en formato mosaico tipo pinterest, acomodadas segun su aspect ratio y ordenandose de manera que se vean lo mejor posible.
Actualmente no respetan los aspect ratio ni se ve de la manera que se espera.
El espaciado entre items se puede personalizar, al igual que el tamaño de los thumbnails.

## Vista de grid :
Nosotros podemos defininir la grilla, que tamaño de thumbnails, que aspect ratio y espaciado entre items.
Deberan ser las imagenes completas y en el hover se mostrará la información adicional.

## Vista de cards :
Esta vista tendra una tarjeta interactiva por cada item, con información relevante, mostrada de una manera mas detallada y elegante por item, con posibilidad de ordenarlas tipo mosaico o grid. es la mas completa de todas.

Deberás elaborar un plan de acción para implementar estas vistas, priorizando la vista de lista y luego las demás. Las que tenemos ahora son simples y minimas.

Tambien debemos asegurarnos que tenemos la metadata e información relevante de cada item.


# Tipos de archivo :
Actualmente solo soportamos imagenes.
Pero debemos asegurarnos de agregar soporte para otros tipos de achivos.
Hay que crear tarjetas para :
- [ ] Videos
- [ ] Audios
- [ ] Documentos
- [ ] Archivos 3D
- [ ] JSON
- [ ] Markdown
- [ ] Otros tipos de archivos que estan en el esquema pero aún no se implementan.

# File Viewer

Hay que arreglar file-viewer.tsx para que soporte todos los tipos de archivos.
Tambien deberiamos arreglarlo para que funcione nuevamente ya que esta roto actualmente y no se puede abrir nada.

# Mejor integración con la barra de herramientas principal y el status bar
- Mover status bar a un componente por separado que pueda ser reutilizado en otras vistas.
- Integrar completamente main toolbar con file browser para que todas las acciones de navegación y gestión de archivos estén disponibles desde la barra de herramientas y se adapten segun el contexto en el que estamos.

# Mejoras de rendimiento y usabilidad
- [ ] Optimizar el rendimiento del navegador de archivos para manejar grandes volúmenes de datos manteniendo 60 fps y animaciones suaves con una experiencia de usuario interesante.

Todas las opciones de personalización van a estar integradas en las settings correspondientes, pero debemos asegurarnos que todas las vistas y funcionalidades esten disponibles desde el navegador de archivos.

# Selección drag and drop
- [ ] Implementar la selección de múltiples archivos y carpetas mediante drag and drop, permitiendo al usuario seleccionar varios elementos arrastrando el mouse sobre ellos.

https://github.com/daybrush/selecto podemos usar esta o una implementación propia si es mas sencillo ( esta librería esta un poco desactualizada asi que analicemos si es mejor usarla o no )

