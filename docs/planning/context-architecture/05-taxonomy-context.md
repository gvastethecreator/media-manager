# Taxonomy Context

`Taxonomy` no es un cuarto contexto principal. Es el subdominio compartido que aporta clasificación, facetas y artefactos semánticos reutilizables para `Media Core` y `Worldbuilding Context`.

Su valor no está en poseer el producto, sino en darle un lenguaje compartido sin convertirse en un basural semántico.

## Propósito

`Taxonomy` existe para responder preguntas como:

- ¿cómo clasificamos sin inventar un organizer nuevo por cada necesidad?
- ¿cómo describimos facetas reutilizables de objetos del dominio?
- ¿cómo mantenemos artefactos creativos y semánticos compartidos sin secuestrarlos dentro de worldbuilding o media?

## Qué vive aquí

### Clasificación y facetas

- `Tag`
- `Property`

### Artefactos semántico-creativos

- `Prompt`
- `Note`
- `Wildcard`

## Qué no vive aquí

- ownership de `Assets`
- ownership de `Narrative Entities`
- `Task` como capacidad operativa
- organizers físicos o lógicos del núcleo (`Folder`, `Album`, `Collection`, `Group`)

## Batch 1: `Tag` + `Property`

Este batch fija el lenguaje clasificatorio más transversal.

### `Tag`

`Tag` es un clasificador global y compartido. No debe fragmentarse en taxonomías separadas por contexto salvo que en el futuro aparezca una necesidad extraordinaria que merezca una decisión explícita.

Su perímetro inicial incluye `Assets`, `Organizers`, `Narrative Entities`, `Prompt`, `Note` y `Wildcard`. La intención es que la clasificación transversal también pueda operar sobre artefactos textuales compartidos sin obligarlos a incrustar tags canónicos en su representación portable.

Además, `Tag` no debe depender de su label visible como identidad. Necesita un identificador portable estable que permita renombrar la presentación humana sin romper referencias ni clasificación histórica.

Ese identificador portable se expresa como slug estable en minúsculas con formato `snake_case`, manteniendo coherencia con los demás vocabularios gobernados del sistema.

Además, ese slug se trata como identidad estable y no como copy editable. Si alguna vez necesita cambiar, el movimiento correcto es una migración explícita y no un simple rename editorial.

Cuando un `Tag` declare aplicabilidad restringida, esa restricción opera como contrato real. Asignar el tag fuera del perímetro definido se considera inválido y no una simple advertencia de UI o documentación.

La `category` opcional de `Tag` se mantiene como agrupación liviana y no como parte de la identidad o del namespace del tag. La intención es evitar que categorías editoriales deriven hacia catálogos paralelos o identidades duplicadas bajo distintos compartimentos.

Como consecuencia, el slug del tag se mantiene globalmente único. La categoría no habilita duplicar el mismo identificador en compartimentos distintos ni reintroduce namespaces ocultos dentro del catálogo compartido.

La jerarquía de `Tag`, además, se mantiene ligera también en su estructura: cada tag admite como máximo un solo padre por defecto. La intención es evitar que el catálogo derive tempranamente hacia un grafo multiparent u ontología de mayor complejidad.

Esa jerarquía también prohíbe ciclos de forma absoluta. La semántica de padre/descendiente y cualquier expansión jerárquica dependen de una estructura acíclica; si aparece un ciclo, el modelo lo trata como inválido.

La jerarquía ligera de `Tag` tampoco materializa herencia automática en las asignaciones. Si se asigna un tag hijo, la pertenencia directa al ancestro no se duplica por defecto; cualquier expansión jerárquica pertenece a queries, navegación o UI, no a una segunda verdad relacional materializada.

Por la misma razón, dentro de una misma rama jerárquica no se considera válido asignar directamente a la vez un tag descendiente y su ancestro sobre el mismo objeto. La dirección acordada es que esa combinación sea redundante por defecto y que la clasificación directa priorice el nivel más específico.

#### Rasgos objetivo del catálogo

- catálogo global compartido,
- jerarquía ligera,
- categoría o aplicabilidad opcional,
- sin inflarse hasta convertirse en ontología monstruosa.

### `Property`

`Property` es también global y compartida, pero cumple un rol distinto: describe facetas o atributos reutilizables del dominio.

Esa distinción con `Tag` no debe diluirse por comodidad. La dirección acordada es evitar canonizar el mismo concepto semántico a la vez como tag y como property salvo que exista una distinción explícita y fuertemente justificada entre “clasificación” y “faceta tipada”.

#### Rasgos objetivo de la definición

- catálogo global de propiedades,
- tipo preferente claro,
- aplicabilidad global por defecto con restricciones opcionales por clase o tipo cuando haga falta,
- allowed values opcionales cuando la definición requiera vocabulario controlado,
- definición separada de sus valores concretos.

Cuando exista ese vocabulario controlado, cada opción necesita un token estable separado del label visible. La intención es que los assignments apunten a identidad portable real y no a textos humanos que puedan cambiar por razones editoriales.

