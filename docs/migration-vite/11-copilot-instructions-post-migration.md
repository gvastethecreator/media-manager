# T12 – Instrucciones Copilot / IA Post-Migración

## Objetivo

Ensure that AI assistance tools (GitHub Copilot, Cursor, etc.) produce code consistent with the new Vite stack.

## Guía rápida de prompts

| Caso | Prompt recomendado |
|------|-------------------|
| Crear componente UI | `// Crea componente React19 functional con Tailwind4 para botón primario` |
| Endpoint API | `// Express5 POST /albums con validación Zod` |
| Hook Zustand | `// Hook Zustand para gestionar estado de sidebar` |
| Prueba Vitest | `// Escribe test Vitest para AlbumsService.createAlbum` |
| Script PowerShell | `# PowerShell: crear zip release` |

## Reglas de generación

1. **Import paths** should use `@/*` alias.
2. **Do not use** `require`, use `import` ES.
3. **Do not use** Next.js APIs (`next/*`).
4. **Always** include explicit types.
5. **Windows friendly**: `path.join`, no unix paths.
6. **Usar imports absolutos** con alias `@/`, prohibido `../../..` fuera de `src`.

## Snippet boilerplate recomendado

```ts
/* eslint-disable @typescript-eslint/explicit-function-return-type */
```

## Ejemplo positivo

```tsx
import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ variant = 'primary', className, ...rest }: Props) => (
  <button
    {...rest}
    className={clsx(
      'px-3 py-2 rounded font-semibold transition-colors',
      variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
      variant === 'secondary' && 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      className
    )}
  />
);
```

## Configuración Copilot

Add to `.copilot.json`:

```jsonc
{
  "default_comment": "// Generated with Vite 7 + React 19 guidelines",
  "rules": [
    "no-nextjs",
    "prefer-tailwind",
    "windows-paths"
  ]
}
```

---

> **Nota:** Estas reglas se revisarán trimestralmente.
