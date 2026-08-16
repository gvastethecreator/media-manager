# Image Manager

Image Manager es un producto centrado en gestión de activos multimedia, con contextos explícitos para el núcleo media, la capa de worldbuilding y la plataforma operativa. El worldbuilding enriquece los activos, pero no redefine el núcleo del producto.

## Language

**Media Manager**:
El producto central que gestiona activos multimedia a partir de archivos y metadatos.
_Avoid_: creative suite, knowledge base, CMS generalista

**Media Core**:
El contexto que define la ingesta, organización, búsqueda, preview y recuperación de **Assets**.
_Avoid_: worldbuilding, sistema completo, app entera

**Taxonomy**:
El subdominio compartido que aporta clasificación y vocabulario transversal sin convertirse en un contexto principal del producto.
_Avoid_: cuarto contexto principal, platform/system, worldbuilding-only

**Prompt**:
Un artefacto creativo, semántico, textual y standalone de **Taxonomy** reutilizable por **Media Core** y **Worldbuilding Context**, vinculable a múltiples objetos sin convertirse en una **Narrative Entity** y enriquecible con metadata opcional; en modo file-backed usa Markdown con metadata authored en frontmatter.
_Avoid_: character, place, tool puramente técnica

**Note**:
Un artefacto transversal, textual y standalone de conocimiento y anotación de **Taxonomy**, reutilizable por varios contextos y vinculable a múltiples objetos sin convertirse en una **Narrative Entity**; en modo file-backed usa Markdown con metadata authored en frontmatter.
_Avoid_: entity narrativa, comentario efímero, tool sólo operativa

**Wildcard**:
Un patrón o token standalone y reutilizable de **Taxonomy** pensado para expansión semántica o combinatoria sin convertirse en una **Narrative Entity**, cuya fuente de autoría en la arquitectura objetivo es un archivo único con cabecera mínima portable y cuerpo line-based simple, inicialmente con una entrada por línea, sin dejar de ser un artefacto semántico.
_Avoid_: entity narrativa, organizer, tool puramente técnica

**Property**:
Una definición reusable y global de atributo o faceta del dominio que describe objetos sin actuar como contenedor ni como simple etiqueta, que idealmente aporta un tipo de valor claro, puede acotarse por aplicabilidad y puede declarar opcionalmente un conjunto controlado de valores permitidos, siendo global por defecto dentro de su perímetro permitido y restringible explícitamente cuando haga falta.
_Avoid_: tag indiferenciado, nota, campo técnico aislado

**Property Assignment**:
La aplicación explícita y transversal de una **Property** global sobre un objeto concreto del dominio, donde vive el valor real y existe como máximo una asignación por par objeto-propiedad; si el valor necesita multiplicidad, esa multiplicidad vive dentro de la asignación y no en filas duplicadas.
_Avoid_: definición global, duplicado semántico, key/value suelto por tabla

**Relation Role**:
Una etiqueta semántica opcional y gobernada que explica cómo se relacionan dos objetos sin volver obligatoriamente complejas todas las relaciones, usando un vocabulario global, pequeño y extendible de forma explícita, con lectura canónica forward, lectura inverse opcional y aplicabilidad acotable por familias o tipos cuando haga falta.
_Avoid_: tipo obligatorio en todo vínculo, enlace completamente opaco, texto libre por fila

**Semantic Relation**:
Un vínculo semántico transversal y genérico entre dos objetos del dominio, dirigido por defecto y opcionalmente enriquecido con **Relation Role**, sin reemplazar las relaciones estructurales fuertes del modelo.
_Avoid_: containment, ownership, specialization, enlace ambiguo sin dirección

**Asset**:
Un objeto canónico de media administrado por el sistema como unidad principal del producto, distinto de su **Source File** físico y soportado por una raíz persistente común en la arquitectura objetivo.
_Avoid_: entity, content, attachment

**Asset Identity**:
El identificador estable de un **Asset** independiente de su ubicación actual o de su huella de contenido.
_Avoid_: path, hash, nombre de archivo

**Asset Specialization**:
Una variante de **Asset** que se apoya en una raíz común delgada pero real y añade metadata, preview o tooling específico por tipo de medio.
_Avoid_: dominio totalmente separado, entity sin base común

**Source File**:
Un archivo durable que actúa como origen físico canónico de un **Asset** sin confundirse con la identidad del objeto de producto y que, en el modelo base, coincide conceptualmente con su **Primary Placement**.
_Avoid_: cache, thumbnail, preview, derivado

**Media Root**:
Un perímetro físico estable de biblioteca que permite identificar y volver a vincular **Source Files** mediante una referencia opaca y rutas relativas, sin convertir su path absoluto actual en identidad de los assets.
_Avoid_: folder, path absoluto como identidad, permiso implícito

**Source Availability**:
El estado observable de acceso al soporte físico de un **Source File**, separado del lifecycle de su **Asset** y capaz de expresar disponibilidad, ausencia, root offline o acceso denegado sin borrar el objeto de producto.
_Avoid_: asset status, processing status, existencia del asset

**Primary Placement**:
El placement o source físico principal y canónico que ancla operativamente a un **Asset** en el modelo base, sin definir por eso su identidad, coincidiendo conceptualmente con `Source File` mientras no exista una necesidad real de separar capas.
_Avoid_: identidad del asset, mirror equivalente por defecto, copia secundaria implícitamente canónica

**Secondary Placement**:
Un placement físico adicional, explícito y subordinado al **Primary Placement** de un **Asset**, que representa otra materialización durable de la misma identidad sin nacer por heurísticas automáticas como coincidencia de fingerprint o path.
_Avoid_: duplicate candidate automático, primary placement alternativo, equivalencia implícita por defecto

**Ingestion Channel**:
La vía por la que un **Source File** entra al sistema sin convertirse por sí misma en una especie paralela de dominio.
_Avoid_: tipo de asset separado, dominio paralelo

**Derived Artifact**:
Un resultado generado desde un **Asset** para visualización, análisis u operación, sin reemplazar su **Source File**.
_Avoid_: original, asset primario, fuente de verdad

**Content Fingerprint**:
La huella de contenido que expresa equivalencia material entre archivos sin definir la identidad del **Asset**.
_Avoid_: asset id, path, nombre canónico

**Duplicate Candidate**:
Un **Asset** que comparte **Content Fingerprint** con otro **Asset** sin perder su propia **Asset Identity**.
_Avoid_: mismo asset, alias automático, fusión implícita

**Version History**:
El registro explícito y opcional de estados anteriores de un **Asset**, sin asumirse por cada cambio de contenido.
_Avoid_: clon implícito, duplicado automático, historial obligatorio

**Organizer**:
Una estructura que agrupa, clasifica o ubica **Assets** sin convertirse en un **Asset**.
_Avoid_: asset, content type, media item

**Folder**:
Un **Organizer** físico cuya semántica principal es ubicar **Assets** en la jerarquía del filesystem, aunque pueda tener metadata de la app.
_Avoid_: album, collection, group libre

**Album**:
Un **Organizer** orientado a presentar y curar visualmente **Assets** en una experiencia editorial o de galería, con membresía directa restringida a **Assets**.
_Avoid_: collection genérica, folder, tag

**Collection**:
Un **Organizer** transversal que agrupa principalmente **Assets** por criterio temático o funcional más allá de la pura presentación visual, sin ocupar por defecto el rol de cluster heterogéneo reservado a **Group**.
_Avoid_: album visual, folder físico, tag simple

**Tag**:
Un clasificador semántico global y transversal que etiqueta objetos de dominio sin actuar como contenedor principal y puede vivir en una jerarquía ligera con categoría o aplicabilidad opcional.
_Avoid_: collection, group, album

**Favorite**:
Un marcador transversal, scoped al actor o perfil activo, que destaca un objeto de dominio sin convertirlo en un **Organizer** ni en una categoría propia, y cuya verdad canónica debe modelarse como relación transversal.
_Avoid_: asset, organizer, bucket de contenido

**Group**:
Un **Organizer** transversal y heterogéneo que puede reunir **Assets**, otros **Organizers** y **Narrative Entities** sin implicar ubicación física ni permisos de acceso.
_Avoid_: access group, user group, favorite bucket

**Narrative Entity**:
Un objeto del **Worldbuilding Context** que representa significado narrativo y puede relacionarse con **Assets** u **Organizers** sin poseerlos.
_Avoid_: asset, organizer, system record

**World Item**:
Una **Narrative Entity** residual y controlada para elementos del mundo que no encajan bien en `Character`, `Place` o `Concept`, sin convertirse en un bucket libre por defecto.
_Avoid_: misc genérico, cajón de sastre narrativo

**Worldbuilding Context**:
El contexto opcional que modela conceptos narrativos y los relaciona con **Assets** sin convertirse en el núcleo del producto.
_Avoid_: segundo núcleo, producto principal

**Platform/System Context**:
El contexto que soporta operación del producto mediante settings, observabilidad, colas, thumbnails, reindexado y procesos transversales.
_Avoid_: lógica de negocio principal, dominio creativo

**App Shell**:
La composición raíz visible del runtime que ensambla navegación principal, layout base, boundaries globales y capacidades transversales sin apropiarse de la semántica de negocio.
_Avoid_: feature view, contexto de dominio, provider bundle accidental

**Global Provider**:
Un mecanismo de composición del runtime que inyecta capacidades transversales como theme, feedback, query, transitions o settings sin convertirse en dueño del significado de **Asset**, **Organizer**, **Narrative Entity** o artefactos de **Taxonomy**.
_Avoid_: service locator semántico, owner de negocio, módulo feature disfrazado

**Operational Profile**:
La superficie activa de configuración y preferencias asociada a una instalación, usuario o perfil operativo que scopa experiencia y comportamiento del runtime sin redefinir la identidad de los objetos de dominio.
_Avoid_: narrative entity, role de negocio, taxonomía local

**Platform Process**:
Un workflow operativo transversal orquestado por **Platform/System Context** —como reindexado, generación de thumbnails, sincronización, observabilidad o cache operativo— que actúa sobre objetos de dominio sin convertirse en su modelo semántico.
_Avoid_: lifecycle de asset, feature de negocio principal, identidad del objeto

**Task**:
Un objeto operativo interno legacy de trabajo o workflow que gestiona estado, prioridad, progreso y asignación sin pertenecer al lenguaje de **Taxonomy** ni al núcleo visible del producto, y que queda fuera de la arquitectura objetivo salvo que reaparezca un caso de uso fuerte.
_Avoid_: tag, note, narrative entity

## Relationships

- El **Media Manager** administra muchos **Assets**
- Un **Asset** posee una **Asset Identity** estable
- Un **Asset** puede tener un nombre o título visible canónico separado del nombre físico de su archivo
- Ese nombre o título visible canónico puede ser opcional al inicio; mientras falte, la operación puede usar fallback al nombre físico sin confundirlos conceptualmente
- Un **Asset** se expresa mediante exactamente una **Asset Specialization** principal a la vez
- La raíz común de un **Asset** puede incluir lifecycle y estado operativo ligero cuando sean realmente transversales
- La raíz común de un **Asset** puede referenciar directamente su **Primary Placement** mediante un identificador explícito
- La raíz común de un **Asset** puede incluir un set pequeño de estados de lifecycle visibles para usuario cuando expresen semántica real del producto
- La raíz común de un **Asset** debe llevar un `assetType` explícito, consistente con su única especialización principal
- La raíz común de un **Asset** puede nacer temprano durante la ingesta, antes de completar toda la metadata especializada
- El set inicial de lifecycle visible de un **Asset** se limita a `active`, `archived` y `deleted`
- El lifecycle visible de un **Asset** debe modelarse como un único `status` canónico y no como flags combinables
- Flags como `hidden` o `public` no pertenecen al lifecycle canónico de **Asset**
- Estados de procesamiento como `pending`, `processing`, `completed` o `failed` no forman parte del lifecycle canónico de **Asset**
- Estado de cola, reindexado, thumbnails, extracción, transcodificación o sincronización no pertenece por defecto a la raíz de **Asset** salvo que el producto lo eleve explícitamente a semántica visible y transversal
- La raíz común de un **Asset** puede guardar timestamps explícitos de lifecycle como `archivedAt` o `deletedAt` cuando esas transiciones ocurran
- En el lifecycle visible de **Asset**, `deleted` significa borrado lógico o tombstone, no purge físico definitivo
- Mientras no exista purge físico, el estado `deleted` de un **Asset** debe ser restaurable
- Al restaurar un **Asset** desde `deleted`, debe recuperarse el último estado no borrado si se conoce; en caso contrario, vuelve a `active`
- El **Media Core** administra muchos **Assets**
- La arquitectura objetivo da a **Asset** una raíz persistente común y separada de sus especializaciones
- Un **Asset** se origina en un **Source File** durable
- Un **Asset** tiene un **Primary Placement** o source principal canónico en el modelo base
- En el modelo base, **Source File** y **Primary Placement** pertenecen a la misma capa conceptual y estructural
- Un **Media Root** conserva una identidad estable aunque su base física necesite aprobación o re-vinculación posterior
- La ubicación canónica de un **Source File** se expresa como **Media Root** más ruta relativa, no como path absoluto de identidad
- La ruta relativa canónica usa `/`, no admite absolutos, prefijos de drive, traversal, NUL ni tipos SQLite no textuales;
  la identidad locacional es case-insensitive para no crear aliases incompatibles con Windows