Esos tokens se expresan como slugs estables en minúsculas con formato `snake_case`, manteniendo coherencia con la representación portable de `enum_token` y con el resto de vocabularios gobernados.

Además, esos tokens se tratan como identidad estable y no como labels editables. Si alguna vez necesitan cambiar, el camino correcto es una migración explícita y no un rename casual que deje assignments históricos colgando de un valor mutado.

Por defecto, la unicidad de esos tokens vive dentro del vocabulario controlado de la `Property` que los declara. No se exige una unicidad global entre todas las properties salvo que en el futuro aparezca un registro compartido más fuerte que justifique esa expansión.

El orden de ese vocabulario permitido no se trata como semántica de dominio por defecto. Si la UI o el authoring necesitan mostrar las opciones en cierto orden, ese orden pertenece a presentación, no a la identidad portable de los valores.

Si una `Property` retira uno de esos valores permitidos y ya existen assignments que lo usan, esos casos no se consideran simplemente “vigentes como siempre”. La dirección acordada es tratarlos como legacy/migrables: compatibles para lectura histórica durante la transición, pero fuera del vocabulario actual hasta su normalización.

### Valores de `Property`

Los valores concretos no deben esconderse en blobs ad hoc si el producto pretende tener un lenguaje serio. La arquitectura objetivo prefiere:

- `Property` como definición global,
- y asignaciones explícitas como lugar donde vive el valor real.

### `PropertyAssignment`

La decisión recién cerrada para el contrato objetivo es esta:

- `PropertyAssignment` es un modelo transversal único,
- su target inicial permitido se limita a `Assets`, `Organizers` y `Narrative Entities`,
- usa un set canónico y pequeño de tipos de valor con fallback controlado,
- existe una sola asignación por par `(objeto, property)`,
- si la propiedad necesita varios valores, esa multiplicidad vive dentro del valor de la asignación y se interpreta como set sin orden por defecto,
- y si el supuesto valor apunta a otro objeto del dominio, eso ya no es `PropertyAssignment` sino relación explícita,
- y no como varias filas duplicadas que digan conceptualmente lo mismo.

Además, el set canónico de tipos de valor no queda como una abstracción pendiente. La dirección acordada es fijarlo explícitamente desde esta fase para que `PropertyAssignment` no derive por omisión hacia blobs o JSON comodín.

El seed mínimo inicial acordado para esos tipos es:

- `text`
- `number`
- `boolean`
- `date`
- `enum_token`

Cuando un parámetro necesita multiplicidad, esa condición se modela como wrapper genérico sobre el tipo base y no como una familia paralela de tipos especiales. La intención es conservar un vocabulario pequeño y composable también en `Prompt.parameters`.

Si el tipo declarado es `enum_token`, el parámetro debe declarar o referenciar explícitamente el vocabulario válido de tokens. La intención es que el contrato del parámetro siga siendo verificable y que la UI no dependa de inferencias o convenciones implícitas para saber qué opciones mostrar.

Además, los tipos primitivos compartidos de `Prompt.parameters` reutilizan por defecto la misma semántica base ya acordada para `PropertyAssignment`. La intención es impedir que `text`, `number`, `date`, `boolean` o `enum_token` empiecen a significar cosas distintas según el rincón del dominio en el que aparezcan.

Cuando una definición de parámetro usa una clave canónica del vocabulario compartido, el tipo base de esa clave no queda libre para redefinición local en cada prompt. La intención es que el vocabulario canónico siga siendo contrato real y no sólo un catálogo de nombres bonitos reutilizables con semánticas incompatibles.

La cardinalidad base sigue la misma regla. Si una clave canónica nace como escalar o como lista, esa forma base queda gobernada por el vocabulario compartido y no se redefine libremente en cada prompt individual.

Dentro del seed inicial, `subject` nace como parámetro escalar de tipo `text`. La intención es cubrir de forma portable y suficientemente amplia el foco principal del prompt sin exigir desde el día 1 un vocabulario cerrado ni una estructura más compleja.

`context` sigue la misma lógica y nace también como parámetro escalar de tipo `text`. La intención es capturar situación, trasfondo o marco de uso sin convertir esa capa inicial en una estructura más rígida de lo necesario.

`tone`, en cambio, nace como parámetro escalar de tipo `enum_token`. La intención es introducir vocabulario compartido en un lugar donde la consistencia semántica suele aportar mucho más valor que el texto libre totalmente abierto.

`style` nace como parámetro multivalue con tipo base `enum_token`. La intención es permitir composición de rasgos o influencias estilísticas sin abandonar el vocabulario controlado ni degradar esta clave a texto libre completamente abierto.

`constraints` nace como parámetro multivalue con tipo base `text`. La intención es capturar varias restricciones independientes sin forzar todavía un catálogo cerrado prematuro, manteniendo al mismo tiempo una forma base explícita y consistente.

Para `tone` y `style`, además, la dirección acordada es apoyarse por defecto en vocabularios compartidos entre prompts. La intención es que esas claves canónicas no se limiten a compartir nombre, sino también un lenguaje reusable y consistente para UI, búsqueda y authoring.

