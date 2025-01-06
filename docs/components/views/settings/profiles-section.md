# 👤 Profiles Section

## 📝 Descripción

El componente `ProfilesSection` es una sección de configuración que permite gestionar los perfiles de usuario en el sistema. Proporciona una interfaz para crear, editar y cambiar entre diferentes perfiles, cada uno con su propia configuración personalizada.

## 🔧 Características Principales

### Gestión

- Creación de perfiles
- Edición de perfiles
- Cambio de perfil activo
- Eliminación de perfiles

### Personalización

- Nombre del perfil
- Emoji personalizado
- Color del perfil
- Configuración individual

## 🏗️ Estructura

### Interfaces

```typescript
interface Profile {
	id: string;
	name: string;
	emoji: string;
	color: string;
	isActive: boolean;
}

interface ProfileUpdate {
	name?: string;
	emoji?: string;
	color?: string;
}
```

### Estados Principales

```typescript
const { settings, updateProfile, setActiveProfile, deleteProfile } =
	useSettingsContext();
const { profiles, activeProfile } = settings;
const activeProfileData = profiles.find((p) => p.id === activeProfile);
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga de perfiles
   - Identificación de perfil activo
   - Configuración inicial

2. **Gestión**

   - Creación de perfiles
   - Edición de datos
   - Activación/desactivación
   - Eliminación segura

3. **Actualización**
   - Persistencia de cambios
   - Sincronización de estado
   - Notificaciones
   - Recarga de datos

## 📊 Funcionalidades

### Gestión de Perfiles

```typescript
const handleUpdateActiveProfile = async (updates: Partial<Profile>) => {
	if (activeProfileData) {
		await updateProfile(activeProfileData.id, updates);
	}
};

const handleAddProfile = async () => {
	await updateProfile(null, {
		name: "Nuevo Perfil",
		emoji: "👤",
		color: "#3b82f6",
	});
};

const handleDeleteProfile = async (id: string) => {
	if (profiles.length === 1) return;
	await deleteProfile(id);
};
```

## 🎨 Componentes UI

### Perfil Activo

- `ActiveProfileCard`: Tarjeta de perfil activo
- `EmojiPicker`: Selector de emoji
- `ColorPicker`: Selector de color
- `ProfileForm`: Formulario de edición

### Lista de Perfiles

- `ProfileList`: Lista de perfiles
- `ProfileCard`: Tarjeta de perfil
- `AddProfileButton`: Botón de nuevo perfil
- `DeleteProfileButton`: Botón de eliminación

## 🔍 Consideraciones

### Rendimiento

- Optimización de renders
- Gestión de estado eficiente
- Caché de perfiles
- Actualizaciones selectivas

### UX/UI

- Feedback visual claro
- Transiciones suaves
- Estados de hover
- Acciones contextuales

### Seguridad

- Validación de operaciones
- Perfil por defecto
- Backup de datos
- Prevención de eliminación total

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<ProfilesSection />

// Con configuración personalizada
<ProfilesSection
  maxProfiles={5}
  allowDeletion={true}
/>
```

## 🔗 Dependencias

- `@/context/settings-context`: Contexto de configuración
- `@/components/ui`: Componentes de UI
- `@/components/ui/emoji-picker`: Selector de emojis
- `react-color`: Selector de colores
- `lucide-react`: Iconos

## 📝 Notas Técnicas

### Optimizaciones

- Memorización de componentes
- Gestión eficiente de estado
- Caché de perfiles
- Validación optimizada

### Persistencia

- Almacenamiento local
- Sincronización
- Backup automático
- Recuperación de datos

### Mantenibilidad

- Código modular
- Tipos definidos
- Documentación clara
- Tests unitarios

### Integración

- Sistema de perfiles
- Gestión de estado
- Eventos del sistema
- Sincronización global

```

```
