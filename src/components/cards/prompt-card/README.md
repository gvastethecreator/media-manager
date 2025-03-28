# PromptCard

Componente para mostrar información de prompts en formato de tarjeta con un diseño inspirado en cartas Magic.

## Estructura

El componente PromptCard está dividido en varios subcomponentes:

- **PromptCard**: Componente principal que integra todos los demás
- **PromptCardContent**: Muestra la descripción, parámetros, etiquetas y contadores de relaciones
- **PromptCardFooter**: Muestra información de fechas, categoría y contadores
- **PromptCardImages**: Muestra las imágenes relacionadas con el prompt
- **prompt-server-actions.ts**: Contiene las acciones del servidor para obtener datos

## Uso

```tsx
import { PromptCard } from '@/components/cards/prompt-card';

// En un componente
function PromptList({ prompts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onClick={() => handlePromptClick(prompt)}
        />
      ))}
    </div>
  );
}
```

## Props

### PromptCard

| Prop | Tipo | Descripción |
|------|------|-------------|
| prompt | `Prompt & { _count?: { images: number; concepts: number; }; imageCount?: number; conceptCount?: number; }` | Datos del prompt a mostrar |
| onClick | `() => void` | Función opcional a ejecutar al hacer clic en la tarjeta |
| className | `string` | Clases CSS adicionales para personalizar la tarjeta |
| style | `React.CSSProperties` | Estilos CSS adicionales |

## Características

- **Diseño Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Interacción**: Animaciones sutiles al pasar el cursor y hacer clic
- **Accesibilidad**: Soporte para navegación por teclado y atributos ARIA
- **Personalización**: Los colores se derivan del color del prompt
- **Estadísticas**: Muestra contadores de relaciones con otras entidades
- **Imágenes**: Muestra las últimas 6 imágenes relacionadas con el prompt
- **Optimización**: Versión memorizada disponible para mejorar rendimiento en listas

## Dependencias

- motion/react: Para animaciones
- date-fns: Para formateo de fechas
- lucide-react: Para iconos
- tailwindcss: Para estilos

## Ejemplo de integración

```tsx
import { MemoizedPromptCard } from '@/components/cards/prompt-card';
import { useRouter } from 'next/navigation';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';

export default async function PromptsPage() {
  const prompts = await getPrompts();
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prompts</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {prompts.map(prompt => (
          <MemoizedPromptCard
            key={prompt.id}
            prompt={prompt}
            onClick={() => router.push(`/prompts/${prompt.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```