- Un **Source File** expresa origen físico o ubicación operativa sin definir la **Asset Identity**
- **Source Availability** no cambia por sí sola el lifecycle del **Asset**
- Si un **Source File** desaparece o su root queda offline, el **Asset**, su metadata authored y sus relaciones sobreviven; el source queda preservado como no disponible hasta reconciliación o purge explícito
- La metadata authored pertenece al **Asset** o a su especialización y no se sobrescribe durante reindexado
- La metadata derivada pertenece al fingerprint/observación del **Source File**, es reconstruible y debe invalidarse cuando cambia su contenido material
- El **Content Fingerprint** vive canónicamente en **Source File** o **Primary Placement**, no en la identidad raíz del **Asset**
- El **Content Fingerprint** persistente es SHA-256 hexadecimal lowercase y el tamaño persistente es un entero de bytes;
  SQLite no puede aceptar BLOB/REAL por afinidad implícita en estos campos
- La pertenencia física de un **Asset** a un **Folder** vive en **Primary Placement** o **Source File**, no en la raíz del asset
- Un **Asset** puede tener exactamente un **Primary Placement** y cero o más **Secondary Placements** explícitos
- Los placements físicos adicionales de un **Asset** sólo existen si se modelan explícitamente y no como equivalentes por defecto del **Primary Placement**
- Un placement físico secundario del mismo **Asset** sólo es válido cuando existe una decisión o modelado explícito que una ambas materializaciones bajo la misma identidad
- Un **Ingestion Channel** introduce **Source Files** al sistema sin redefinir el modelo de **Asset**
- Un **Asset** puede cambiar de ubicación sin perder su **Asset Identity**
- Un **Content Fingerprint** puede coincidir entre distintos **Assets**
- Un **Asset** puede cambiar de **Content Fingerprint** con el tiempo sin perder su **Asset Identity**
- Dos **Assets** pueden ser **Duplicate Candidates** entre sí sin fusionarse automáticamente
- Si aparece otro archivo físico con el mismo contenido, el comportamiento por defecto es crear otro **Asset** y tratarlo como **Duplicate Candidate**, no sumarlo automáticamente como placement secundario
- Un **Asset** puede producir muchos **Derived Artifacts**
- Un **Organizer** agrupa, clasifica o ubica muchos **Assets** sin cambiar su naturaleza
- Un **Folder** ubica **Assets** en una jerarquía física
- Un **Album** presenta y cura **Assets** para consumo visual
- Una **Collection** agrupa elementos por criterio temático o funcional
- Un **Tag** clasifica objetos de dominio de forma transversal
- Un vocabulario cerrado no implica por sí solo una **Property**; si el significado central es pertenencia clasificatoria, sigue perteneciendo a **Tag**
- El perímetro inicial de **Tag** incluye **Assets**, **Organizers**, **Narrative Entities**, **Prompt**, **Note** y **Wildcard**
- **Tag** debe tener un identificador portable estable separado de su label visible humano
- El identificador portable de **Tag** debe expresarse como slug estable en minúsculas con formato `snake_case`
- El slug portable de **Tag** se trata como identidad estable y sólo debe renombrarse mediante migración explícita
- El label visible humano de **Tag** pertenece a presentación/editorial y puede cambiar sin migración mientras el significado del tag siga siendo el mismo
- La `category` opcional de **Tag** actúa como agrupación liviana y no forma parte de la identidad ni del namespace del tag
- El slug de **Tag** es globalmente único y no puede duplicarse válidamente en categorías distintas
- La jerarquía ligera de **Tag** admite como máximo un solo padre por tag y no multiparent por defecto
- La jerarquía de **Tag** prohíbe ciclos de forma absoluta
- Si dos **Tag** se fusionan semánticamente y uno absorbe al otro, el tag absorbido queda en estado legacy/deprecated en lugar de desaparecer como si nunca hubiese existido
- Cuando un **Tag** deprecated por fusión tenga sucesor semánticamente claro, puede declarar como máximo un único tag de reemplazo explícito
- Un **Tag** deprecated sigue siendo legible para historia y compatibilidad transitoria, pero no debe aceptarse en nuevas asignaciones normales
- Si una asignación legacy usa un **Tag** deprecated con reemplazo explícito equivalente, al guardar debe normalizarse por defecto al tag vigente
- El slug histórico de un **Tag** deprecated o absorbido queda reservado y no debe reutilizarse para otro tag nuevo con semántica distinta
- Un **Tag** deprecated o absorbido no debe seguir actuando como padre válido de tags activos; sus hijos requieren reparenting explícito hacia jerarquía vigente
- Si un **Tag** declara aplicabilidad restringida, asignarlo fuera de ese perímetro es inválido y no una mera advertencia blanda
- En una jerarquía ligera de **Tag**, asignar un tag hijo no materializa automáticamente la asignación de sus ancestros
- En una misma rama jerárquica de **Tag**, asignar directamente a la vez un descendiente y su ancestro sobre el mismo objeto es redundante e inválido por defecto
- Si un **Tag** cambia de padre, sus asignaciones existentes siguen siendo válidas por defecto; el reparenting ajusta la estructura taxonómica y no reescribe automáticamente la clasificación histórica
- Si un reparenting de **Tag** crea nuevas redundancias ancestro-descendiente en asignaciones existentes, el sistema debe detectarlas para cleanup explícito y no resolverlas mediante borrado silencioso
- La pertenencia de un objeto a un **Tag** pertenece canónicamente a la capa relacional compartida y no a metadata authored portable incrustada en archivos
- Un **Favorite** marca un objeto de dominio sin cambiar su identidad ni su tipo
- La verdad canónica de **Favorite** debe vivir en una relación transversal y no en flags embebidos por entidad
- El scope contractual de **Favorite** pertenece al actor o perfil que marca el objeto y no al objeto marcado como propiedad global intrínseca
- El perímetro inicial recomendado de **Favorite** incluye **Assets**, **Organizers**, **Narrative Entities**, **Prompt**, **Note**, **Wildcard**, **Tag** y **Property**; `Task` queda fuera por ahora
- La unicidad lógica de **Favorite** debe impedir más de una relación activa equivalente por par `(actor, target)`
- Las operaciones de marcar o desmarcar **Favorite** deben ser idempotentes y no generar duplicados ni semánticas alternativas según el estado previo
- **Favorite** no define un lifecycle semántico rico propio en v1; su visibilidad normal sigue la superficie activa del target marcado
- Si el target de un **Favorite** sale de la superficie activa por borrado lógico o tombstone, el favorito deja de mostrarse en consultas normales pero puede reaparecer si el target se restaura
- Si el target de un **Favorite** se purga físicamente, la relación `Favorite` deja de existir como vínculo preservable
- Un **Group** puede reunir **Assets**, **Organizers** y **Narrative Entities** de forma transversal
- **Taxonomy** sirve como lenguaje compartido para **Media Core** y **Worldbuilding Context**
- Un **Prompt** puede relacionarse con **Assets** y **Narrative Entities** sin convertirse en una de ellas
- El contrato file-backed inicial de **Prompt** puede admitir una capa authored específica pequeña y gobernada además del núcleo compartido, sin heredar por ello todo el shape legacy existente
- En el contrato file-backed inicial de **Prompt**, la capa específica mínima acordada se centra en `purpose` y `parameters`; otros campos legacy más granulares quedan fuera hasta nueva decisión
- En ese contrato inicial, `parameters` debe vivir como bloque authored estructurado y gobernado, no como mapa JSON libre sin contrato semántico
- La forma inicial de `parameters` en **Prompt** debe ser un bloque de entradas tipadas y gobernadas, no un set rígido de campos atado a un runtime concreto ni un mapa arbitrario
- En esa primera versión, los valores de `parameters` en **Prompt** se limitan a escalares y listas planas de escalares; no se admiten objetos anidados arbitrarios
- En **Prompt**, las claves de `parameters` deben apoyarse en un vocabulario canónico curado, permitiendo extensiones custom sólo como escape hatch explícito y distinguible
- Cuando una entrada de `parameters` en **Prompt** sea custom, esa condición debe expresarse mediante metadata explícita separada de la clave y no mediante prefijos mágicos incrustados en el nombre
- El vocabulario canónico de `parameters` en **Prompt** debe nacer con un seed mínimo real desde el inicio y no quedar vacío como intención futura
- Ese seed inicial de `parameters` en **Prompt** debe ser semántico y portable, no un catálogo base de knobs técnicos atados a herramientas o modelos concretos
- La exclusión de campos legacy del top-level de **Prompt** no impide que algunos conceptos reaparezcan como claves canónicas de `parameters`, siempre que aporten semántica portable real
- El seed canónico inicial de `parameters` en **Prompt** arranca con `subject`, `context`, `tone`, `style` y `constraints`
- Las claves canónicas de `parameters` en **Prompt** son identificadores estables del contrato portable; la localización pertenece a etiquetas de UI y no al nombre portable de la clave
- En **Prompt**, `parameters` representa la definición de variables del template y no un set canónico de valores concretos de una ejecución particular
- Una definición de parámetro en **Prompt** puede incluir un default o example authored opcional, siempre que no se confunda con un valor canónico de ejecución
- Cada parámetro de **Prompt** debe declarar explícitamente su tipo esperado y no dejarlo implícito sólo por ejemplo, default o uso informal
- El vocabulario de tipos para parámetros de **Prompt** debe arrancar con un seed inicial pequeño y explícito, no quedar abierto como abstracción vacía
- El seed inicial de tipos para parámetros de **Prompt** arranca con `text`, `number`, `boolean`, `date` y `enum_token`
- La multiplicidad de un parámetro de **Prompt** se modela como wrapper genérico sobre el tipo base y no como una familia aparte de tipos especiales
- Si un parámetro de **Prompt** usa `enum_token`, debe declarar o referenciar explícitamente el vocabulario válido de tokens
- Cuando un parámetro de **Prompt** usa `enum_token`, sus tokens válidos se expresan como slugs estables en minúsculas con formato `snake_case`, separados de sus labels visibles humanos
- Los labels visibles de tokens `enum_token` en **Prompt.parameters** pertenecen a presentación/localización y pueden refinarse sin migración mientras el token conserve el mismo significado
- Los tipos primitivos compartidos de **Prompt.parameters** reutilizan por defecto la misma semántica base acordada para **Property Assignment**, salvo decisión explícita en contra
- Cuando un parámetro de **Prompt** usa una clave canónica del vocabulario compartido, el tipo base de ese parámetro queda gobernado por la definición canónica y no se redefine libremente por artefacto
- Cuando un parámetro de **Prompt** usa una clave canónica del vocabulario compartido, la cardinalidad base de ese parámetro también queda gobernada por la definición canónica
- Dentro del seed canónico inicial de **Prompt.parameters**, `subject` nace como parámetro escalar de tipo `text`
- Dentro del seed canónico inicial de **Prompt.parameters**, `context` nace como parámetro escalar de tipo `text`
- Dentro del seed canónico inicial de **Prompt.parameters**, `tone` nace como parámetro escalar de tipo `enum_token`
- Dentro del seed canónico inicial de **Prompt.parameters**, `style` nace como parámetro multivalue con tipo base `enum_token`
- Dentro del seed canónico inicial de **Prompt.parameters**, `constraints` nace como parámetro multivalue con tipo base `text`
- Las claves canónicas `tone` y `style` de **Prompt.parameters** se apoyan por defecto en vocabularios compartidos entre prompts y no en catálogos locales por artefacto
- Cuando una clave canónica de **Prompt.parameters** usa vocabulario compartido, un prompt concreto puede restringirlo a un subconjunto local pero no ampliarlo con tokens fuera de ese vocabulario
- Los parámetros multivalue de **Prompt** se comportan por defecto como colección sin orden y sin duplicados, salvo decisión explícita en contra
- Los hints o widgets de UI para parámetros de **Prompt** pertenecen a metadata opcional de presentación y no forman parte del contrato semántico base
- Cada parámetro de **Prompt** debe declarar explícitamente si es requerido u opcional y no dejar esa condición a inferencia por default, placeholder o costumbre
- En **Prompt.parameters**, la presencia de un default no altera por sí sola la requiredness explícita del parámetro
- En **Prompt**, todo placeholder usado en el contenido debe corresponder a un parámetro declarado; en cambio, un parámetro declarado puede existir aunque todavía no aparezca en el contenido
- Si un parámetro de **Prompt** es requerido pero no aparece consumido en el contenido, ese estado es inválido por defecto
- En **Prompt**, el orden de las entradas de `parameters` no tiene significado canónico; como mucho, pertenece a authoring o presentación
- En **Prompt**, cada clave de `parameters` puede tener como máximo una definición canónica dentro del mismo artefacto
- Las claves canónicas de `parameters` en **Prompt** usan slugs estables en minúsculas con formato `snake_case`
- Para claves canónicas de `parameters` en **Prompt**, la presentación humana se deriva del vocabulario compartido y de la UI; el portable sólo transporta ayuda authored opcional cuando agrega contexto real
- Si una clave custom de `parameters` en **Prompt** colisiona semánticamente con una clave canónica posterior, la clave canónica desplaza a la custom equivalente y la custom pasa a estado legacy/migrable
- Cuando una clave custom de `parameters` en **Prompt** migra hacia una clave canónica equivalente, la transición admite compatibilidad temporal de lectura, pero la representación portable se normaliza a la clave canónica al guardar
- Si una clave custom de `parameters` en **Prompt** migra hacia una canónica pero cambia tipo base o cardinalidad, esa normalización requiere migración explícita y no una fusión silenciosa
- Cuando una clave de `parameters` en **Prompt** sea custom, debe llevar al menos una descripción o intención authored breve que haga explícito su significado local
- Las claves custom de **Prompt.parameters** usan el mismo vocabulario de tipos compartido y no inventan tipos privados por fuera del contrato general
- Si una clave custom de **Prompt.parameters** usa `enum_token`, puede declarar su vocabulario válido de tokens localmente en el prompt y no necesita nacer como vocabulario compartido global
- Cuando una clave de `parameters` en **Prompt** sea custom y exista cercanía semántica con una clave canónica, puede declarar opcionalmente esa relación como puente explícito hacia el vocabulario compartido
- Cuando una clave custom de `parameters` en **Prompt** declare cercanía con el vocabulario canónico, esa afinidad opcional apunta como máximo a una sola clave canónica próxima
- El vocabulario canónico de `parameters` en **Prompt** es global por defecto y sólo restringe aplicabilidad cuando existe una razón semántica real
- Cuando una clave canónica de `parameters` en **Prompt** declara aplicabilidad restringida, esa restricción es real y no meramente orientativa
- En **Prompt**, `summary` y `purpose` no son sinónimos: `summary` resume el artefacto y `purpose` expresa su intención de uso
- En **Prompt**, `purpose` pertenece a la capa específica mínima acordada y debe contener intención de uso authored no vacía en la representación portable canónica
- El cuerpo authored canónico de **Prompt** debe tener contenido no vacío; un template totalmente en blanco no es estado válido del artefacto portable
- En **Prompt**, `parameters` puede omitirse por completo cuando el template no expone variables reales y no necesita contrato paramétrico
- Una **Note** puede anotar **Assets**, **Organizers** y **Narrative Entities** sin poseerlos
- En `Note` file-backed, campos de workflow como `status`, `priority` o `presetId` pertenecen a la capa operativa del producto y no a la representación portable authored por defecto
- En su contrato file-backed inicial, **Note** no necesita campos authored específicos propios más allá del núcleo compartido y el cuerpo Markdown
- El cuerpo authored canónico de **Note** debe tener contenido no vacío; una note totalmente en blanco no es estado válido del artefacto portable
- Un **Wildcard** puede reutilizarse en varios contextos como patrón semántico o combinatorio
- En el contrato file-backed inicial de **Wildcard**, la forma portable es plana y standalone; jerarquías authored como `parentId` o `children` quedan fuera hasta nueva decisión
- En esa primera versión, **Wildcard** no necesita campos authored específicos propios más allá del núcleo compartido y su cuerpo line-based simple
- En **Wildcard**, entradas duplicadas dentro del cuerpo line-based son inválidas y no contenido portable distinto
- En **Wildcard**, líneas vacías o compuestas sólo por whitespace no cuentan como entradas válidas y se normalizan fuera del contenido portable
- En **Wildcard**, las entradas válidas se normalizan recortando whitespace exterior antes de persistirse
- En `Wildcard` v1, la detección de duplicados respeta mayúsculas y minúsculas; dos entradas no colapsan sólo por diferir en casing
- El orden de las entradas de **Wildcard** no es semántico por defecto y pertenece a authoring o presentación
- En `Wildcard` v1, cada entrada line-based no lleva un identificador propio separado y se trata como entrada textual normalizada
- En `Wildcard` v1, una línea representa sólo una entrada textual y no admite sintaxis inline adicional de comentario o metadata por entrada
- Un **Wildcard** canónico debe conservar al menos una entrada válida tras la normalización; si el cuerpo queda efectivamente vacío, el artefacto no es válido
- Los artefactos textuales de **Taxonomy** pueden tener fuente canónica file-backed mientras la app gestiona metadata, indexación y relaciones
- Cuando un artefacto textual de **Taxonomy** es file-backed, el archivo es la fuente canónica de verdad y la base de datos actúa como índice, metadata y soporte relacional
- `Wildcard` es file-backed por defecto en la arquitectura objetivo
- `Prompt` y `Note` soportan modo file-backed fuerte, pero no necesitan ser obligatoriamente file-backed desde el minuto cero
- Cuando un artefacto textual de **Taxonomy** es file-backed, la base de datos no debe convertirse en espejo canónico del texto humano; sólo conserva metadata, estado de sincronización, hashes, excerpts e índices/caches derivados
- Si un `Prompt` o `Note` pasa de inline a file-backed, conserva la misma identidad de dominio; cambia su backing mode, no su identidad semántica
- En `Prompt` y `Note` file-backed, la metadata authored pertenece al archivo y la metadata operativa o relacional pertenece a la base de datos
- Los artefactos file-backed de **Taxonomy** deben vivir bajo raíces canónicas por familia; importar o enlazar archivos externos puede existir, pero no reemplaza esa casa oficial
- Cuando un artefacto textual externo se incorpora al sistema, el comportamiento preferido es adoptarlo en la raíz canónica; el enlace in-place queda como modo explícito y secundario
- Si un archivo canónico de `Prompt`, `Note` o `Wildcard` cambia fuera de la app, el archivo gana para el contenido authored y la app reindexa; sólo hay conflicto cuando existen cambios locales pendientes sin sincronizar
- En artefactos file-backed de **Taxonomy**, la identidad de dominio es estable e independiente de la ruta; mover o renombrar un archivo no crea otro artefacto
- Al eliminar un `Prompt`, `Note` o `Wildcard` file-backed desde la app, la semántica por defecto es borrado lógico/restaurable; el purge físico del archivo ocurre sólo como operación explícita posterior
- El modelo inicial de artefactos textuales file-backed de **Taxonomy** no incluye versionado explícito de dominio; sólo aparece si una necesidad fuerte futura lo justifica
- La identidad estable de un artefacto file-backed de **Taxonomy** debe viajar con su representación portable y no quedar secuestrada sólo en la base de datos
- En `Prompt`, `Note` y `Wildcard` file-backed, el nombre visible canónico es authored y no depende obligatoriamente del filename físico
- En artefactos file-backed de **Taxonomy**, cambios en `title`, `summary`, `category`, `emoji` o `color` no alteran la identidad del artefacto mientras su semántica de dominio siga siendo la misma
- En `Prompt`, `Note` y `Wildcard`, una media destacada canónica del producto debe resolverse como relación o selección explícita hacia un **Asset** y no como metadata authored portable embebida en el archivo
- Una **Property** describe atributos reutilizables de objetos del dominio
- Un mismo concepto semántico no debe canonizarse a la vez como **Tag** y como **Property** salvo distinción explícita y fuertemente justificada
- Una **Property** se usa cuando el dominio necesita expresar una faceta con valor tipado y gobernado, no cuando basta una pertenencia clasificatoria
- Una **Property** declara un tipo de valor preferente dentro de un set canónico y pequeño
- Una **Property** es global por defecto dentro de su perímetro permitido y sólo restringe aplicabilidad cuando exista una razón semántica real
- El slug portable de **Property** es globalmente único y no puede duplicarse válidamente bajo agrupaciones o categorías distintas
- La agrupación o categoría opcional de **Property** actúa como organización liviana de catálogo y no forma parte de su identidad ni de su namespace
- **Property** no admite jerarquía ni herencia entre properties en la primera versión; cada faceta canónica existe como definición plana e independiente
- Una **Property** puede declarar opcionalmente un conjunto controlado de valores permitidos cuando el dominio lo necesite
- Una **Property** deprecated sigue siendo legible para historia y compatibilidad transitoria, pero no debe aceptarse en nuevas asignaciones normales
- Cuando una **Property** deprecated tenga sucesora semánticamente clara, puede declarar como máximo una única property de reemplazo explícito
- Si una **Property Assignment** legacy usa una **Property** deprecated con reemplazo explícito equivalente, al guardar debe normalizarse por defecto a la property vigente
- La auto-normalización por reemplazo entre **Property** sólo es válida cuando vieja y nueva conservan compatibilidad semántica base, tipo de valor y cardinalidad portable
- La auto-normalización por reemplazo entre **Property** también exige compatibilidad de aplicabilidad; si el perímetro válido cambia materialmente, la migración debe ser explícita
- Si una **Property** varía tipo, cardinalidad o vocabulario controlado según el target, esa divergencia requiere properties distintas y no overrides locales del mismo contrato
- La identidad estable histórica de una **Property** retirada o deprecated —su key o slug portable— queda reservada y no debe reutilizarse para otra property nueva con semántica distinta
- Cuando una **Property** declara valores permitidos, cada opción de ese vocabulario debe tener un token estable separado del label visible
- Los labels visibles de los valores permitidos de una **Property** pertenecen a presentación/localización y pueden cambiar sin migración mientras el token conserve el mismo significado
- Los tokens de valores permitidos de una **Property** deben expresarse como slugs estables en minúsculas con formato `snake_case`
- Los tokens de valores permitidos de una **Property** se tratan como identidad estable y sólo deben renombrarse mediante migración explícita
- Los tokens de valores permitidos deben ser únicos dentro del vocabulario de la **Property** que los declara y no globalmente únicos por defecto entre todas las properties
- El orden de los valores permitidos de una **Property** no es semántico por defecto y pertenece a authoring o presentación
- Si una **Property** retira un valor permitido ya usado, los assignments existentes con ese token pasan a estado legacy/migrable y no permanecen como plenamente válidos del vocabulario vigente
- Si un valor permitido de una **Property** fue retirado, ese token puede seguir leyéndose en assignments legacy pero no debe aceptarse en nuevas escrituras ni regrabados normales
- Cuando un valor permitido deprecated de una **Property** tenga sucesor semánticamente claro, puede declarar como máximo un único token de reemplazo explícito para guiar migraciones
- Si un **Property Assignment** legacy usa un token deprecated con reemplazo explícito equivalente, al guardar debe normalizarse por defecto al token vigente y no perpetuar la escritura legacy
- Los valores concretos de **Property** deben vivir en asignaciones explícitas separadas de la definición global
- Una **Property Assignment** aplica una **Property** a un objeto concreto del dominio
- **Property Assignment** debe modelarse de forma transversal y no como dialectos separados por entidad o contexto
- El target inicial permitido de **Property Assignment** se limita a **Assets**, **Organizers** y **Narrative Entities**
- Un objeto del dominio puede tener como máximo una **Property Assignment** por cada **Property**
- Si una **Property Assignment** necesita varios valores, la multiplicidad vive dentro de la asignación y no como varias asignaciones duplicadas
- Cuando una **Property Assignment** es multivalor, esa multiplicidad se modela como wrapper genérico sobre el tipo base y no como una familia aparte de tipos ad hoc
- Si una **Property Assignment** es multivalor, se interpreta como set sin orden por defecto; el orden sólo existe cuando la **Property** lo declara explícitamente
- El valor de **Property Assignment** debe usar un set canónico y pequeño de tipos; el escape hatch tipo JSON sólo existe de forma controlada y excepcional
- El set canónico de tipos de valor de **Property Assignment** debe quedar definido explícitamente desde el arranque y no permanecer como abstracción vacía
- El seed inicial de tipos de valor de **Property Assignment** arranca con `text`, `number`, `boolean`, `date` y `enum_token`
- En **Property Assignment**, `enum_token` representa identificadores estables de vocabulario controlado y no labels humanos localizables
- En el seed inicial de **Property Assignment**, `date` representa primero una fecha-calendario semántica y no un contenedor genérico para instantes temporales arbitrarios
- En el seed inicial de **Property Assignment**, `number` permanece unificado y no se parte todavía en `integer` y `decimal`
- En **Property Assignment** multivalue, una colección vacía no representa un valor portable distinto sino ausencia de asignación
- En **Property Assignment** multivalue, el significado portable es una colección sin orden y no una lista ordenada por posición
- En **Property Assignment** multivalue, la colección portable no admite duplicados y se comporta semánticamente como un set
- En **Property Assignment** de tipo `text`, cadena vacía o compuesta sólo por whitespace significa ausencia de asignación y no valor portable autónomo
- En **Property Assignment** de tipo `boolean`, `false` es un valor portable válido y distinto de ausencia de asignación
- Cuando una **Property** declara vocabulario controlado, la representación preferente de su **Property Assignment** debe usar `enum_token` y no `text` libre validado externamente
- Cuando una **Property** numérica tiene una unidad semántica estable, esa unidad vive por defecto en la definición de la **Property** y no se repite en cada **Property Assignment**
- **Property Assignment** no usa `null` como valor portable; la ausencia de valor se expresa mediante ausencia de asignación o ausencia del valor efectivo dentro del contrato permitido
- Cuando **Property Assignment** usa el tipo `date`, su forma portable debe representarse como fecha ISO local `YYYY-MM-DD`
- Cuando **Property Assignment** usa `enum_token`, el identificador portable debe expresarse como slug estable en minúsculas con formato `snake_case`
- Cuando **Property Assignment** usa `number`, su forma portable debe ser un escalar numérico real y no una cadena formateada
- Cuando **Property Assignment** usa `text`, ese tipo representa texto escalar simple y no contenido rich text o Markdown
- Cuando una **Property Assignment** queda sin valor efectivo según las reglas del contrato, el estado normalizado correcto es eliminar la asignación y no persistir un cascarón vacío
- Cuando **Property Assignment** usa `number`, el valor permitido se restringe a números finitos reales y excluye `NaN`, `Infinity` y `-Infinity`
- Cuando **Property Assignment** usa `text`, la normalización portable recorta whitespace exterior antes de persistir el valor
- El set de tipos de valor de **Property Assignment** sólo puede expandirse mediante decisiones explícitas del vocabulario común y no por microtipos ad hoc definidos localmente por cada **Property**
- La **Property** define el tipo esperado del valor y cada **Property Assignment** debe ajustarse a ese contrato en vez de elegir su tipo localmente
- La **Property** define también la cardinalidad esperada del valor y cada **Property Assignment** debe respetar si la faceta es single-value o multivalue
- Si una **Property** declara aplicabilidad restringida, un **Property Assignment** fuera de ese perímetro es inválido y no una mera advertencia blanda
- Si una **Property** declara valores permitidos, un **Property Assignment** fuera de ese vocabulario es inválido y no una mera advertencia blanda
- Si una **Property** usa `enum_token`, debe declarar o referenciar explícitamente el vocabulario que gobierna esos tokens
- **Property Assignment** se reserva para facetas semánticas compartidas y no actúa por defecto como contenedor universal de metadata técnica extraída desde archivos
- **Property** debe tener un identificador portable estable separado de su label o título visible humano
- El identificador portable de **Property** debe expresarse como slug estable en minúsculas con formato `snake_case`
- El slug portable de **Property** se trata como identidad estable y sólo debe renombrarse mediante migración explícita
- El label o título visible de **Property** pertenece a presentación/editorial y puede cambiar sin migración mientras la faceta conserve el mismo significado
- Si el supuesto “valor” de una **Property Assignment** apunta a otro objeto del dominio, debe modelarse como relación explícita y no como property disfrazada
- Una **Task** pertenece al trabajo operativo del producto y no al vocabulario compartido de **Taxonomy**
- Los vínculos semánticos transversales entre objetos pueden modelarse mediante relaciones genéricas con **Relation Role** opcional
- Una **Semantic Relation** es dirigida por defecto
- La simetría de una **Semantic Relation** debe declararse explícitamente y no asumirse
- Una **Semantic Relation** debe almacenarse como una sola fila canónica; las vistas inversas se derivan y no se duplican por defecto
- Una **Semantic Relation** debe tener identidad propia estable y no depender sólo de una clave compuesta entre extremos o rol
- La unicidad lógica de **Semantic Relation** debe impedir duplicados del mismo triple canónico `(source, target, role)` respetando la dirección del vínculo
- El shape canónico inicial de **Semantic Relation** debe mantenerse mínimo y no incorpora todavía un campo libre de explicación o nota textual por relación
- Los timestamps y campos de auditoría de **Semantic Relation** pertenecen a metadata operativa y no forman parte del contrato semántico mínimo ni de la identidad lógica del vínculo
- La creación o reescritura de una **Semantic Relation** exige que ambos extremos existan y sean participantes válidos dentro del perímetro permitido en ese momento
- **Semantic Relation** no define en v1 un lifecycle semántico rico propio; su visibilidad normal sigue la superficie activa de sus extremos
- Si uno de los extremos de una **Semantic Relation** sale de la superficie activa por borrado lógico o tombstone, el vínculo deja de mostrarse en consultas normales pero se preserva para historia o restauración
- Si ese extremo se restaura y el otro sigue siendo válido, la **Semantic Relation** recupera por defecto su visibilidad normal
- Si un extremo se purga físicamente del dominio, las **Semantic Relation** dependientes dejan de existir como vínculos activos preservables
- El perímetro inicial de participantes de **Semantic Relation** incluye **Assets**, **Organizers**, **Narrative Entities**, **Prompt**, **Note** y **Wildcard**
- **Tag**, **Property**, **Favorite** y **Task** quedan fuera del perímetro inicial de **Semantic Relation**
- Las relaciones estructurales fuertes como containment, ownership o specialization deben seguir siendo dedicadas
- Una relación entre objetos puede tener un **Relation Role** opcional
- Cuando exista, **Relation Role** debe salir de un vocabulario gobernado y extendible, no de texto libre por relación
- El vocabulario inicial de **Relation Role** debe arrancar pequeño y con roles semánticamente fuertes, no como catálogo amplio desde el primer día
- El seed inicial de **Relation Role** debe centrarse primero en roles relacionales transversales y no en una colección temprana de matices editoriales o narrativos
- El seed inicial de **Relation Role** arranca con `references`, `inspired_by`, `derived_from` y `variant_of`
- Dentro de ese seed inicial, `variant_of` se define como rol simétrico para expresar parentesco lateral entre variantes y no derivación histórica
- Dentro de ese seed inicial, `references` se define como rol dirigido y no como vínculo recíproco por defecto
- Dentro de ese seed inicial, `inspired_by` y `derived_from` deben mantenerse separados: el primero expresa influencia y el segundo descendencia o transformación semántica más fuerte
- Todos los roles del seed inicial de **Relation Role** deben nacer con lectura inverse explícita además de su lectura forward canónica
- Todo **Relation Role** del vocabulario gobernado debe declarar lectura forward e inverse explícitas, aunque en algunos casos ambas coincidan
- **Relation Role** debe tener un identificador portable estable en `snake_case`, separado de sus lecturas humanas forward e inverse
- Dentro del seed inicial de **Relation Role**, las lecturas canónicas quedan fijadas como `references`/`referenced_by`, `inspired_by`/`inspires`, `derived_from`/`source_for` y `variant_of`/`variant_of`
- Las lecturas humanas forward e inverse de **Relation Role** pertenecen a presentación semántica y pueden refinarse sin migración mientras no cambie materialmente el significado del role
- El slug portable de **Relation Role** se trata como identidad estable y sólo debe renombrarse mediante migración explícita
- Si un **Relation Role** se depreca o reemplaza, las relaciones existentes que lo usan siguen siendo legibles como legacy, pero no deben crearse nuevas relaciones con ese role deprecated
- Cuando un **Relation Role** deprecated tenga sucesor semánticamente claro, puede declarar como máximo un único role de reemplazo explícito para guiar migraciones
- Si una **Semantic Relation** legacy usa un **Relation Role** deprecated con reemplazo explícito equivalente, al guardar debe normalizarse por defecto al role vigente y no perpetuar la escritura legacy
- Si un **Relation Role** declara aplicabilidad restringida por familias o tipos, usarlo fuera de ese perímetro es inválido y no una mera advertencia blanda
- En el seed inicial de **Relation Role**, la lectura inverse de `derived_from` debe expresar origen fuerte y no una relación blanda o genérica
- Un mismo par de objetos puede sostener varios **Relation Role** distintos siempre que cada uno aporte semántica realmente diferente
- Si entre dos objetos ya existe una **Semantic Relation** con `Relation Role` explícito que captura el significado, una relación adicional sin role equivalente no debe coexistir por defecto
- Si el significado de un vínculo encaja claramente en un **Relation Role** existente y aplicable, crear la **Semantic Relation** sin role es inválido y no sólo desaconsejado
- `variant_of` debe restringirse a objetos de la misma familia o de familias semánticamente muy cercanas
- Cuando existan incompatibilidades entre roles sobre el mismo par de objetos, esas restricciones deben declararse en el catálogo de **Relation Role** y no como reglas ad hoc dispersas
- `variant_of` y `derived_from` son incompatibles por defecto sobre el mismo par de objetos, salvo justificación excepcional explícita
- En la primera versión de **Semantic Relation**, esas excepciones no se modelan como overrides libres por instancia; si un caso recurrente necesita coexistencia, debe formalizarse ajustando el catálogo o sus reglas
- `derived_from` puede cruzar familias distintas cuando la derivación fuerte siga siendo semánticamente clara
- El subgrafo formado por relaciones `derived_from` debe permanecer acíclico; ni ciclos directos ni ciclos largos expresan una derivación semántica válida
- Dentro del seed inicial de **Relation Role**, `references` e `inspired_by` funcionan como los roles más ampliamente transversales del perímetro permitido
- Cuando exista, **Relation Role** debe poder expresar una lectura canónica forward y una lectura inverse opcional
- Cuando no aporte significado real, **Relation Role** debe quedar ausente y no degradarse a un comodín genérico como `related_to`
- El vocabulario de **Relation Role** debe ser global y compartido, aunque pueda restringirse por aplicabilidad según familias o tipos
- Cuando una relación sea simétrica, esa simetría debe declararse en la definición de **Relation Role** y no como flag ad hoc por fila
- Cuando un **Relation Role** es simétrico, la representación canónica de **Semantic Relation** debe normalizar el orden de sus extremos para evitar duplicados invertidos
- Una **Semantic Relation** entre un objeto y sí mismo es inválida por defecto, salvo que el **Relation Role** habilite explícitamente self-links con semántica justificada
- Una **Narrative Entity** puede referenciar muchos **Assets** sin poseerlos
- El **Worldbuilding Context** enriquece **Assets** pero no sustituye al **Media Core** como núcleo
- El **Platform/System Context** soporta a **Media Core** y **Worldbuilding Context** sin definir el dominio principal
- El **Platform/System Context** posee un único **App Shell** canónico para componer router raíz, layout base, boundaries visibles y capacidades globales
- Un **App Shell** compone muchos **Global Providers** sin delegarles ownership semántico de negocio
- Un **Operational Profile** gobierna settings y preferencias operativas sin redefinir la semántica de **Asset**, **Organizer**, **Narrative Entity** o **Taxonomy**
- Un **Platform Process** puede operar sobre muchos **Assets** u **Organizers** sin poseer su identidad ni su lifecycle canónico
- Un **Platform Process** puede producir telemetría, progreso, caches o **Derived Artifacts** operativos sin redefinir por ello el modelo del dominio que toca