Eso no impide que un prompt concreto estreche ese vocabulario a un subconjunto local cuando necesite acotarlo. Lo que no debe hacer es ampliarlo con tokens fuera del catálogo compartido, porque eso volvería a convertir una clave canónica en un vocabulario privado disfrazado.

Cuando un parámetro es multivalue, la semántica por defecto de esa multiplicidad es colección sin orden y sin duplicados. La intención es evitar ruido y secuencias accidentales, dejando cualquier semántica más fuerte de orden sólo para una decisión posterior explícita.

Los hints de UI —por ejemplo, sugerir `select`, `chips`, `textarea`, `slider` o análogos— no forman parte del contrato semántico base del parámetro. Si existen, pertenecen a metadata opcional de presentación y no deben reescribir tipo, cardinalidad ni identidad del parámetro portable.

Cada parámetro, además, debe declarar explícitamente si es requerido u opcional. La intención es que la obligatoriedad no dependa de defaults, ejemplos, placeholders o convenciones implícitas de una UI concreta, sino del contrato authored portable del prompt.

La presencia de un default no altera por sí sola esa requiredness. La intención es mantener separados dos ejes distintos: la conveniencia de partir de un valor sugerido y la obligación semántica de completar o confirmar el parámetro.

La intención es cubrir un núcleo reusable y consultable sin inflar el contrato con microtipos prematuros ni empujar vocabularios controlados a texto libre.

Cuando una propiedad acepte varios valores, esa multiplicidad no crea una especie nueva de tipo por cada caso. La dirección acordada es tratar el multivalor como un wrapper genérico sobre el tipo base correspondiente, manteniendo el modelo pequeño y composable.

Dentro de ese set, `enum_token` no expresa el label humano visible sino el identificador estable de un vocabulario controlado. La presentación y localización de ese valor pertenecen a UI o a catálogos compartidos, no al valor portable mismo.

`date`, por su parte, se interpreta primero como fecha-calendario semántica. El modelo inicial no lo usa como bolsa genérica para instantes o datetimes arbitrarios; si ese tipo de precisión temporal aparece más adelante, deberá entrar como expansión explícita.

`number` también se mantiene deliberadamente unificado en esta primera versión. La separación entre `integer` y `decimal` sólo debería aparecer más adelante si el dominio demuestra que esa distinción cambia reglas reales y no sólo detalles de implementación o storage.

Cuando una `PropertyAssignment` es multivalue, una colección vacía no se considera un valor portable distinto. Si no hay ningún valor presente, el estado correcto es ausencia de asignación, no una asignación vacía.

Además, el multivalue se interpreta como colección sin orden. En esta primera definición portable, importa qué valores están presentes, no la posición en la que aparecen.

Esa colección, además, no admite duplicados. Si el mismo valor aparece repetido, la repetición no agrega semántica portable y debe colapsarse al conjunto de valores únicos.

Para el tipo `text`, la regla equivalente es que una cadena vacía o compuesta sólo por whitespace no constituye un valor portable autónomo. Si no hay contenido textual semántico real, el estado correcto sigue siendo ausencia de asignación.

Para el tipo `boolean`, en cambio, `false` sí constituye un valor portable válido. El modelo debe distinguir con claridad entre negación explícita (`false`) y ausencia de asignación.

Cuando una `Property` declara allowed values o vocabulario controlado, la representación preferente del assignment debe usar `enum_token`. La intención es que el contrato exprese de forma explícita que no se trata de texto libre validado por fuera, sino de selección dentro de un vocabulario gobernado.

Para propiedades numéricas con unidad semántica estable, la unidad vive por defecto en la definición de `Property`. La primera versión del contrato no repite esa unidad en cada assignment salvo que más adelante aparezca una necesidad explícita de modelar unidades variables por asignación.

El contrato portable de `PropertyAssignment` tampoco usa `null` como tipo de valor. Si no existe valor efectivo, la semántica correcta es ausencia de asignación —o ausencia del valor permitido dentro de las reglas ya fijadas— y no una asignación explícita a `null`.

En el caso de `date`, la representación portable correspondiente se fija como fecha ISO local con formato `YYYY-MM-DD`. La intención es alinear la forma con la semántica ya acordada de fecha-calendario, evitando timestamps, offsets y datetimes disfrazados.

Para `enum_token`, la representación portable se expresa mediante identificadores estables en minúsculas con formato `snake_case`. De esa manera el valor sigue siendo un token semántico portable y no deriva hacia labels humanos, casing inconsistente o strings libres con apariencia de catálogo.

Para `number`, la representación portable se mantiene como escalar numérico real. Cualquier formateo visual, localización, padding o presentación humana pertenece a la UI y no al valor portable del assignment.

Para `text`, la semántica acordada es texto escalar simple. No se usa este tipo como vehículo para rich text, Markdown o mini-documentos, porque esa complejidad pertenece a otros artefactos del dominio y no al contrato básico de `PropertyAssignment`.

