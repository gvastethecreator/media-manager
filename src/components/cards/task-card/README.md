# TaskCard Component

Componente de tarjeta para visualizar tareas con estética **Trading Card Game (TCG)** holográfica.

## 📦 Características

- ✨ **Efectos TCG**: Gradiente holográfico animado, decoraciones de esquina, brillo en hover
- 📊 **Barra de progreso**: Color coding dinámico según porcentaje (gris < 50%, amarillo 50-74%, azul 75-99%, verde 100%)
- ⚠️ **Alertas de vencimiento**: Indicador visual con días restantes, fondo rojo si está vencida
- 🏷️ **Tags y categorías**: Visualización de hasta 3 tags (2 en compact) con indicador +N para los restantes
- ⏱️ **Horas rastreadas**: Estimadas vs reales con indicador de overtime en rojo
- 🔗 **Contadores de relaciones**: Subtareas, imágenes, videos, álbumes, personajes
- ⭐ **Acciones rápidas**: Toggle de favorito y archivado en el header
- 📅 **Timestamps**: Fechas de creación y actualización con formato relativo ("Hoy", "Ayer", "Hace Xd")
- 🎨 **Color automático**: Prioridad overrides status color, secundario auto-darkened (60%)
- 🔄 **Modos de renderizado**: Normal (300x420px) y compact (240x300px)
- ♿ **Accesibilidad**: Keyboard navigation (Enter/Space), ARIA labels, role="button"

## 🎯 Uso Básico

```tsx
import { TaskCard } from '@/components/cards/task-card';
import type { TaskWithStats } from '@/types/entities/task';

const task: TaskWithStats = {
  id: 1,
  title: "Implementar autenticación",
  emoji: "🔐",
  status: "in_progress",
  priority: "high",
  progress: 65,
  description: "Añadir JWT y refresh tokens",
  category: "Backend",
  tags: ["auth", "security", "jwt"],
  dueDate: new Date('2025-10-01'),
  estimatedHours: 8,
  actualHours: 5.5,
  isFavorite: false,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: {
    subtasks: 3,
    images: 2,
    videos: 0,
    albums: 1,
    characters: 0,
  },
};

<TaskCard 
  task={task} 
  onClick={() => console.log('Task clicked')} 
/>
```

## 🎨 Modo TCG

```tsx
<TaskCard 
  task={task} 
  tcgMode={true}
  compact={false}
/>
```

Activa:

- Gradiente holográfico animado (125deg, 3s infinite)
- Decoraciones de esquina (4 corners con borde redondeado)
- Glow on hover (inset shadow 15px blur)
- Box shadow dinámico basado en relaciones totales

## 📐 Modo Compact

```tsx
<TaskCard 
  task={task} 
  compact={true}
/>
```

Dimensiones: **240x300px** (vs 300x420px normal)

- Oculta notas
- Muestra máximo 2 tags
- Layout optimizado para grids densos

## 🔒 Estados Disabled/Selected

```tsx
<TaskCard 
  task={task} 
  disabled={true}       // Opacity 50%, cursor not-allowed
  isSelected={true}     // Ring 4px primary/60
/>
```

## 🎭 Acciones Rápidas

```tsx
<TaskCard 
  task={task} 
  onToggleFavorite={() => console.log('Toggle favorite')}
  onToggleArchived={() => console.log('Toggle archived')}
/>
```

## 🎨 Status & Priority Colors

**Status Colors:**

- `pending`: `#6b7280` (gray)
- `in_progress`: `#3b82f6` (blue)
- `completed`: `#10b981` (green)
- `cancelled`: `#ef4444` (red)

**Priority Colors:**

- `low`: `#6b7280` (gray)
- `medium`: `#eab308` (yellow)
- `high`: `#f97316` (orange)
- `urgent`: `#ef4444` (red)

⚠️ **Priority overrides status** para el color primario de la tarjeta.

## 📊 Progress Bar Color Logic

```typescript
progress === 100 ? 'bg-green-500'
: progress >= 75 ? 'bg-blue-500'
: progress >= 50 ? 'bg-yellow-500'
: 'bg-gray-500'
```

## ⏰ Due Date Logic

