# ConceptCard

Componente para mostrar información de conceptos en formato de tarjeta con un diseño inspirado en cartas Magic.

## Estructura

El componente ConceptCard está dividido en varios subcomponentes:

- **ConceptCard**: Componente principal que integra todos los demás
- **ConceptCardContent**: Muestra la descripción, etiquetas y contadores de relaciones
- **ConceptCardFooter**: Muestra información de fechas, categoría y contadores
- **ConceptCardImages**: Muestra las imágenes relacionadas con el concepto
- **concept-server-actions.ts**: Contiene las acciones del servidor para obtener datos

## Uso

```tsx
import { ConceptCard } from '@/components/cards/concept-card';

// En un componente
function ConceptList({ concepts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concepts.map(concept => (
        <ConceptCard
          key={concept.id}
          concept={concept}
          onClick={() => handleConceptClick(concept)}
        />
      ))}
    </div>
  );
}
```

## Props

### ConceptCard

| Prop | Tipo | Descripción |
|------|------|-------------|
| concept | `Concept & { _count?: { images: number; prompts: number; }; imageCount?: number; promptCount?: number; }` | Datos del concepto a mostrar |
| onClick | `() => void` | Función opcional a ejecutar al hacer clic en la tarjeta |
| className | `string` | Clases CSS adicionales para personalizar la tarjeta |
| style | `React.CSSProperties` | Estilos CSS adicionales |

## Características

- **Diseño Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Interacción**: Animaciones sutiles al pasar el cursor y hacer clic
- **Accesibilidad**: Soporte para navegación por teclado y atributos ARIA
- **Personalización**: Los colores se derivan del color del concepto
- **Estadísticas**: Muestra contadores de relaciones con otras entidades
- **Imágenes**: Muestra las últimas 6 imágenes relacionadas con el concepto

## Dependencias

- motion/react: Para animaciones
- date-fns: Para formateo de fechas
- lucide-react: Para iconos
- tailwindcss: Para estilos

## Ejemplo de integración

```tsx
import { ConceptCard } from '@/components/cards/concept-card';
import { useRouter } from 'next/navigation';
import { getConcepts } from '@/app/actions/concepts/concept.actions';

export default async function ConceptsPage() {
  const concepts = await getConcepts();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Conceptos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {concepts.map(concept => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onClick={() => router.push(`/concepts/${concept.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```