Como consecuencia de las reglas de ausencia ya fijadas, si una `PropertyAssignment` queda sin valor efectivo, el estado normalizado correcto es que la asignación deje de existir. La arquitectura objetivo no conserva shells vacíos sólo para representar una pseudo-presencia sin contenido.

Para el tipo `number`, además, el contrato portable se restringe a números finitos reales. `NaN`, `Infinity` y `-Infinity` quedan fuera porque no aportan semántica portable robusta y suelen degradar interoperabilidad, filtros y serialización.

Para `text`, la normalización portable recorta whitespace exterior antes de persistir el valor. La intención es evitar falsos distintos puramente editoriales y reforzar la regla ya acordada según la cual texto vacío o sólo en blanco equivale a ausencia de asignación.

Además, el set de tipos de valor no se amplía ad hoc por cada `Property`. Si en el futuro aparece un nuevo tipo con valor transversal real, debe entrar como expansión explícita del vocabulario común de `PropertyAssignment`, no como dialecto local de una sola definición.

La definición de `Property` tampoco se limita a sugerir el tipo: lo gobierna. Cada `PropertyAssignment` debe ajustarse al tipo esperado por esa property, de modo que una misma faceta no derive accidentalmente hacia varios tipos incompatibles según el objeto o el flujo que la haya escrito.

La cardinalidad sigue la misma regla. Si una `Property` es single-value o multivalue, esa decisión forma parte de su contrato y no queda librada a cada assignment individual. Así la faceta mantiene coherencia semántica, de validación y de consumo en UI/API.

La aplicabilidad declarada por una `Property` también opera como restricción real. Si la faceta se limita a cierto perímetro de objetos o familias, un `PropertyAssignment` fuera de ese alcance se considera inválido y no una simple advertencia editorial.

Los allowed values siguen la misma lógica. Si una `Property` declara un vocabulario permitido, un `PropertyAssignment` fuera de ese set se considera inválido. La intención es que el vocabulario controlado actúe como contrato real y no como sugerencia blanda de UI.

Si el tipo de la `Property` es `enum_token`, ese vocabulario no puede quedar implícito. La definición debe declarar o referenciar explícitamente la fuente de verdad que gobierna los tokens válidos, de modo que el contrato siga siendo verificable y no derive hacia identificadores huérfanos.

También queda fijada una frontera importante con `Media Core`: `PropertyAssignment` no actúa como contenedor universal de metadata técnica extraída desde archivos. La metadata primaria de especialización —por ejemplo, dimensiones, duración, codec, EXIF o análogos— vive primero en el núcleo media y sólo cruza a `PropertyAssignment` cuando una faceta semántica compartida justifica realmente esa proyección transversal.

En la misma línea de contrato explícito, `Property` no debe depender de su label visible como identidad. Necesita un identificador portable estable que sobreviva a cambios editoriales de presentación y permita referenciar la faceta sin acoplarla al texto humano mostrado en UI.

Ese identificador portable se expresa como slug estable en minúsculas con formato `snake_case`, manteniendo coherencia con otros vocabularios gobernados del sistema y evitando deriva por casing o variantes editoriales del naming.

Además, ese slug se trata como identidad estable y no como label editable más. Si alguna vez necesita cambiar, el movimiento correcto es una migración explícita y no un simple rename editorial sin consecuencias contractuales.

Esto protege tres cosas a la vez:

- un lenguaje consistente entre contextos y tipos de objeto,
- unicidad semántica,
- valores consultables e indexables sin depender de blobs opacos,
- constraints e indexación razonables,
- y una separación clara entre definición (`Property`) y aplicación concreta (`PropertyAssignment`).

También deja una frontera sana para el arranque: `Taxonomy` define el vocabulario, pero no se aplica propiedades a sí misma por defecto salvo que un caso futuro lo justifique explícitamente.

## Batch 2: `Prompt` + `Note` + `Wildcard`

Este batch cierra la familia de artefactos compartidos. Los tres son standalone, pero no son la misma cosa.

Las decisiones más difíciles de revertir sobre su modelo file-backed quedaron formalizadas además en `docs/adr/0007-taxonomy-text-artifacts-file-backed.md`.

### `Prompt`

- artefacto creativo y semántico,
- textual por defecto,
- standalone,
- con metadata opcional,
- vinculable a múltiples objetos.

En modo file-backed, su formato base es Markdown con metadata authored en frontmatter.

En cambio, campos de workflow como `status`, `priority` o `presetId` no forman parte del contrato portable/authored inicial. Si el producto necesita esos estados, deben vivir en la capa operativa o en un subdominio más claramente orientado a workflow, no dentro del knowledge portable por defecto.

Fuera de eso, `Note` no introduce una capa authored específica propia en la primera versión. El núcleo compartido más el cuerpo Markdown cubren suficientemente su identidad como knowledge object portable.

Ese cuerpo Markdown, además, no debe quedar vacío en el estado canónico del artefacto. Los drafts completamente en blanco pueden existir durante edición, pero una `Note` portable válida debe contener contenido authored real.