- **Overdue**: `dueDate < now && status !== 'completed' && status !== 'cancelled'`
- **Days Until Due**: `Math.ceil((dueDate - now) / 86400000)` (null si no aplica)
- **Red Alert**: Fondo rojo `bg-red-500/20` si está vencida

## 🏷️ Tags Parsing

Maneja automáticamente:

- Array directo: `['tag1', 'tag2']`
- JSON string: `'["tag1","tag2"]'`
- Fallback a array vacío si falla parsing

## 🔗 Relaciones

Contadores mostrados en footer:

- **ListTree**: Subtasks
- **Image**: Imágenes
- **Video**: Videos
- **Album**: Álbumes
- **User**: Personajes

Total de relaciones afecta intensidad del gradiente TCG (0.5 a 0.9 opacity, escala 0-100 relaciones).

## ♿ Accesibilidad

- **role**: `'button'` si onClick, `'article'` si solo visualización
- **tabIndex**: `0` si interactivo, `-1` si disabled/no onClick
- **aria-label**: `Task: {title}`
- **Keyboard**: Enter/Space triggers onClick (si no disabled)

## 📦 Estructura de Archivos

```
task-card/
├── index.ts                    # Barrel exports
├── task-card.types.ts          # TypeScript interfaces
├── task-card.tsx               # Main orchestrator (TCG effects)
├── task-card-header.tsx        # Title, status, priority, actions
├── task-card-content.tsx       # Description, progress, dates, tags
├── task-card-footer.tsx        # Timestamps, relation counts
└── README.md                   # This file
```

## 🧩 Sub-componentes

### TaskCardHeader

Props: `title`, `emoji`, `status`, `priority`, `isFavorite`, `isArchived`, callbacks

### TaskCardContent

Props: `description`, `status`, `priority`, `progress`, `category`, `tags`, `dueDate`, `estimatedHours`, `actualHours`, `notes`, `isOverdue`, `daysUntilDue`, `colors`, `compact`

### TaskCardFooter

Props: `createdAt`, `updatedAt`, `subtasksCount`, `imagesCount`, `videosCount`, `albumsCount`, `charactersCount`, `colors`

## 🎯 Dependencias

- `motion-shim` con GSAP (via `@/components/ui/motion-shim`)
- `lucide-react` (icons)
- `@/lib/utils` (cn utility)
- `@/components/cards/card-container`
- `@/components/cards/card-header`

## 🔄 Animaciones declarativas

```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
whileHover={{ y: -8, transition: { duration: 0.3 } }}
whileTap={{ scale: 0.98 }}
```

## 📝 Notas Técnicas

- **onClick signature**: motion.div NO recibe event parameter, solo `() => void`
- **Color darkening**: Secondary color = primary * 0.6 factor
- **Timestamps**: Relative format con `getRelativeTime` helper (maneja null con 'N/A')
- **TCG gradient**: `background-size: 200%` + `animation: gradient-shift 3s infinite`
- **Relation intensity**: `Math.min(0.5 + (totalRelations / 50) * 0.5, 0.9)`

## 🎨 Estilos Personalizados

```tsx
<TaskCard 
  task={task} 
  className="shadow-2xl"
  style={{ transform: 'rotate(2deg)' }}
/>
```

Props `className` y `style` se aplican al motion.div root.

## 🚀 Integración con Store

```tsx
import { useTaskStore } from '@/stores/task.store';

const TaskList = () => {
  const tasks = useTaskStore(s => s.tasks);
  const toggleFavorite = useTaskStore(s => s.toggleFavorite);
  const toggleArchived = useTaskStore(s => s.toggleArchived);
  
  return tasks.map(task => (
    <TaskCard
      key={task.id}
      task={task}
      onToggleFavorite={() => toggleFavorite(task.id)}
      onToggleArchived={() => toggleArchived(task.id)}
    />
  ));
};
```

## 🧪 Testing

```tsx
import { render } from '@testing-library/react';
import { TaskCard } from './task-card';

test('renders task with progress bar', () => {
  const task = { /* ... */ progress: 75 };
  const { getByText } = render(<TaskCard task={task} />);
  expect(getByText('75%')).toBeInTheDocument();
});
```

## 🎯 Roadmap

- [ ] Drag & drop support
- [ ] Multi-select mode
- [ ] Context menu (right-click actions)
- [ ] Inline editing
- [ ] Copy to clipboard
- [ ] Export to JSON/Markdown
