# 🎨 Componentes de Emojis

Esta carpeta contiene los componentes relacionados con la selección y visualización de emojis en el proyecto.

## 📦 Dependencias

El proyecto utiliza **[Frimousse](https://github.com/liveblocks/frimousse)** como biblioteca principal para el manejo de emojis:

- ⚡️ **Ligero y rápido**: Sin dependencias, tree-shakable, virtualizado
- 🎨 **Sin estilos y composable**: Trae tus propios estilos
- 🔄 **Siempre actualizado**: Datos de emoji más recientes
- 🔣 **Sin símbolos �**: Emojis no soportados se ocultan automáticamente
- ♿️ **Accesible**: Navegable por teclado y compatible con lectores de pantalla

## 🧩 Componentes

### EmojiPicker

Componente principal para selección de emojis con dos modos de uso:

#### Props

```typescript
interface EmojiPickerProps {
 value?: string;              // Emoji seleccionado actual
 onEmojiSelect?: (emoji: string) => void;  // Callback al seleccionar
 onChange?: (emoji: string) => void;       // Callback alternativo
 compact?: boolean;           // Modo compacto (default: true)
 showLabel?: boolean;         // Mostrar icono de sonrisa (default: true)
 className?: string;          // Clases CSS adicionales
}
```

#### Uso Básico

```tsx
import { EmojiPicker } from '@/components/core/emojis/emoji-picker';

// Modo compacto (formularios)
<EmojiPicker
 value="📦"
 onEmojiSelect={(emoji) => console.log(emoji)}
 compact={true}
 showLabel={false}
/>

// Modo completo
<EmojiPicker
 value="🎨"
 onEmojiSelect={(emoji) => console.log(emoji)}
 compact={false}
/>
```

### EmojiList

Componente para mostrar listas categorizadas de emojis del directorio `public/emojis/`.

```tsx
import EmojiList from '@/components/core/emojis/emoji-list';

<EmojiList />
```

## 🎯 Emojis Frecuentes

El proyecto incluye una selección curada de emojis frecuentes específicos para gestión de imágenes:

```typescript
const frequentEmojis = [
 '📦', '🗃️', '🧰', '💎', '🏆', '🎁', '🔮', '⚔️', '🛡️', '📚',
 '🧙‍♂️', '🧝‍♀️', '🧪', '🧬', '🔍', '🔑', '💰', '🪙', '🧿', '🏺',
 '🍄', '🌿', '🔥', '💧', '⚡', '🌪️', '❄️', '🪄', '🧠', '💀',
 '🎨', '🎮', '🎲', '🎭', '🎪', '🎰', '🎳', '🎯', '🎱', '🎤',
];
```

## 🔄 Migración desde emoji-mart

Este proyecto migró de `emoji-mart` a `frimousse` para:

- ✅ Mejor rendimiento y menor tamaño de bundle
- ✅ Componentes más composables y flexibles
- ✅ Mejor soporte para React 19
- ✅ Datos de emoji siempre actualizados
- ✅ Mejor accesibilidad

### Cambios en la API

```typescript
// Antes (emoji-mart)
import Picker from '@emoji-mart/react';
<Picker onEmojiSelect={(emoji) => console.log(emoji.native)} />

// Ahora (frimousse + wrapper)
import { EmojiPicker } from '@/components/core/emojis/emoji-picker';
<EmojiPicker onEmojiSelect={(emoji) => console.log(emoji)} />
```

## 🎨 Personalización

Los componentes usan Tailwind CSS y pueden personalizarse:

```tsx
<EmojiPicker
 className="custom-emoji-picker"
 compact={true}
 // Los estilos se aplican al contenedor principal
/>
```

## 📱 Responsive

Los componentes se adaptan automáticamente:

- **Móvil**: Grid más compacto, botones más grandes
- **Tablet/Desktop**: Grid más amplio, más emojis visibles

## 🔧 Desarrollo

Para agregar nuevos emojis frecuentes, edita el array `frequentEmojis` en cada componente.

Para modificar categorías, revisa el componente `EmojiList` y la estructura de carpetas en `public/emojis/`.
