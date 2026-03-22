# Documentación de Transformadores de Image

## Descripción

Los transformadores de **Image** permiten mapear, serializar, deserializar y extender la entidad Image para distintos usos (UI, API, persistencia, estadísticas, etc.), asegurando siempre el uso de tipos canónicos y validación robusta.

---

## Diagrama de Flujo (Mermaid)

```mermaid
flowchart TD
    A[Image (Drizzle/Raw)] --> B[mappers.ts]
    B -->|fromDrizzleImage| C[Image]
    B -->|fromDrizzleImages| D[Image[]]
    B -->|toDrizzleImage| E[DrizzleImageCreateInput]

    F[Image] --> G[serializers.ts]
    G -->|extendImage| H[ImageExtended]
    G -->|extendImages| I[ImageExtended[]]
    G -->|validateImage| J[Validada con Zod]

    K[Raw Data] --> L[transformer.ts]
    L -->|transformImage| M[Image]
    L -->|transformImageToWithStats| N[ImageWithStats]

    O[index.ts] --> P[Exportación controlada]
    P --> B
    P --> G
    P --> L
```

---

## Funciones Principales

### Mappers (`mappers.ts`)

Conversión entre formatos de datos internos y externos:

```typescript
// De Drizzle a dominio
export function fromDrizzleImage(DrizzleImage: DrizzleImage): Image;
export function fromDrizzleImages(DrizzleImages: DrizzleImage[]): Image[];

// De dominio a Drizzle (para operaciones de creación/actualización)
export function toDrizzleImage(image: ImageCreateInput): DrizzleImageCreateInput;
export function toDrizzleImageUpdate(image: ImageUpdateInput): DrizzleImageUpdateInput;

// Mapeos específicos para UI
export function toImageListItem(image: Image): ImageListItem;
export function toImageCard(image: ImageExtended): ImageCard;
```

### Serializers (`serializers.ts`)

Extensión y validación de entidades:

```typescript
// Extensión con propiedades calculadas
export function extendImage(image: Image): ImageExtended;
export function extendImages(images: Image[]): ImageExtended[];

// Validación estructurada
export function validateImage(data: unknown): Image;
export function validateImageInput(data: unknown): ImageCreateInput;
```

### Transformer (`transformer.ts`)

Transformación completa de datos crudos:

```typescript
export function transformImage(data: unknown): Image;
export function transformImageToWithStats(image: Image, stats: ImageStats): ImageWithStats;
```

---

## Integración con Server Actions

Las Server Actions utilizan estos transformers para procesar datos antes de devolverlos al cliente:

```typescript
// En src/app/actions/images/crud.actions.ts
export async function getImage(id: string): Promise<Image | null> {
	const DrizzleImage = await Drizzle.image.findUnique({ where: { id } });
	if (!DrizzleImage) return null;
	return fromDrizzleImage(DrizzleImage);
}

// En un componente/hook cliente
const image = await getImage(id);
if (image) {
	const extendedImage = extendImage(image);
	// Usar extendedImage en la UI
}
```

---

## Tipos utilizados

- `Image`: Tipo base con propiedades fundamentales
- `ImageExtended`: Image + propiedades calculadas para UI
- `ImageWithStats`: Image + estadísticas de uso
- `ImageCreateInput`: Datos para crear una nueva imagen
- `ImageUpdateInput`: Datos para actualizar una imagen existente

---

## Buenas Prácticas

1. **Nunca** importar tipos de Drizzle en archivos que puedan ser usados por el cliente
2. Usar funciones de **extensión** (`extendImage`) para agregar propiedades calculadas
3. Validar siempre los datos de entrada con Zod antes de procesarlos
4. Mantener la consistencia en el nombrado de funciones: `fromDrizzle*`, `extend*`, etc.

Para más detalles sobre la implementación, consulta los archivos específicos en `src/transformers/image/`.
