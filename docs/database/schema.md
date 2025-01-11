# Documentación del Schema

## Modelos Principales

### Image

Representa una imagen en el sistema con sus metadatos y relaciones.

**Campos principales:**

- `id`: Identificador único
- `hash`: Hash único de la imagen
- `name`: Nombre del archivo
- `path`: Ruta en el sistema de archivos
- `metadata`: Metadatos en formato JSON
- `thumbnail`: Miniatura de la imagen

**Relaciones:**

- `folder`: Carpeta contenedora
- `collections`: Colecciones a las que pertenece
- `tags`: Etiquetas asociadas
- `albums`: Álbumes que la contienen
- `characters`: Personajes relacionados
- `places`: Lugares relacionados
- `objects`: Objetos relacionados

### Place

Representa un lugar o ubicación en el sistema.

**Campos principales:**

- `id`: Identificador único
- `name`: Nombre único del lugar
- `emoji`: Emoji representativo
- `color`: Color asociado
- `region`: Región geográfica
- `type`: Tipo de lugar
- `climate`: Clima predominante
- `population`: Población
- `dangers`: Lista de peligros (JSON)
- `resources`: Lista de recursos (JSON)
- `lore`: Historia y mitología
- `history`: Historia documentada

**Índices:**

- `name`: Búsqueda por nombre
- `type`: Filtrado por tipo
- `climate`: Filtrado por clima
- `region`: Filtrado por región

### Character

Representa un personaje en el sistema.

**Campos principales:**

- `name`: Nombre único
- `level`: Nivel del personaje
- `class`: Clase o profesión
- `race`: Raza del personaje
- `alignment`: Alineamiento
- `backstory`: Historia de fondo
- `stats`: Estadísticas (JSON)

### Object

Representa un objeto o item en el sistema.

**Campos principales:**

- `name`: Nombre único
- `type`: Tipo de objeto
- `rarity`: Rareza
- `properties`: Propiedades (JSON)
- `requirements`: Requisitos (JSON)
- `origin`: Origen del objeto

## Modelos de Soporte

### Activity

Registra actividades y eventos en el sistema.

**Campos:**

- `type`: Tipo de actividad
- `description`: Descripción
- `imageId`: Imagen relacionada (opcional)

### QueueJob

Gestiona trabajos en cola para procesamiento asíncrono.

**Campos:**

- `queue`: Cola de trabajo
- `status`: Estado del trabajo
- `attempts`: Intentos realizados
- `progress`: Progreso actual
- `priority`: Prioridad del trabajo

## Convenciones de Datos

### Campos JSON

Los campos que almacenan JSON deben seguir estas estructuras:

**Properties (Objetos):**

```json
["propiedad1", "propiedad2"]
```

**Requirements (Objetos):**

```json
{
  "level": number,
  "class": string[],
  "attributes": object
}
```

**Stats (Personajes):**

```json
{
  "strength": number,
  "dexterity": number,
  "constitution": number,
  "intelligence": number,
  "wisdom": number,
  "charisma": number
}
```

### Valores por Defecto

- Colores: Formato hexadecimal (#3b82f6)
- Emojis: Unicode emoji
- Estados: ["pending", "processing", "completed", "failed"]
- Alineamientos: ["lawful good", "neutral good", "chaotic good", "lawful neutral", "true neutral", "chaotic neutral", "lawful evil", "neutral evil", "chaotic evil"]
