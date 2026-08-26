# Utils (`src/utils`)

This directory holds light helpers for paths, basic data transforms, and small standalone utilities.

These helpers complement `src/lib`.

The utilities in this directory do not depend on React or server code.

You can import them from client or server components.

## Example

```ts
import { cn } from '@/utils';
const classes = cn('p-2', condition && 'text-red-500');
```

If a utility starts to own business logic or database access, move it to `src/lib`.

Document that move in `docs/utils-lib.md`.