Ese contrato inicial puede incluir una capa específica pequeña y gobernada además del núcleo authored compartido. La dirección acordada no es dejar a `Prompt` totalmente plano ni canonizar de golpe todo el shape legacy existente.

Dentro de esa capa mínima, la decisión actual es empezar por `purpose` y `parameters`. Campos como `model` o el resto del shape legacy más granular (`style`, `lighting`, `mood`, `technique`, etc.) quedan fuera del contrato inicial hasta que una necesidad real del producto justifique formalizarlos.

En esa misma capa, `purpose` no actúa como alias de `summary`. `summary` sigue siendo el abstract breve compartido del artefacto, mientras que `purpose` expresa la intención de uso específica del `Prompt`.

`parameters`, además, no debe resolverse como mapa JSON libre sin contrato. La dirección acordada es tratarlo como bloque authored estructurado y gobernado, con shape pequeño y extensible bajo reglas explícitas, en vez de permitir crecimiento arbitrario desde el día 1.

La representación inicial acordada para ese bloque es una colección de entradas tipadas y gobernadas, no un set rígido de campos acoplado a un runtime o herramienta específica. Así `Prompt` conserva portabilidad semántica sin volver a caer en JSON libre.

En esa primera versión, los valores permitidos en las entradas de `parameters` se limitan a escalares y listas planas de escalares. Los objetos anidados arbitrarios quedan fuera del contrato inicial para evitar que el bloque derive hacia un mini documento JSON sin frontera clara.

Las claves de ese bloque tampoco quedan completamente libres. La dirección acordada es apoyarse en un vocabulario canónico curado para los casos frecuentes, dejando claves custom sólo como escape hatch explícito y distinguible, no como camino indistinto respecto del vocabulario compartido.

Cuando aparezcan esas claves custom, la distinción no debe esconderse en prefijos o trucos incrustados dentro del nombre. Debe expresarse mediante metadata explícita separada de la propia clave, para que el contrato portable conserve una diferencia clara entre vocabulario canónico y extensión.

Ese vocabulario canónico, además, no se deja vacío como mera intención futura. La dirección acordada es empezar con un seed mínimo real desde el arranque, aunque luego crezca con cuidado según el dominio lo pida.

Ese seed inicial no debe poblarse con knobs técnicos dependientes de una herramienta, modelo o runtime concreto. La primera capa canónica se centra en variables semánticas y portables del prompt; cualquier detalle técnico específico queda fuera del núcleo inicial o entra como extensión posterior.

Eso no significa que todo concepto legacy expulsado del top-level quede prohibido para siempre. Si alguno reaparece como parámetro con semántica portable real, puede formar parte del vocabulario canónico de `parameters`; lo que se evita es su canonización como campo fijo del top-level o su reintroducción como knob técnico disfrazado.

El seed mínimo inicial acordado para ese vocabulario es: `subject`, `context`, `tone`, `style` y `constraints`. Ese set actúa como primer lenguaje compartido real y puede crecer más adelante sólo mediante decisiones explícitas.

Esas claves canónicas se tratan como identificadores estables del contrato portable. La UI puede traducir sus etiquetas visibles según idioma o contexto, pero el nombre portable de la clave no cambia con la localización.

Semánticamente, ese bloque describe las variables del template de `Prompt`, no los valores canónicos de una ejecución concreta. Si el producto necesita almacenar un prompt ya resuelto con valores, eso pertenece a otra capa u objeto operativo y no al contrato authored portable base.

Eso no impide que cada definición authored de parámetro incluya un default o example opcional para ayudar a la comprensión y reutilización del prompt. Ese valor sigue siendo orientativo o inicial; no se convierte por eso en el valor canónico de una ejecución concreta.

Además, cada parámetro debe declarar explícitamente su tipo esperado. La dirección acordada es no dejar esa información implícita en ejemplos, defaults o interpretaciones de UI, para que `Prompt.parameters` funcione como contrato consumible y validable de forma consistente.

Ese contrato de tipos no queda como abstracción pendiente. La dirección acordada es arrancar ya con un seed inicial pequeño y explícito para los tipos de parámetro, de modo que `Prompt.parameters` no vuelva a convertirse en un espacio abierto por omisión.

El seed mínimo inicial acordado para esos tipos es:

- `text`
- `number`
- `boolean`
- `date`
- `enum_token`

Además, el contenido del `Prompt` no puede invocar variables fantasmas. Todo placeholder usado en el cuerpo debe corresponder a un parámetro declarado. En cambio, puede existir un parámetro declarado todavía no usado en el contenido, por ejemplo durante authoring, evolución del template o variantes futuras.

Esa tolerancia no se extiende por defecto a parámetros marcados como requeridos. Si un parámetro es obligatorio pero no aparece consumido en el contenido, el estado se considera inválido por defecto, porque el contrato estaría exigiendo un dato que el prompt todavía no utiliza realmente.

