---
status: accepted
---

# Artefactos textuales de `Taxonomy` file-backed con la app como editor de primer nivel

La arquitectura objetivo de `Taxonomy` tratará a `Prompt`, `Note` y `Wildcard` como artefactos textuales con soporte file-backed fuerte, sin convertir a la base de datos en segunda verdad canónica ni expulsar a la app del flujo de autoría.

## Decisión

- `Wildcard` se modela como file-backed por defecto en la arquitectura objetivo.
- `Prompt` y `Note` soportan modo file-backed fuerte, pero no necesitan nacer obligatoriamente file-backed desde el primer minuto.
- Cuando un artefacto textual está en modo file-backed, el archivo es la fuente canónica de verdad para el contenido authored.
- La base de datos y la capa de búsqueda sólo conservan metadata operativa, estado de sincronización, hashes, excerpts e índices o caches derivados; no mantienen un espejo canónico editable del texto humano.
- `Prompt` y `Note` file-backed usan Markdown con metadata authored en frontmatter gobernado.
- `Prompt` puede admitir una capa authored específica pequeña y gobernada además del núcleo compartido, sin heredar por ello el shape legacy completo.
- En esa primera capa específica de `Prompt`, el set inicial acordado se limita a `purpose` y `parameters`; `model` y el resto del shape legacy quedan fuera hasta nueva decisión explícita.
- Dentro de ese set, `purpose` conserva semántica propia y no se trata como alias de `summary`: el primero expresa intención de uso y el segundo resume el artefacto.
- Dentro de ese set inicial, `parameters` no se modela como JSON libre sin contrato, sino como bloque authored estructurado y gobernado.
- La representación inicial de ese bloque usa entradas tipadas y gobernadas, no un catálogo rígido de campos dependientes de una herramienta concreta.
- En esa primera representación, los valores permitidos se limitan a escalares y listas planas de escalares; no se aceptan objetos anidados arbitrarios.
- En esa misma representación, las claves se apoyan en un vocabulario canónico curado; las claves custom sólo existen como escape hatch explícito y distinguible.
- Esa distinción entre clave canónica y clave custom se expresa mediante metadata explícita separada del nombre de la clave, no mediante prefijos mágicos incrustados en el string.
- El vocabulario canónico de `Prompt.parameters` nace con un seed mínimo real desde el inicio; no queda vacío como promesa de evolución futura.
- Ese seed inicial es semántico y portable; no se define como catálogo base de knobs técnicos dependientes de una herramienta o modelo concreto.
- La exclusión de campos legacy del top-level de `Prompt` no prohíbe que algunos conceptos reaparezcan como claves canónicas dentro de `parameters`, siempre que su semántica siga siendo portable y no técnica.
- El set mínimo inicial de ese vocabulario canónico es `subject`, `context`, `tone`, `style` y `constraints`.
- Esas claves canónicas son identificadores estables del contrato portable; la localización pertenece a etiquetas o presentación de UI, no al nombre portable.
- Semánticamente, `parameters` describe variables del template de `Prompt` y no el set canónico de valores de una ejecución concreta.
- Cada definición de parámetro puede incluir un default o example authored opcional, siempre que no se trate como valor canónico de una ejecución concreta.
- Todo placeholder usado en el contenido del `Prompt` debe corresponder a un parámetro declarado; a la inversa, puede haber parámetros declarados aún no usados.
- El orden de las definiciones de `parameters` no tiene significado canónico; sólo puede servir a la edición o presentación.
- Dentro de un mismo `Prompt`, cada clave de `parameters` tiene como máximo una definición canónica.
- Esas claves se expresan como slugs estables en minúsculas con formato `snake_case`.
- Para claves canónicas, la presentación humana se deriva del vocabulario compartido y de la UI; el portable sólo conserva ayuda authored opcional cuando aporta contexto real.
- Si una clave custom acaba siendo cubierta por una clave canónica equivalente, la clave canónica desplaza a la custom y esta última queda en estado legacy/migrable.
- Esa transición admite compatibilidad temporal de lectura, pero la representación portable se normaliza a la clave canónica al guardar.
- Mientras una clave siga siendo custom, debe incluir al menos una descripción o intención authored breve que explicite su significado local.
- Si existe cercanía semántica con una clave canónica, la extensión puede declarar opcionalmente ese vínculo como puente explícito hacia el vocabulario compartido.
- Cuando ese vínculo existe, apunta como máximo a una sola clave canónica próxima.
- El vocabulario canónico de `Prompt.parameters` es global por defecto y sólo restringe aplicabilidad cuando existe una razón semántica real.
- Cuando una clave declara aplicabilidad restringida, esa restricción es efectiva y no meramente orientativa.
- Los labels visibles, ayudas de UI y traducciones asociados a claves o tokens de `Prompt.parameters` pertenecen a presentación; la identidad contractual vive en la key o token portable estable.
- En `Note`, campos de workflow como `status`, `priority` o `presetId` quedan fuera de la representación portable/authored inicial y pertenecen a la capa operativa del producto.
- Fuera de ese descarte, `Note` no introduce campos authored específicos propios en la primera versión: usa núcleo compartido más cuerpo Markdown.
- `Wildcard` usa un único archivo con cabecera mínima gobernada y cuerpo line-based simple.
- En `Wildcard`, el contrato portable inicial es plano y standalone; jerarquías authored como `parentId` o `children` quedan fuera hasta nueva decisión explícita.
- En esa primera versión, `Wildcard` tampoco introduce campos authored específicos propios más allá del núcleo compartido; su valor distintivo reside en el cuerpo line-based.
- El campo humano visible canónico compartido en la representación portable es `title`; cualquier `name` legacy queda como alias de adaptación y no como parte del contrato futuro.
- El campo corto canónico compartido para resumen o abstract es `summary`; cualquier `description` legacy queda como alias de adaptación y no como parte del contrato futuro.
- `category` forma parte del núcleo authored compartido, pero sólo como clasificación liviana y local del artefacto; no reemplaza a `Tag` ni a la clasificación relacional global.
- `emoji` y `color` pueden vivir en la representación portable sólo como hints authored opcionales de presentación compartidos, no como parte del núcleo semántico mínimo.
- Cambios en `title`, `summary`, `category`, `emoji` o `color` no alteran por sí mismos la identidad del artefacto mientras su semántica de dominio siga siendo la misma.
- `featuredImage` queda fuera de la representación portable y de la metadata authored; si el producto necesita media destacada canónica, debe modelarse como relación o selección explícita hacia un `Asset`.
- `isFavorite` queda fuera de la representación portable y de la metadata authored; sigue perteneciendo a la capa relacional u operativa del producto.
- La pertenencia canónica a `Tag` sigue viviendo en la capa relacional compartida; cualquier nombre o slug de tag presente en el archivo portable sólo actúa como hint de autoría o importación, no como verdad final.
- La identidad del artefacto es estable e independiente de la ruta física, viaja con la representación portable del propio artefacto y no depende del filename para existir.
- El nombre visible canónico es authored y no depende obligatoriamente del nombre físico del archivo.
- La app sigue siendo editor de autoría de primer nivel: en modo file-backed escribe al archivo canónico y luego refresca o reindexa su capa derivada.
- La persistencia del archivo canónico se confirma mediante una acción explícita de guardar; cualquier autosave futuro sería auxiliar/local, no commit canónico en cada pulsación.
- Si un archivo canónico cambia fuera de la app, el archivo gana para el contenido authored; sólo hay conflicto cuando existen cambios locales pendientes sin sincronizar.
- Los artefactos file-backed viven bajo raíces canónicas por familia; si entran archivos externos, el comportamiento preferido es adoptarlos dentro de esa casa oficial. El enlace in-place sólo existe como modo explícito y secundario.
- Externalizar `Prompt` o `Note` a file-backed se considera una maduración estable del backing mode; volver a inline no forma parte del flujo normal y, si alguna vez existe, será una migración o escape hatch explícito.
- El modelo inicial no incorpora versionado explícito de dominio para estos artefactos.
- `Prompt` y `Note` no poseen paquetes locales de adjuntos como parte normal de su identidad canónica inicial; si necesitan referenciar media, lo hacen mediante relaciones con `Assets` o enlaces explícitos.
- La búsqueda normal del producto opera sobre una proyección derivada mantenida por la app, no leyendo el filesystem en vivo en cada consulta.
- La metadata authored del archivo se mantiene en un set pequeño y gobernado de campos; cualquier extensión futura debe aparecer mediante un mecanismo explícito y acotado.

## Se evita

- convertir file-backed en una doble verdad entre archivo y base de datos,
- reducir la app a panel de metadata con vocación de lanzador externo,
- dejar la identidad secuestrada por el path o el filename,
- abrir frontmatter/header como bolsa libre de claves sin contrato,
- convertir `Prompt` o `Note` en mini paquetes opacos de archivos que compitan con `Media Core`,
- y tratar el backing mode como un toggle trivial de ida y vuelta.

## Consecuencias

- La app necesita una capa explícita de escritura file-backed, sincronización e indexación derivada.
- La UX de edición debe seguir apoyándose en guardar explícito hacia el archivo canónico.
- La búsqueda, los listados y las relaciones seguirán siendo operacionales y rápidas gracias a proyecciones derivadas, sin traicionar la primacía del archivo.
- La estructura de bibliotecas de `Taxonomy` pasa a ser parte importante del diseño del producto.
- Si en el futuro aparecen paquetes con adjuntos, versionado explícito o metadata authored mucho más rica, hará falta una decisión adicional y no una extensión silenciosa de este contrato.