## Example dialogue

> **Dev:** "¿`characters` y `places` pertenecen al mismo corazón del producto que las carpetas y previews?"
> **Domain expert:** "No. Eso pertenece al **Worldbuilding Context**; el corazón sigue siendo el **Media Core**, y la operación transversal vive en **Platform/System Context**."

## Flagged ambiguities

- "producto" se estaba usando para referirse tanto a un DAM multimedia como a una herramienta de worldbuilding — resuelto: el núcleo es **Media Manager**, implementado mediante **Media Core**, con **Worldbuilding Context** opcional.
- "entity" aparece sobrecargado en el código para hablar de cosas distintas — resuelto: no es un término de dominio aceptado; en dominio se usan **Asset**, **Organizer**, **Narrative Entity** y nombres concretos, y `Entity` queda sólo como paraguas técnico temporal.
- "archivo" se estaba usando a veces como original y a veces como preview/thumbnail — resuelto: el original durable es **Source File** y sus salidas generadas son **Derived Artifacts**.
- "identidad" se estaba confundiendo con ruta o hash — resuelto: la identidad estable es **Asset Identity** y la equivalencia material la expresa **Content Fingerprint**.
- "content fingerprint" podía caer en la raíz de `Asset` como si fuera identidad — resuelto: su verdad canónica pertenece a **Source File** / **Primary Placement**, aunque el asset pueda exponerlo operacionalmente.
- "duplicado" se estaba pudiendo interpretar como "mismo asset" — resuelto: dos archivos con la misma huella pueden seguir siendo **Assets** distintos y sólo convertirse en **Duplicate Candidates**.
- "duplicado" podía absorberse automáticamente como placement secundario del mismo asset — resuelto: por defecto nace otro **Asset**; cualquier unificación o placement adicional debe ser explícito.
- "cambio de contenido" podía implicar un asset nuevo por accidente — resuelto: un cambio de contenido in-place actualiza el mismo **Asset**; el historial sólo existe como **Version History** explícito.
- "uploaded image" podía convertirse en dominio aparte — resuelto: la subida es un **Ingestion Channel** que converge al modelo general de **Asset**.
- "asset" podía quedar sólo como paraguas semántico — resuelto: la arquitectura objetivo le da una raíz persistente común, delgada pero real, con especializaciones por tipo.
- "asset" y "source file" podían colapsarse en la misma cosa — resuelto: **Asset** es el objeto canónico de producto y **Source File** su origen físico.
- "asset name" podía quedar atado al filename físico — resuelto: el **Asset** puede tener un nombre visible canónico propio, separado del archivo que lo soporta.
- "asset title" podía volverse obligatorio demasiado pronto — resuelto: puede faltar al inicio y usar fallback operativo al nombre físico hasta que exista título canónico propio.
- "asset" podía nacer con múltiples placements físicos igualmente canónicos — resuelto: el modelo base usa un **Primary Placement** principal por asset; lo adicional se modela explícitamente después.
- "source file" y "primary placement" podían abrirse como capas distintas demasiado pronto — resuelto: en el modelo base coinciden conceptualmente; sólo se separan cuando placements adicionales lo justifiquen.
- "secondary placement" podía aparecer por conveniencia implícita — resuelto: sólo existe por decisión/modelado explícito; nunca por coincidencia automática de fingerprint.
- "secondary placement" podía quedar como espejo equivalente o heurístico del primary — resuelto: es una materialización física adicional, explícita y subordinada a la misma identidad de asset.
- "asset specialization" podía quedar múltiple o difusa — resuelto: cada **Asset** tiene exactamente una especialización principal a la vez.
- "asset type" podía quedar implícito sólo por la tabla especializada — resuelto: la raíz lleva un `assetType` explícito y consistente con su especialización principal.
- "asset" podía existir sólo al final del pipeline de ingesta — resuelto: la raíz común puede nacer temprano y completarse progresivamente sin esperar toda la metadata especializada.
- "asset root" podía quedar tan mínima que dispersara el estado transversal — resuelto: puede incluir lifecycle y estado operativo ligero, sin convertirse en bolsa de infraestructura.
- "asset root" podía dejar implícito su anclaje físico principal — resuelto: puede llevar referencia directa a `primaryPlacementId` sin por eso confundirse con el placement mismo.
- la raíz de **Asset** podía absorber estado técnico de colas, thumbnails, reindexado o extracción — resuelto: sólo conserva estado verdaderamente transversal y visible; la orquestación técnica vive fuera.
- "system" podía expandirse como bucket cómodo para cualquier feature mal ubicada — resuelto: **Platform/System Context** se limita a shell, settings operativos, observabilidad, enforcement y procesos transversales.
- "provider" podía empezar a definir qué significa un objeto del dominio por estar montado en el root — resuelto: **Global Provider** compone capacidades de runtime, no semántica de negocio.
- "profile" podía confundirse con identidad narrativa o concepto de negocio — resuelto: **Operational Profile** pertenece a plataforma y sólo scopa configuración/experiencia del runtime.
- reindexado, thumbnails o sync podían leerse como parte de la identidad del asset — resuelto: son **Platform Processes** que operan sobre el dominio sin redefinirlo.
- "asset lifecycle" podía quedar enterrado como puro estado técnico — resuelto: el root puede llevar pocos estados visibles y semánticos para usuario, no sólo infraestructura interna.
- "asset lifecycle" podía mezclar visibilidad con estado de vida — resuelto: el set inicial se limita a `active`, `archived` y `deleted`; `hidden`/`public` quedan fuera de lifecycle.
- "asset lifecycle" podía absorber estados de pipeline como `processing` — resuelto: el lifecycle y el processing status viven separados.
- "asset lifecycle" podía quedar sin huella temporal mínima — resuelto: transiciones semánticas como archivado o borrado pueden registrar timestamps explícitos en la raíz del asset.
- "deleted" podía confundirse con desaparición física total — resuelto: dentro del lifecycle visible de `Asset`, `deleted` significa borrado lógico o tombstone; el purge físico es otra operación.
- "asset lifecycle" podía degradarse a combinaciones de flags como `isArchived` + `isDeleted` — resuelto: se modela como un único `status` canónico.
- "deleted" podía declararse lógico pero no restaurable — resuelto: sigue siendo restaurable mientras no ocurra el purge físico.
- "restore" podía perder el estado previo del asset — resuelto: al salir de `deleted`, se recupera el último estado no borrado si existe; si no, vuelve a `active`.
- "group" estaba documentado como colaboración/acceso pero definido por dominio como agrupador transversal — resuelto: **Group** es un **Organizer** transversal, no un concepto primario de permisos.
- "group" podía expandirse para agrupar cualquier artefacto de taxonomy — resuelto: **Group** se limita a **Assets**, **Organizers** y **Narrative Entities**; no es un contenedor universal del dominio.
- "album" y "collection" podían solaparse — resuelto: **Album** es curaduría/presentación visual y **Collection** es agrupación temática o funcional más amplia.
- "album" podía expandirse para contener cualquier objeto del dominio — resuelto: la membresía directa de **Album** se restringe a **Assets**.
- "collection" podía expandirse a membresía totalmente heterogénea — resuelto: la membresía directa de **Collection** se centra principalmente en **Assets**.
- "collection" y "group" podían terminar siendo sinónimos — resuelto: **Collection** organiza por tema o función; **Group** se reserva para clusters heterogéneos y transversales entre tipos de objeto.
- "favorite" podía leerse como estado embebido o como entidad transversal — resuelto: **Favorite** es un marcador transversal; los `isFavorite` dispersos no son la verdad conceptual.
- "favorite" podía quedarse con doble verdad técnica — resuelto: la relación transversal es canónica y los flags embebidos sólo pueden existir como deuda temporal o cache transitoria.
- "favorite" podía interpretarse como propiedad global del objeto en vez de relación del actor que marca — resuelto: su scope contractual pertenece al actor/perfil y no al target como rasgo intrínseco.
- el perímetro de **Favorite** podía seguir excluyendo a **Tag** y **Property** por arrastre legacy — resuelto: ambas familias entran al bridge canónico; **Task** sigue fuera del perímetro inicial.
- "favorite" podía comportarse como toggle no idempotente creando duplicados según el estado previo — resuelto: existe como máximo una relación activa por par actor-target y las operaciones de marcar/desmarcar son idempotentes.
- "favorite" podía quedar sin semántica clara cuando el target salía de la superficie activa — resuelto: su visibilidad sigue al target; puede reaparecer al restaurar y desaparece definitivamente sólo con purge físico.
- "folder" podía sentirse como organizer libre — resuelto: **Folder** sigue siendo un contenedor físico enriquecido, no una agrupación lógica genérica.
- "folder" podía abrir la puerta a variantes virtuales bajo el mismo nombre — resuelto: **Folder** se mantiene estrictamente físico y lo virtual vive en otros **Organizers**.
- "folder membership" podía subir a la raíz de `Asset` — resuelto: la pertenencia física a `Folder` vive en `Source File` / `Primary Placement`, no en la identidad del asset.
- "tag" podía competir con organizadores ricos — resuelto: **Tag** es clasificación semántica transversal, no contenedor principal.
- un vocabulario cerrado podía empujar por inercia hacia **Property** aunque sólo expresara clasificación — resuelto: si el significado central es pertenencia clasificatoria, sigue siendo **Tag**.
- el perímetro de **Tag** podía quedar implícito o demasiado estrecho — resuelto: incluye **Assets**, **Organizers**, **Narrative Entities**, **Prompt**, **Note** y **Wildcard**.
- **Tag** podía depender del nombre visible como identidad contractual — resuelto: requiere identificador portable estable separado del label humano.
- El identificador portable de **Tag** podía divergir por casing o estilo de naming — resuelto: usa slugs estables en minúsculas con formato `snake_case`.
- El slug portable de **Tag** podía tratarse como copy editable sin consecuencias — resuelto: es identidad estable y sólo cambia mediante migración explícita.
- el label visible de **Tag** podía confundirse con su identidad contractual — resuelto: la identidad vive en el slug; el label es presentación editable mientras no cambie el significado.
- la `category` de **Tag** podía deslizarse hacia namespace o identidad secundaria — resuelto: es agrupación liviana y no parte de la identidad del tag.
- el slug de **Tag** podía reabrir namespaces encubiertos repitiéndose entre categorías — resuelto: es globalmente único.
- la jerarquía ligera de **Tag** podía derivar hacia grafo u ontología permitiendo múltiples padres — resuelto: admite como máximo un solo padre por tag.
- la jerarquía de **Tag** podía admitir ciclos destructivos para navegación e inferencia — resuelto: los ciclos son absolutamente inválidos.
- una fusión semántica entre **Tag** podía borrar el tag absorbido como si no hubiera historia ni referencias previas — resuelto: el tag absorbido queda legacy/deprecated.
- un **Tag** absorbido podía quedar sin sucesor claro o con varios reemplazos ambiguos — resuelto: puede declarar como máximo un reemplazo explícito cuando exista equivalencia clara.
- un **Tag** deprecated podía seguir entrando en nuevas asignaciones como si continuara vigente — resuelto: permanece legible como legacy, pero queda bloqueado para nuevas escrituras normales.
- una asignación legacy podía seguir regrabando indefinidamente un **Tag** deprecated aun teniendo replacement explícito equivalente — resuelto: al guardar se normaliza por defecto al tag vigente.
- el slug histórico de un **Tag** absorbido podía reciclarse para otro concepto posterior — resuelto: queda reservado y no se reutiliza.
- un **Tag** deprecated podía seguir sosteniendo jerarquía activa como padre de tags vigentes — resuelto: deja de ser padre válido y exige reparenting explícito de sus hijos.
- una **Property** deprecated podía declarar replacement incompatible y aun así auto-normalizar assignments como si fuera un simple rename — resuelto: la auto-normalización sólo aplica con compatibilidad semántica, de tipo y cardinalidad.
- la key o slug histórico de una **Property** retirada podía reciclarse para otra semántica posterior — resuelto: queda reservado y no se reutiliza.
- el catálogo de **Property** podía reabrir namespaces encubiertos mediante categorías o agrupaciones — resuelto: el slug es globalmente único y la agrupación no forma parte de la identidad.
- **Property** podía derivar hacia jerarquías o herencias internas como si fuera una ontología — resuelto: en v1 cada property es plana e independiente.
- una misma **Property** podía mutar su contrato por tipo de objeto mediante overrides locales — resuelto: si cambia tipo, cardinalidad o vocabulario según target, deben existir properties distintas.
- un replacement de **Property** podía parecer seguro aunque cambiara el perímetro de aplicabilidad — resuelto: si cambia materialmente la aplicabilidad, la migración deja de ser auto-normalizable.
- La aplicabilidad restringida de **Tag** podía operar como sugerencia sin consecuencias reales — resuelto: asignarlo fuera de su perímetro declarado es inválido.
- la jerarquía ligera de **Tag** podía duplicar clasificación materializando ancestros por asignación de hijos — resuelto: la asignación directa sigue siendo explícita y la expansión jerárquica se resuelve aparte.
- un objeto podía acumular como asignación directa tanto un tag hijo como su ancestro dentro del mismo ramo — resuelto: esa redundancia es inválida por defecto.
- reparentar un **Tag** podía implicar que todas sus asignaciones históricas quedaran semánticamente rotas por defecto — resuelto: el reparenting ajusta la jerarquía sin invalidar automáticamente las asignaciones existentes.
- un reparenting de **Tag** podía crear redundancias nuevas y “arreglarlas” borrando asignaciones en silencio — resuelto: esas redundancias se detectan y requieren cleanup explícito.
- "tag taxonomy" podía crecer sin límites — resuelto: la estructura de **Tag** es jerárquica de forma ligera, con categoría opcional y sin ontología compleja.
- "tag" podía separarse por contexto y fracturar el lenguaje compartido — resuelto: **Tag** es global en **Taxonomy** y sólo se acota por categoría o aplicabilidad cuando haga falta.
- la pertenencia a **Tag** de artefactos textuales podía quedar canónicamente incrustada en el archivo portable — resuelto: la clasificación canónica vive en la capa relacional; cualquier tag escrito en el archivo sólo puede actuar como hint de autoría o importación, no como verdad final.
- "worldbuilding + media" podía confundirse con ownership — resuelto: las **Narrative Entities** referencian **Assets**; no los poseen ni redefinen.
- "world item" podía convertirse en bucket libre de worldbuilding — resuelto: **World Item** es residual explícita y controlada, no tipo default para lo indefinido.
- "taxonomy" podía parecer un cuarto contexto top-level — resuelto: **Taxonomy** es un subdominio compartido entre contextos, no un núcleo independiente del producto.
- "prompt" estaba repartido entre taxonomy y worldbuilding — resuelto: **Prompt** es un artefacto creativo de **Taxonomy** reutilizable por ambos contextos.
- "prompt" podía reducirse a campo dependiente de otras entidades — resuelto: **Prompt** es un artefacto standalone con vínculos opcionales, no propiedad incrustada de worldbuilding o media.
- "prompt" podía depender de UI o estructura rígida para su autoría — resuelto: **Prompt** es textual por defecto y puede enriquecerse con metadata opcional.
- "prompt" file-backed podía quedar sin formato base claro — resuelto: en esa modalidad usa Markdown con metadata authored en frontmatter.
- "prompt" podía quedar o demasiado plano o cargado con todo su shape legacy — resuelto: el contrato file-backed inicial admite una capa específica pequeña y gobernada, no cero campos propios por dogma ni herencia completa del modelo legacy.
- la capa específica de `Prompt` podía crecer de golpe con `model`, `style`, `lighting`, `mood` y demás campos heredados — resuelto: la primera capa específica se limita a `purpose` y `parameters`; lo demás queda fuera hasta que exista una razón fuerte para formalizarlo.
- `parameters` de `Prompt` podía degradarse a JSON libre sin vocabulario ni shape — resuelto: existe como bloque authored gobernado y explícito; cualquier ampliación relevante debe entrar por contrato, no por arbitrariedad abierta.
- `parameters` de `Prompt` podía nacer como catálogo rígido de campos dependientes de una herramienta concreta — resuelto: su forma inicial es un bloque de entradas tipadas y gobernadas, portable entre distintos usos del artefacto.
- los valores de `parameters` de `Prompt` podían crecer a objetos anidados arbitrarios demasiado pronto — resuelto: la primera versión acepta escalares y listas planas de escalares, no mini-árboles JSON embebidos.
- las claves de `parameters` de `Prompt` podían quedar completamente libres o cerrarse demasiado pronto — resuelto: existe un vocabulario canónico curado y un escape hatch explícito para claves custom distinguibles.
- las claves custom de `parameters` de `Prompt` podían distinguirse sólo por convenciones frágiles dentro del string — resuelto: la distinción se expresa mediante metadata explícita separada de la clave.
- el vocabulario canónico de `parameters` de `Prompt` podía quedarse vacío en el arranque — resuelto: debe empezar con un seed mínimo real para que el lenguaje compartido exista desde el día 1.
- el seed inicial de `parameters` de `Prompt` podía contaminarse con knobs técnicos de runtimes concretos — resuelto: arranca como vocabulario semántico y portable; lo técnico queda fuera del núcleo inicial.
- excluir conceptos legacy del top-level de `Prompt` podía interpretarse como prohibición absoluta dentro del vocabulario de `parameters` — resuelto: algunos pueden reaparecer como claves canónicas si son semánticos y portables; lo excluido sigue siendo el top-level fijo o los knobs técnicos no portables.
- el seed inicial de `parameters` de `Prompt` podía quedar abstracto sin un primer set concreto — resuelto: el set mínimo inicial es `subject`, `context`, `tone`, `style` y `constraints`.
- las claves canónicas de `parameters` de `Prompt` podían volverse localizables dentro del propio contrato portable — resuelto: la clave estable pertenece al contrato y la traducción sólo a la capa de UI.
- `parameters` de `Prompt` podía confundirse con valores de una ejecución concreta — resuelto: su verdad canónica describe variables del template; una instancia ejecutada pertenece a otra capa.
- una definición de parámetro en `Prompt` podía quedarse sin ayuda authored o arrastrar un valor de ejecución como si fuera canónico — resuelto: puede llevar un default/example opcional, pero no un valor de instancia tratado como verdad del template.
- el tipo esperado de un parámetro de **Prompt** podía quedar implícito o depender de inferencia por uso — resuelto: cada parámetro declara explícitamente su tipo esperado.
- el tipo declarado de un parámetro de **Prompt** podía quedar sin un vocabulario real de tipos detrás — resuelto: el contrato arranca con un seed pequeño y explícito.
- el seed inicial de tipos de parámetros de **Prompt** podía quedar abstracto sin un primer set concreto — resuelto: arranca con `text`, `number`, `boolean`, `date` y `enum_token`.
- la multiplicidad de un parámetro de **Prompt** podía inflar el vocabulario de tipos con plurales ad hoc — resuelto: se modela como wrapper genérico sobre el tipo base.
- un parámetro de **Prompt** con tipo `enum_token` podía dejar implícito su vocabulario válido — resuelto: debe declararlo o referenciarlo explícitamente.
- los tokens válidos de `enum_token` en **Prompt.parameters** podían mezclarse con labels visibles o naming inestable — resuelto: usan slugs estables en `snake_case` y separan identidad portable de presentación.
- los tipos primitivos de **Prompt.parameters** podían derivar hacia semánticas distintas pese a compartir nombre con **Property Assignment** — resuelto: reutilizan la misma semántica base por defecto.
- una clave canónica de **Prompt.parameters** podía mantener nombre compartido pero variar libremente su tipo entre prompts — resuelto: la definición canónica gobierna el tipo base.
- una clave canónica de **Prompt.parameters** podía variar libremente su cardinalidad entre prompts — resuelto: la definición canónica gobierna también la cardinalidad base.
- `subject` de **Prompt.parameters** podía quedar sin shape base pese a ser clave seed — resuelto: nace como parámetro escalar de tipo `text`.
- `context` de **Prompt.parameters** podía quedar sin shape base pese a ser clave seed — resuelto: nace como parámetro escalar de tipo `text`.
- `tone` de **Prompt.parameters** podía quedar sin shape base pese a ser clave seed — resuelto: nace como parámetro escalar de tipo `enum_token`.
- `style` de **Prompt.parameters** podía quedar sin shape base pese a ser clave seed — resuelto: nace como parámetro multivalue con tipo base `enum_token`.
- `constraints` de **Prompt.parameters** podía quedar sin shape base pese a ser clave seed — resuelto: nace como parámetro multivalue con tipo base `text`.
- `tone` y `style` de **Prompt.parameters** podían quedar como claves canónicas con catálogos locales fragmentados por prompt — resuelto: se apoyan por defecto en vocabularios compartidos entre prompts.
- una clave canónica de **Prompt.parameters** con vocabulario compartido podía expandirse localmente con tokens ajenos al catálogo común — resuelto: cada prompt puede estrechar a un subconjunto, pero no ampliarlo fuera del vocabulario compartido.
- los parámetros multivalue de **Prompt** podían arrastrar orden o duplicados accidentales — resuelto: por defecto se comportan como colección sin orden y sin duplicados.
- los parámetros de **Prompt** podían mezclar semántica base con hints de UI específicos — resuelto: los widgets/hints pertenecen a metadata opcional de presentación.
- la obligatoriedad de un parámetro de **Prompt** podía quedar implícita o inferida por señales secundarias — resuelto: requiredness se declara explícitamente por parámetro.
- un default de parámetro de **Prompt** podía alterar implícitamente la requiredness — resuelto: default y obligatoriedad se gobiernan por separado.
- el contenido de `Prompt` podía usar placeholders sin definición o exigir coincidencia rígida total con `parameters` — resuelto: cada placeholder del contenido debe mapear a un parámetro declarado, pero puede haber parámetros declarados aún no utilizados.
- un parámetro requerido de **Prompt** podía permanecer no consumido en el contenido como si nada — resuelto: por defecto ese estado es inválido.
- `parameters` de `Prompt` podía heredar significado semántico por orden de aparición — resuelto: la semántica vive en las claves y definiciones, mientras el orden queda sólo como ayuda editorial o de presentación.
- `parameters` de `Prompt` podía permitir varias definiciones para la misma clave — resuelto: cada clave tiene como máximo una definición canónica dentro del mismo prompt.
- las claves canónicas de `parameters` de `Prompt` podían divergir por estilo de naming — resuelto: usan slugs estables en minúsculas con formato `snake_case`.
- cada parámetro canónico de `Prompt` podía arrastrar dentro del portable su propia presentación duplicada — resuelto: la identidad y presentación canónica vienen del vocabulario/UI; el portable sólo lleva ayuda authored opcional si aporta contexto real.
- una clave custom de `parameters` de `Prompt` podía quedar compitiendo indefinidamente con una futura clave canónica equivalente — resuelto: la canónica desplaza a la custom y la custom queda como legacy/migrable.
- la migración de una clave custom de `parameters` hacia una canónica podía quedarse en compatibilidad eterna o romper de golpe — resuelto: se admite lectura temporal de legado, pero la normalización ocurre al guardar.
- una clave custom de `parameters` de **Prompt** podía colapsarse silenciosamente con una canónica aunque su shape no coincidiera — resuelto: si cambia tipo base o cardinalidad, la migración debe ser explícita.
- una clave custom de `parameters` de `Prompt` podía quedar marcada como custom pero semánticamente opaca — resuelto: debe incluir al menos una descripción o intención authored breve.
- una clave custom de **Prompt.parameters** podía abrir un mini-sistema tipado privado al margen del contrato común — resuelto: usa el mismo vocabulario de tipos compartido.
- una clave custom de **Prompt.parameters** con `enum_token` podía quedar bloqueada hasta existir un vocabulario global equivalente — resuelto: puede declarar su propio vocabulario local de tokens mientras siga siendo custom.
- una clave custom de `parameters` de `Prompt` podía quedar desconectada del vocabulario canónico aunque tuviera cercanía evidente — resuelto: puede declarar opcionalmente esa relación como puente explícito hacia la clave canónica próxima.
- una clave custom de `parameters` de `Prompt` podía quedar repartida entre varias afinidades canónicas a la vez — resuelto: si declara cercanía, apunta como máximo a una sola clave canónica próxima.
- el vocabulario de `parameters` de `Prompt` podía fragmentarse en catálogos por categoría o familia demasiado pronto — resuelto: es global por defecto y sólo restringe aplicabilidad cuando haga falta.
- la aplicabilidad de una clave canónica de `parameters` de `Prompt` podía quedar como sugerencia débil — resuelto: cuando se declara restricción explícita, esa restricción es efectiva.
- `purpose` de `Prompt` podía degradarse a alias redundante de `summary` — resuelto: ambos campos coexisten con semánticas distintas; `summary` resume y `purpose` expresa para qué sirve el prompt.
- `purpose` de `Prompt` podía quedar como campo nominal pero vacío dentro del portable — resuelto: si existe como parte de la capa específica mínima, expresa intención authored real y no puede quedar vacío.
- un **Prompt** podía quedar canónicamente vacío en su cuerpo principal — resuelto: el artefacto portable válido requiere contenido authored no vacío.
- `Prompt` podía exigir `parameters` incluso cuando el template no tenía variables — resuelto: el bloque puede omitirse por completo si no existe contrato paramétrico real.
- "note" podía quedar secuestrada por worldbuilding — resuelto: **Note** es conocimiento transversal de **Taxonomy** y no una entidad narrativa en sí misma.
- "note" podía quedar reducida a comentario colgante de una sola entidad — resuelto: **Note** es un artefacto standalone con vínculos opcionales a múltiples objetos.
- "note" podía quedar atrapada como texto perdido dentro de la UI o de un registro estructurado — resuelto: **Note** es textual por defecto y puede vivir como artefacto standalone reusable.
- "note" file-backed podía quedar sin formato base claro — resuelto: en esa modalidad usa Markdown con metadata authored en frontmatter.
- `Note` podía arrastrar `status`, `priority` o `presetId` dentro de su contrato portable como si fueran conocimiento canónico — resuelto: esos campos pertenecen a workflow/capa operativa y no a la representación authored portable por defecto.
- `Note` podía reclamar una capa authored propia adicional por inercia del modelo legacy — resuelto: en la primera versión basta con núcleo compartido más cuerpo Markdown; no introduce campos específicos propios.
- una **Note** podía quedar canónicamente vacía en su cuerpo principal — resuelto: el artefacto portable válido requiere contenido authored no vacío.
- "wildcard" podía oscilar entre tooling y worldbuilding — resuelto: **Wildcard** es un patrón reutilizable de **Taxonomy**, no una entidad narrativa principal.
- "wildcard" podía reducirse a subpieza interna de `Prompt` — resuelto: **Wildcard** es artefacto standalone reutilizable que `Prompt` puede consumir sin poseer.
- "wildcard" podía colapsarse en un archivo cualquiera — resuelto: **Wildcard** sigue siendo artefacto de **Taxonomy**, aunque su fuente de autoría pueda ser texto plano simple.
- "wildcard" podía quedar opcionalmente file-backed sin dirección clara — resuelto: en la arquitectura objetivo es file-backed por defecto.
- "wildcard" podía nacer con sintaxis innecesariamente rica — resuelto: el cuerpo de autoría usa texto line-based simple con una entrada por línea; sólo se admite una cabecera mínima portable para identidad y metadata esencial.
- `Wildcard` podía arrastrar jerarquía authored (`parentId`, `children`) desde el modelo legacy — resuelto: el contrato portable inicial es plano y standalone; cualquier jerarquía futura requerirá decisión explícita posterior.
- la cabecera mínima de `Wildcard` podía inflarse con `shortcut`, `type`, `theme`, `author`, `difficulty`, `version` o `isActive` por arrastre legacy — resuelto: la primera versión no introduce campos específicos propios más allá del núcleo compartido.
- el cuerpo line-based de **Wildcard** podía admitir líneas duplicadas como si aportaran semántica distinta — resuelto: las entradas duplicadas son inválidas.
- el cuerpo line-based de **Wildcard** podía tratar líneas vacías o whitespace como pseudo-entradas — resuelto: se normalizan fuera y no cuentan como entradas válidas.
- las entradas válidas de **Wildcard** podían diferir sólo por whitespace exterior accidental — resuelto: se normalizan recortando esos bordes antes de persistirse.
- la normalización de **Wildcard** podía empezar a colapsar entradas sólo por mayúsculas/minúsculas — resuelto: en v1 la comparación respeta casing.
- el orden de las entradas de **Wildcard** podía arrastrar semántica posicional accidental — resuelto: por defecto pertenece sólo a authoring o presentación.
- **Wildcard** podía inflarse introduciendo identidad separada para cada línea desde la primera versión — resuelto: en v1 cada entrada se trata simplemente como texto normalizado sin ID propio.
- el cuerpo line-based de **Wildcard** podía empezar a admitir mini-sintaxis inline por entrada — resuelto: en v1 una línea representa sólo una entrada textual.
- un **Wildcard** podía quedar efectivamente vacío después de normalizar blanks y duplicados — resuelto: debe conservar al menos una entrada válida.
- "prompt", "note" y "wildcard" podían quedar presos de la base de datos — resuelto: su fuente canónica puede ser file-backed, con la app como capa de metadata, indexación y linking.
- "file-backed" podía seguir dejando a la DB como verdad real del texto — resuelto: cuando aplica, el archivo manda y la DB indexa, relaciona y soporta búsqueda/metadata.
- "file-backed" podía mantener una copia completa del texto en DB como segunda verdad silenciosa — resuelto: la DB sólo conserva información operacional o derivada; cualquier materialización textual es cache interna, no verdad canónica editable.
- "prompt" y "note" podían forzarse a file-backed demasiado pronto — resuelto: el modo file-backed es fuerte y deseable, pero no obligatorio desde el nacimiento del artefacto.
- "externalizar" un `Prompt` o `Note` podía implicar crear otro objeto distinto — resuelto: la externalización cambia el soporte, no la identidad del artefacto.
- la metadata de `Prompt` o `Note` file-backed podía quedar toda en DB o toda en archivo sin criterio — resuelto: la metadata authored viaja con el archivo y la metadata operativa/relacional queda en DB.
- los artefactos file-backed de taxonomy podían quedar dispersos en rutas arbitrarias sin hogar canónico — resuelto: existen raíces oficiales por familia y las rutas externas sólo entran como importación o enlace secundario.
- un archivo textual externo podía quedar como canónico in-place por defecto — resuelto: el comportamiento preferido es adoptarlo en la raíz canónica; enlazarlo in-place es una decisión explícita, no el default.
- un cambio externo sobre un archivo canónico podía dejar ambigua la precedencia — resuelto: el archivo manda para contenido authored y la app sólo escala conflicto cuando hay cambios locales pendientes.
- la ruta de un archivo textual podía secuestrar la identidad del artefacto — resuelto: la identidad es estable e independiente del path; mover o renombrar no crea otro objeto de dominio.
- la identidad estable de un artefacto file-backed podía quedar sólo en la DB — resuelto: debe viajar con la representación portable del propio artefacto.
- el filename de un artefacto textual podía secuestrar su nombre visible de dominio — resuelto: el nombre visible canónico es authored y no depende obligatoriamente del nombre físico del archivo.
- cambios editoriales en `title`, `summary`, `category`, `emoji` o `color` de artefactos textuales podían confundirse con cambio de identidad — resuelto: son metadata authored/presentacional y no alteran por sí mismas la identidad del artefacto.
- la “featured image” de un artefacto textual podía quedar como string authored ambiguo dentro del archivo — resuelto: si el producto necesita media destacada canónica, se modela como relación o selección explícita hacia **Asset**, no como campo portable authored.
- eliminar un artefacto textual file-backed podía implicar destruir físicamente su archivo por defecto — resuelto: primero hay borrado lógico/restaurable y sólo después, si se decide explícitamente, purge físico.
- los artefactos textuales file-backed podían arrastrar versionado explícito desde el minuto cero — resuelto: el modelo inicial no lo incluye; sólo aparece si una capacidad real del producto lo exige.
- "task" estaba ubicada en taxonomy pese a su semántica operativa — resuelto: **Task** pertenece a **Platform/System Context** o a un futuro subcontexto de workflow/projects.
- "task" podía leerse como feature central del producto — resuelto: **Task** es capacidad interna/admin, no parte del corazón visible del producto.
- "task" podía quedarse viva por inercia pese a no sostener el target architecture — resuelto: **Task** se considera legacy en deprecación y candidata a eliminación.
- "property" podía confundirse con tag o campo suelto — resuelto: **Property** es una faceta reusable del dominio, distinta de clasificar (`Tag`) o anotar (`Note`).
- un mismo concepto semántico podía duplicarse sin freno entre **Tag** y **Property** — resuelto: no debe canonizarse en ambas formas salvo distinción explícita y fuertemente justificada.
- un vocabulario controlado podía tratarse automáticamente como **Property** aunque sólo clasificara pertenencia — resuelto: **Property** se reserva para facetas con valor tipado y gobernado; la pura clasificación sigue en **Tag**.
- "property value" podía quedar totalmente libre — resuelto: las **Property** se definen con tipo preferente y sólo usan fallback libre de forma controlada.
- "property" podía fragmentarse por contexto y perder semántica común — resuelto: **Property** es global en **Taxonomy** y se restringe por aplicabilidad, no por catálogos aislados.
- "property" podía exigir microconfiguración obligatoria de aplicabilidad en todos los casos — resuelto: la aplicabilidad es global por defecto dentro del perímetro permitido y se restringe sólo cuando haga falta.
- "property" podía obligar a crear una entidad aparte para cualquier pequeño vocabulario cerrado — resuelto: la definición puede declarar valores permitidos opcionales sin forzar otra entidad por defecto.
- los valores permitidos de una **Property** podían depender sólo de labels humanos mutables — resuelto: cada opción usa un token estable separado del label visible.
- un cambio de label visible en **Property** o en sus valores permitidos podía confundirse con una migración de identidad — resuelto: los labels pertenecen a presentación; la identidad la gobiernan slug y tokens estables.
- los tokens de valores permitidos de una **Property** podían divergir por casing o naming — resuelto: usan slugs estables en minúsculas con formato `snake_case`.
- los tokens de valores permitidos de una **Property** podían tratarse como labels editables sin consecuencias — resuelto: son identidad estable y sólo cambian mediante migración explícita.
- los tokens de valores permitidos podían globalizarse prematuramente entre todas las **Property** — resuelto: su unicidad es local al vocabulario de cada property por defecto.
- el orden de los valores permitidos de una **Property** podía arrastrar semántica posicional accidental — resuelto: por defecto pertenece sólo a authoring o presentación.
- retirar un valor permitido de una **Property** podía dejar assignments viejos indistinguibles del vocabulario vigente — resuelto: esos valores pasan a estado legacy/migrable.
- un valor permitido retirado de una **Property** podía seguir reescribiéndose como si continuara vigente — resuelto: permanece legible como legacy, pero queda bloqueado para nuevas escrituras.
- un valor permitido deprecated de una **Property** podía quedar sin sucesor formal o con varios reemplazos ambiguos — resuelto: puede declarar como máximo un reemplazo explícito cuando exista equivalencia clara.
- un **Property Assignment** podía seguir regrabando indefinidamente un token deprecated aun teniendo replacement explícito equivalente — resuelto: al guardar se normaliza por defecto al token vigente.
- "property value" podía terminar escondido en metadata ad hoc — resuelto: los valores de **Property** viven en asignaciones explícitas separadas de la definición.
- "property" y "property value" podían colapsarse en el mismo registro — resuelto: **Property** es la definición global y **Property Assignment** es la aplicación concreta con unicidad por par objeto-propiedad.
- "property assignment" podía nacer como joins y tablas distintas por tipo de objeto — resuelto: **Property Assignment** es un modelo transversal único consumido por los objetos permitidos del dominio.
- "property assignment" podía abrirse desde el día 1 a cualquier artefacto de taxonomy — resuelto: el target inicial se limita a **Assets**, **Organizers** y **Narrative Entities**; taxonomy no se autoextiende por defecto.
- "property value" podía convertirse en `any` o JSON por comodidad — resuelto: el modelo usa un set canónico pequeño de tipos y deja JSON como escape hatch controlado, no como forma default.
- el set canónico de tipos de valor de **Property Assignment** podía quedar indefinido demasiado tiempo — resuelto: debe fijarse explícitamente desde el arranque.
- el set canónico de tipos de valor de **Property Assignment** podía quedarse abstracto sin un primer catálogo concreto — resuelto: el seed inicial es `text`, `number`, `boolean`, `date` y `enum_token`.
- `enum_token` de **Property Assignment** podía degradarse a label humano o texto libre con otro nombre — resuelto: representa un identificador estable de vocabulario controlado.
- `date` de **Property Assignment** podía quedar ambiguo entre fecha-calendario e instante arbitrario — resuelto: en el seed inicial significa fecha-calendario semántica.
- `number` de **Property Assignment** podía microfragmentarse demasiado pronto en variantes numéricas — resuelto: en el seed inicial permanece unificado.
- Una **Property Assignment** multivalue vacía podía competir semánticamente con la ausencia de asignación — resuelto: colección vacía significa ausencia de asignación, no valor portable autónomo.
- Una **Property Assignment** multivalue podía arrastrar orden posicional sin necesidad real — resuelto: su significado portable es colección sin orden.
- Una **Property Assignment** multivalue podía aceptar repeticiones sin semántica distinta — resuelto: no admite duplicados y se comporta como set.
- Una **Property Assignment** de tipo `text` podía aceptar vacío o whitespace como pseudo-valor distinto — resuelto: ese estado equivale a ausencia de asignación.
- Una **Property Assignment** de tipo `boolean` podía colapsar `false` con ausencia de valor — resuelto: `false` es un valor explícito y válido, distinto de no asignado.
- Una **Property** con vocabulario controlado podía seguir representándose como texto libre con validación periférica — resuelto: el contrato preferente usa `enum_token` para expresar esa restricción semántica.
- Una **Property** numérica podía repartir la unidad estable dentro de cada assignment — resuelto: la unidad semántica estable pertenece por defecto a la definición de la property.
- **Property Assignment** podía introducir `null` como pseudo-valor adicional junto a ausencia y valor real — resuelto: `null` no forma parte del contrato portable de valor.
- `date` de **Property Assignment** podía seguir viajando en formatos temporales ambiguos — resuelto: su forma portable es fecha ISO local `YYYY-MM-DD`.
- `enum_token` de **Property Assignment** podía quedar con forma textual inconsistente o cercana a labels humanos — resuelto: usa slugs estables en minúsculas con formato `snake_case`.
- `number` de **Property Assignment** podía degradarse a string numérico formateado — resuelto: viaja como escalar numérico real y deja el formateo a la UI.
- `text` de **Property Assignment** podía crecer hacia rich text o Markdown — resuelto: representa texto escalar simple y no compite con artefactos textuales ricos.
- Una **Property Assignment** sin valor efectivo podía persistirse como cascarón vacío — resuelto: el estado normalizado correcto es ausencia de asignación.
- `number` de **Property Assignment** podía admitir pseudo-valores numéricos no portables como `NaN` o infinitos — resuelto: sólo acepta números finitos reales.
- `text` de **Property Assignment** podía diferir sólo por whitespace exterior accidental — resuelto: la normalización portable recorta esos bordes antes de persistir.
- El vocabulario de tipos de **Property Assignment** podía fragmentarse en extensiones ad hoc por property — resuelto: sólo se expande mediante decisiones explícitas del lenguaje común.
- El tipo de una **Property Assignment** podía quedar a elección local de cada valor — resuelto: lo gobierna la definición de la **Property**.
- La cardinalidad de una **Property Assignment** podía quedar a elección local de cada valor — resuelto: también la gobierna la definición de la **Property**.
- La aplicabilidad restringida de una **Property** podía operar como sugerencia sin consecuencias reales — resuelto: un assignment fuera de perímetro es inválido.
- Los valores permitidos de una **Property** podían operar como hint sin fuerza contractual — resuelto: un assignment fuera del vocabulario declarado es inválido.
- Una **Property** de tipo `enum_token` podía dejar implícito su vocabulario gobernante — resuelto: debe declararlo o referenciarlo explícitamente.
- **Property Assignment** podía absorber por defecto metadata técnica bruta del archivo — resuelto: su perímetro preferente son facetas semánticas compartidas, mientras la metadata técnica primaria vive en **Media Core** o en especializaciones.
- **Property** podía depender del nombre visible como identidad contractual — resuelto: requiere identificador portable estable separado del label humano.
- El identificador portable de **Property** podía divergir por casing o estilo de naming — resuelto: usa slugs estables en minúsculas con formato `snake_case`.
- El slug portable de **Property** podía tratarse como label editable sin consecuencias — resuelto: es identidad estable y sólo cambia mediante migración explícita.
- "property value" podía usarse para apuntar a otros objetos del dominio — resuelto: si hay referencia a otro objeto, eso pertenece al modelo de relaciones, no a **Property Assignment**.
- "property assignment" multivalor podía heredar orden accidental — resuelto: el multivalor es set sin orden por defecto y sólo se ordena cuando la property lo declara.
- la multiplicidad de **Property Assignment** podía inflar el modelo creando tipos especiales por cada plural — resuelto: el multivalor envuelve de forma genérica a los tipos base.
- "relación" podía quedarse muda — resuelto: el vínculo es simple por defecto, pero puede llevar un **Relation Role** opcional cuando aporte significado.
- "relación" podía explotar en joins específicos por par o volverse totalmente genérica — resuelto: el target usa un modelo híbrido, con relaciones genéricas para vínculos semánticos y relaciones dedicadas para estructuras fuertes.
- "relación" podía asumirse simétrica por comodidad — resuelto: una **Semantic Relation** es dirigida por defecto y la simetría sólo existe cuando se declara de forma explícita.
- "relación inversa" podía almacenarse como espejo obligatorio — resuelto: la relación canónica se guarda una sola vez y la inversa se deriva cuando se necesita verla.
- "relation role" podía quedar como texto libre improvisado — resuelto: si existe, sale de un vocabulario gobernado y extendible, no de strings libres por fila.
- el vocabulario inicial de **Relation Role** podía nacer demasiado amplio por ansiedad preventiva — resuelto: arranca pequeño y con roles semánticamente fuertes.
- el seed inicial de **Relation Role** podía sesgarse demasiado pronto hacia un subdominio editorial o narrativo — resuelto: empieza por roles relacionales transversales.
- el seed inicial de **Relation Role** podía quedarse abstracto sin un primer set concreto — resuelto: el set inicial es `references`, `inspired_by`, `derived_from` y `variant_of`.
- `variant_of` podía solaparse con `derived_from` si nacía dirigido — resuelto: en el seed inicial se define como rol simétrico.
- `references` podía deslizarse hacia una pseudo-simetría cómoda — resuelto: en el seed inicial se define como rol dirigido.
- `inspired_by` y `derived_from` podían colapsarse en casi sinónimos — resuelto: `inspired_by` expresa influencia y `derived_from` una descendencia o transformación más fuerte.
- los roles del seed inicial de **Relation Role** podían nacer sin lectura inverse bien fijada — resuelto: todos arrancan con lectura inverse explícita.
- la lectura inverse de **Relation Role** podía quedar opcional o improvisada para roles futuros — resuelto: todo role del vocabulario gobernado declara forward e inverse explícitas.
- el seed inicial de **Relation Role** podía quedarse con inversas explícitas pero sin lecturas concretas aterrizadas — resuelto: `references`/`referenced_by`, `inspired_by`/`inspires`, `derived_from`/`source_for` y `variant_of`/`variant_of`.
- **Relation Role** podía depender de sus lecturas humanas como identidad contractual — resuelto: usa un identificador portable estable en `snake_case`, separado de esas lecturas.
- una reescritura editorial de las lecturas forward/inverse de **Relation Role** podía confundirse con cambio de identidad — resuelto: mientras el significado siga siendo el mismo, la identidad permanece en el slug del role.
- El slug portable de **Relation Role** podía tratarse como copy editable sin consecuencias — resuelto: es identidad estable y sólo cambia mediante migración explícita.
- un **Relation Role** deprecated podía quedar o roto para lectura histórica o habilitado indefinidamente para nuevas altas — resuelto: el legado sigue siendo legible, pero las nuevas relaciones deben usar el vocabulario vigente.
- un **Relation Role** deprecated podía quedar sin puente formal hacia su sucesor o con múltiples reemplazos ambiguos — resuelto: puede señalar como máximo un reemplazo explícito cuando exista equivalencia clara.
- una **Semantic Relation** podía seguir regrabando indefinidamente un role deprecated aun teniendo replacement explícito equivalente — resuelto: al guardar se normaliza por defecto al role vigente.
- La aplicabilidad restringida de **Relation Role** podía operar como sugerencia sin consecuencias reales — resuelto: usar un role fuera de su perímetro declarado es inválido.
- la lectura inverse de `derived_from` podía diluirse en una frase demasiado blanda — resuelto: debe expresar origen fuerte.
- la unicidad por triple de **Semantic Relation** podía interpretarse como prohibición total de varios roles entre el mismo par de objetos — resuelto: pueden coexistir varios roles distintos si cada uno agrega semántica real.
- una relación semántica sin role podía convivir con otra roleada equivalente sobre el mismo par como redundancia blanda — resuelto: no debe coexistir por defecto cuando el role ya captura el significado del vínculo.
- una relación semántica sin role podía seguir creándose aunque ya existiera un role claro y aplicable — resuelto: en ese caso, la relación desnuda es inválida.
- `variant_of` podía quedar demasiado abierto y cruzar familias sin parentesco semántico real — resuelto: se restringe a la misma familia o a familias muy cercanas.
- las incompatibilidades entre roles podían quedar hardcodeadas como excepciones locales sin contrato de catálogo — resuelto: se declaran en el vocabulario gobernado de `Relation Role`.
- `variant_of` y `derived_from` podían coexistir libremente sobre el mismo par pese a expresar estructuras distintas — resuelto: son incompatibles por defecto salvo justificación excepcional explícita.
- las excepciones a incompatibilidades de roles podían colarse como overrides ad hoc por fila en el modelo mínimo — resuelto: en v1 deben elevarse al catálogo o a reglas explícitas, no quedar libres por instancia.
- `derived_from` podía restringirse demasiado por analogía con `variant_of` — resuelto: puede cruzar familias distintas cuando la derivación fuerte sea semánticamente clara.
- `derived_from` podía tolerar ciclos semánticamente contradictorios dentro del grafo — resuelto: el subgrafo de derivación debe ser acíclico.
- `references` e `inspired_by` podían quedar tan restringidos como los roles más específicos del seed — resuelto: operan como los roles más ampliamente transversales del perímetro permitido.
- "relation role" podía no saber cómo leerse desde el otro extremo — resuelto: el role define lectura forward canónica y puede definir lectura inverse opcional sin duplicar la relación.
- "relation role" podía degradarse a un comodín vacío como `related_to` — resuelto: si no agrega semántica real, el role queda ausente.
- "relation role" podía partirse en diccionarios separados por contexto — resuelto: el vocabulario es global y compartido, con aplicabilidad opcional para restringir combinaciones válidas.
- "simetría" podía modelarse como flag improvisado por instancia — resuelto: la simetría pertenece a la definición del `Relation Role`, no a cada fila individual.
- una relación semántica con role simétrico podía persistirse en ambas orientaciones como si fueran vínculos distintos — resuelto: la representación canónica normaliza el orden de extremos para evitar duplicados invertidos.
- una **Semantic Relation** podía admitir auto-vínculos triviales por accidente — resuelto: los self-links son inválidos por defecto y sólo existen si el role los habilita explícitamente.
- "semantic relation" podía abrirse a cualquier objeto del sistema — resuelto: el perímetro inicial incluye **Assets**, **Organizers**, **Narrative Entities**, **Prompt**, **Note** y **Wildcard**; `Tag`, `Property`, `Favorite` y `Task` quedan fuera por ahora.
- "semantic relation" podía depender sólo de una clave natural entre extremos y rol — resuelto: la relación tiene identidad propia estable; la unicidad lógica se gobierna aparte.
- el registro canónico de **Semantic Relation** podía inflarse temprano con texto libre explicativo — resuelto: la forma inicial se mantiene mínima y no incorpora nota libre por relación.
- los timestamps o campos de auditoría de **Semantic Relation** podían confundirse con parte del contrato semántico base — resuelto: pertenecen a la capa operativa y no al núcleo semántico mínimo.
- una **Semantic Relation** podía persistirse o reescribirse apuntando a extremos inexistentes o ya fuera de perímetro — resuelto: ambos extremos deben existir y ser participantes válidos al momento de escribir.
- el lifecycle visible de **Semantic Relation** podía separarse arbitrariamente del estado activo de sus extremos — resuelto: en v1 su visibilidad normal sigue la superficie activa de esos extremos.
- un vínculo semántico podía desaparecer o seguir visible sin criterio cuando uno de sus extremos se borraba lógicamente — resuelto: se oculta de consultas normales pero se preserva para historia o restauración.
- la restauración de un extremo podía dejar sus relaciones semánticas en un limbo manual — resuelto: recuperan visibilidad por defecto si el otro extremo sigue siendo válido.
- el purge físico de un extremo podía dejar relaciones semánticas huérfanas como si siguieran siendo preservables — resuelto: esas relaciones dejan de existir como vínculos activos preservables.
- "semantic relation" podía duplicarse con distintos ids aunque dijera lo mismo — resuelto: la unicidad lógica impide repetir el mismo triple canónico con la misma dirección.