El orden de esas definiciones no forma parte de la semántica canónica del contrato. Si alguna UI o flujo editorial necesita mantener cierto orden de aparición, ese orden se trata como ayuda de authoring o presentación, no como identidad de dominio.

Además, dentro de un mismo `Prompt`, cada clave puede tener como máximo una definición canónica. La identidad de la variable no se duplica por conveniencia editorial ni por variantes locales dentro del mismo artefacto.

La forma de esas claves también queda gobernada: se expresan como slugs estables en minúsculas con formato `snake_case`. Eso mantiene consistencia entre contrato portable, placeholders y tooling futuro.

Cuando la clave pertenece al vocabulario canónico compartido, su presentación humana no necesita repetirse en cada archivo. La UI y el registro compartido pueden resolver labels y traducciones; el portable sólo incorpora ayuda authored opcional —por ejemplo descripciones o ejemplos contextuales— cuando realmente agrega valor para ese artefacto concreto.

Si una clave custom acaba chocando con una futura clave canónica equivalente, el sistema no mantiene ambas como sinónimos perpetuos. La dirección acordada es que la clave canónica desplace a la custom y que esta última quede en estado legacy/migrable, preservando una ruta clara de normalización del lenguaje compartido.

La transición no se resuelve ni con ruptura brutal ni con compatibilidad eterna. La dirección acordada es admitir lectura temporal del legado durante la migración, pero normalizar la representación portable a la clave canónica en el momento de guardar el artefacto.

Si esa migración implica además cambiar el tipo base o la cardinalidad del parámetro, la normalización no debe ocurrir de forma silenciosa. La dirección acordada es tratar ese caso como migración explícita, para que la conversión quede gobernada y no dependa de heurísticas opacas.

Mientras una clave siga siendo custom, no alcanza con marcarla como extensión. Debe incluir al menos una descripción o intención authored breve que explicite su significado local, de modo que el artefacto siga siendo comprensible y que una futura promoción o migración no dependa de adivinación arqueológica.

Eso no habilita, sin embargo, un sistema tipado privado por clave custom. La dirección acordada es que también esas extensiones usen el mismo vocabulario de tipos compartido de `Prompt.parameters`, para que la extensibilidad viva en la semántica de la clave y no en romper el contrato base.

Si además existe una cercanía semántica clara con una clave canónica ya disponible, la extensión puede declarar opcionalmente ese vínculo como puente explícito hacia el vocabulario compartido. Ese puente ayuda a ordenar migraciones y lectura de intención, pero no se vuelve obligatorio en todos los casos.

Cuando ese puente existe, no se dispersa hacia múltiples afinidades simultáneas. La dirección acordada es que una clave custom pueda señalar, como máximo, una sola clave canónica próxima como referencia dominante.

El vocabulario canónico de `parameters` tampoco se rompe por familia o categoría desde el arranque. La dirección acordada es un catálogo global por defecto, con aplicabilidad opcional cuando alguna clave tenga sentido sólo en ciertos tipos de prompt.

Cuando esa aplicabilidad se declara explícitamente, no opera como sugerencia blanda. La restricción se considera real: si una clave se acota a cierto perímetro de uso, el contrato la trata como no aplicable fuera de ese perímetro.

No debe quedar reducido a campo de otra entidad.

El cuerpo authored principal del `Prompt` debe contener contenido no vacío en el estado canónico del artefacto. Los drafts completamente vacíos pueden existir como estado transitorio de edición, pero no como representación portable válida del prompt.

En la dirección objetivo, `Prompt` debe soportar modo file-backed fuerte, pero no necesita ser obligatoriamente file-backed desde el minuto cero.

Si nace inline y luego se externaliza a archivo, sigue siendo el mismo `Prompt` a nivel de identidad de dominio.

### `Note`

- artefacto textual/markdown,
- knowledge object reutilizable,
- standalone,
- vinculable a múltiples objetos.

En modo file-backed, su formato base es Markdown con metadata authored en frontmatter.

No debe quedar reducido a comentario colgante de una sola cosa.

En la dirección objetivo, `Note` debe soportar modo file-backed fuerte, pero no necesita ser obligatoriamente file-backed desde el minuto cero.

Si nace inline y luego se externaliza a archivo, sigue siendo la misma `Note` a nivel de identidad de dominio.

### `Wildcard`

- artefacto standalone,
- patrón reutilizable,
- semántico, no narrativo,
- con autoría simple basada en texto.

Su representación portable objetivo es un único archivo con cabecera mínima y luego cuerpo line-based simple.

#### Forma inicial acordada

La forma inicial de autoría es deliberadamente simple:

- una entrada por línea,
- sin sintaxis extra,
- ejemplo: `color.txt` con `rojo`, `verde`, `azul`.

Ese formato line-based simple es el contrato base de `Wildcard` en la arquitectura objetivo.

La única excepción aceptada es una cabecera mínima portable para identidad y metadata authored esencial; la simplicidad estricta sigue perteneciendo al cuerpo del listado.

