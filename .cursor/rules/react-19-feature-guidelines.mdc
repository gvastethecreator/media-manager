---
description: Framework-specific patterns for adding features to React 19 applications
globs: '**/*.tsx, **/*.jsx, **/*.ts, **/*.js'
---
# React 19 Feature Guidelines

```

# Server Components

Server Components are the foundation of React 19 applications. They enable automatic server-side rendering and improved performance.

```tsx
// DataFeature.tsx
async function DataFeature() {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  
  return (
    <div>
      {json.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

Key Patterns
- Keep data fetching and database operations in Server Components
- Use async/await for server operations
- Implement Suspense boundaries for loading states
- Structure components hierarchically for optimal streaming

# Client Components

Client Components handle interactive features and client-side state management.

```tsx
// InteractiveFeature.tsx
'use client';

import { useState, useOptimistic } from 'react';

function InteractiveFeature() {
  const [data, setData] = useState([]);
  const [optimisticData, addOptimisticData] = useOptimistic(
    data,
    (state, newItem) => [...state, newItem]
  );

  return (
    <div>
      {optimisticData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

Key Patterns
- Mark Client Components with 'use client' directive
- Use useOptimistic for immediate UI feedback
- Implement proper context boundaries for state management
- Keep client-side state minimal

# Server Actions

Server Actions provide a type-safe way to handle form submissions and data mutations.

```tsx
// FormFeature.tsx
async function submitForm(formData: FormData) {
  'use server';
  
  const data = Object.fromEntries(formData);
  await db.features.create(data);
}

function FormFeature() {
  return (
    <form action={submitForm}>
      <input name="featureName" />
      <button type="submit">Add Feature</button>
    </form>
  );
}
```

Key Patterns
- Use Server Actions for form handling and data mutations
- Implement optimistic updates for better UX
- Structure action boundaries for reusability
- Handle validation on both client and server

# Performance Optimization

React 19 provides powerful tools for optimizing application performance.

```tsx
// OptimizedFeature.tsx
function OptimizedFeature() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncFeature />
      <Suspense fallback={<SubLoading />}>
        <SubFeature />
      </Suspense>
    </Suspense>
  );
}
```

Key Patterns
- Use nested Suspense boundaries for granular loading states
- Implement proper code splitting with dynamic imports
- Utilize React.memo for expensive computations
- Structure routing for optimal code splitting

# SEO Optimization

React 19 provides built-in SEO capabilities through Server Components and Metadata API.

```tsx
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Title',
  description: 'Feature Description',
  openGraph: {
    title: 'Feature Title',
    description: 'Feature Description'
  }
};
```

Key Patterns
- Use Metadata API for dynamic SEO tags
- Implement proper semantic HTML structure
- Utilize Server Components for SEO-critical content
- Structure routes for optimal crawlability 
```