Eso también implica que el contrato inicial de `Wildcard` se mantiene plano y standalone. Campos de jerarquía authored como `parentId` o `children` quedan fuera del portable inicial y no forman parte de esta primera definición.

En la misma línea, la cabecera mínima inicial de `Wildcard` no incorpora campos específicos propios más allá del núcleo authored compartido. El valor distintivo del artefacto vive en su cuerpo line-based simple, no en una acumulación temprana de metadata adicional.

Dentro de ese cuerpo line-based, entradas duplicadas no se consideran contenido portable distinto. La dirección acordada es tratarlas como inválidas, de modo que cada línea aporte una opción semántica única y reusable.

Las líneas vacías o compuestas sólo por whitespace tampoco se consideran entradas válidas. La dirección acordada es normalizarlas fuera del contenido portable para que el espacio visual siga siendo ayuda editorial y no pseudo-semantica del vocabulario.

Las entradas válidas, además, se normalizan recortando whitespace exterior antes de persistirse. La intención es evitar falsos distintos puramente editoriales y mantener el vocabulario line-based lo más limpio y reusable posible.

El orden de esas entradas no se trata como semántica portable por defecto. Si un editor o una UI necesita mostrarlas en cierto orden, esa decisión pertenece a authoring o presentación, no al significado base del `Wildcard`.

En esta primera versión, además, cada entrada no lleva un identificador propio separado. La dirección acordada es mantener el artefacto line-based simple y tratar cada línea como texto normalizado, sin introducir todavía una subcapa de identidad interna por opción.

Por la misma razón, una línea representa sólo una entrada textual y no admite en v1 sintaxis inline de comentario o metadata por opción. La intención es que `Wildcard` siga siendo un formato line-based puro y no derive hacia un mini lenguaje antes de demostrar esa necesidad.

También aquí aplica la misma regla: la cabecera usa un set pequeño y gobernado de campos authored, no un espacio top-level arbitrario.

Eso deja espacio para crecer más tarde si aparece una necesidad real, sin inventar complejidad prematura.

`Wildcard` sí queda definido como file-backed por defecto en la arquitectura objetivo.

## Fuente canónica de los artefactos textuales

La dirección acordada es file-backed cuando aplique.

Eso significa:

- el texto humano vive en archivos (`.md`, `.txt` u otros formatos simples),
- cuando un artefacto es file-backed, el archivo es la fuente canónica de verdad,
- los artefactos file-backed viven bajo raíces canónicas por familia,
- la app gestiona metadata, indexación, búsqueda y relaciones,
- y la base de datos funciona como capa de soporte e índice, no como única cárcel del contenido.

Importar o enlazar archivos externos puede existir, pero no sustituye la existencia de una casa oficial por familia de artefacto.

Cuando entra un artefacto textual desde una ruta externa, el comportamiento preferido es adoptarlo dentro de esa casa oficial. El enlace in-place puede existir, pero queda como modo explícito y secundario.

Si un archivo canónico cambia fuera de la app, el archivo gana para el contenido authored y la app debe reindexar/refrescar su capa derivada. El conflicto sólo aparece cuando la propia app conserva cambios locales pendientes que todavía no se sincronizaron.

Además, la identidad del artefacto file-backed debe ser estable e independiente de la ruta. Renombrar o mover el archivo no crea otro `Prompt`, `Note` o `Wildcard`; sólo cambia su ubicación física.

Esa identidad estable debe viajar con la representación portable del artefacto y no vivir sólo en la DB.

Del mismo modo, el nombre visible canónico del artefacto es authored y no depende obligatoriamente del filename físico, aunque ambos puedan coincidir muchas veces por conveniencia.

Cuando la eliminación se dispara desde la app, la semántica por defecto es borrado lógico/restaurable. El purge físico del archivo canónico pertenece a una operación posterior y explícita.

El modelo inicial no incorpora versionado explícito de dominio para `Prompt`, `Note` o `Wildcard`. Si alguna vez aparece, debe justificarse como necesidad real del producto y no como complejidad preventiva.

En consecuencia, la DB no debe mantener una segunda verdad canónica del texto humano. Puede guardar:

- metadata del artefacto,
- identidad/ruta del archivo cuando exista,
- estado de sincronización,
- hashes o huellas operacionales,
- excerpts,
- e índices o caches derivados para búsqueda.

Si alguna vez materializa contenido textual por motivos técnicos, esa materialización se trata como cache derivada interna y no como campo de dominio editable.

La búsqueda normal del producto opera sobre esa proyección derivada mantenida por la app, no leyendo el filesystem en vivo en cada consulta.

Además, en `Prompt` y `Note` file-backed, la frontera de metadata queda así:

- la metadata authored pertenece al archivo,
- la metadata operativa y relacional pertenece a la DB.

Para `Note`, eso incluye explícitamente campos de workflow como `status`, `priority` y `presetId`, que quedan fuera de la metadata authored portable.

Eso permite que el conocimiento humano viaje con el artefacto sin arrastrar a archivo toda la capa operacional del producto.

Esa metadata authored no debe abrirse como top-level libre sin contrato. La dirección acordada es un set canónico, pequeño y gobernado de campos, dejando cualquier extensión futura como mecanismo explícito y acotado.

Además, la familia de artefactos textuales usa un núcleo pequeño de metadata authored compartida, con capas finas específicas por artefacto cuando hagan falta. La intención no es volverlos idénticos, sino impedir que cada uno invente un dialecto completo desde el día 1.

En particular, `Prompt` sí admite una capa específica mínima en el contrato inicial. Esa capa debe ser pequeña, explícita y gobernada; cualquier expansión mayor necesita decisión posterior y no puede entrar por arrastre del modelo legacy actual.

Dentro de ese núcleo compartido, el rótulo humano visible canónico se expresa como `title`. Cualquier `name` legacy que sobreviva en código o APIs de transición debe tratarse como alias o adaptación, no como parte del contrato file-backed futuro.

El abstract breve canónico compartido se expresa como `summary`. Cualquier `description` legacy que sobreviva en código o APIs de transición debe tratarse como alias o adaptación y no como parte del contrato authored futuro.

`category` también forma parte del núcleo authored compartido, pero con una semántica deliberadamente liviana y local al artefacto. No sustituye a `Tag` ni compite con la clasificación relacional global del dominio.

`emoji` y `color` pueden seguir existiendo en la representación portable, pero como hints authored opcionales de presentación compartidos. No pertenecen al núcleo semántico mínimo del artefacto.

`isFavorite` queda explícitamente fuera de la representación portable y de la metadata authored. Sigue siendo un marcador o relación operativa del producto, no una propiedad canónica del archivo.

`featuredImage` también queda explícitamente fuera de la representación portable y de la metadata authored. Si el producto necesita una media destacada canónica para `Prompt`, `Note` o `Wildcard`, eso debe resolverse como relación o selección explícita hacia un `Asset` dentro de la capa relacional u operacional.

La pertenencia canónica a `Tag` también queda fuera de la representación portable. Si el archivo alguna vez lleva nombres o slugs de tags, esos valores sólo actúan como hints de autoría o importación para que la app resuelva relaciones explícitas; no sustituyen la clasificación relacional global.

## Rol editorial de la app

La dirección acordada es que la app siga siendo un editor de autoría de primer nivel para `Prompt`, `Note` y `Wildcard`.

Eso significa que, cuando el artefacto está en modo file-backed:

- la edición desde UI escribe sobre el archivo canónico,
- la app refresca o reindexa después su capa derivada,
- y el hecho de que el archivo mande no expulsa a la app del flujo de autoría.

Los editores externos pueden seguir existiendo, pero como opción complementaria, no como única forma legítima de editar el contenido authored.

## Frontera con adjuntos y media local

En el modelo inicial, `Prompt` y `Note` no poseen paquetes locales de adjuntos como parte normal de su identidad canónica.

Si necesitan referenciar media, deben hacerlo mediante:

- relaciones con `Assets` existentes,
- o enlaces explícitos.

La intención es proteger la frontera con `Media Core` y evitar que cada artefacto textual se convierta en un mini contenedor opaco de archivos.

## Modelo de guardado authored

La escritura al archivo canónico se confirma mediante una acción explícita de guardar.

Eso implica que:

- el commit canónico al archivo no ocurre automáticamente en cada pulsación,
- la UI puede tener draft local o ayudas de autosave auxiliares si alguna vez hacen falta,
- pero el acto de persistir la verdad file-backed sigue siendo una confirmación explícita.

Esto protege mejor la fuente canónica y encaja con la UX actual basada en formularios con submit/guardar.

## Dirección del backing mode

Para `Prompt` y `Note`, externalizar a file-backed se considera una maduración estable del artefacto.

Por eso, volver de file-backed a inline no forma parte del flujo normal del producto. Si alguna vez existe, debe tratarse como migración o escape hatch explícito, no como toggle cotidiano de ida y vuelta.

## Relación con los demás contextos

### Con `Media Core`

`Taxonomy` describe y clasifica assets y organizers, pero no los posee.

### Con `Worldbuilding`

`Taxonomy` ofrece vocabulario y artefactos compartidos, pero no absorbe `Narrative Entities` ni se convierte en un duplicado suave de worldbuilding.

## Riesgos a evitar

- convertir `Tag` en organizer encubierto,
- convertir `Property` en custom fields sin semántica común,
- convertir `Prompt`, `Note` y `Wildcard` en simples campos de tablas ajenas,
- y usar `Taxonomy` como cajón donde tirar cualquier cosa difícil de ubicar.

## Criterio de salida del slice

El slice `Taxonomy` estará bien resuelto cuando:

- `Tag` y `Property` funcionen como catálogos compartidos reales,
- los valores de propiedad ya no dependan de blobs arbitrarios para existir conceptualmente,
- `Prompt`, `Note` y `Wildcard` tengan forma propia y reusable,
- y el resto del sistema consuma `Taxonomy` sin volver a inventar dialectos paralelos.
