# Image Manager

Sistema de gestión de imágenes con capacidades avanzadas de organización y categorización.

## Características

- 📁 Gestión de carpetas y archivos
- 🏷️ Sistema de etiquetas
- 📚 Colecciones y álbumes
- 👥 Personajes y lugares
- 🎭 Objetos y propiedades
- 📊 Estadísticas y seguimiento
- 🔄 Cola de procesamiento
- 🖼️ Generación de miniaturas
- 📱 Interfaz responsive

## Estructura del Proyecto

```
image-manager/
├── docs/               # Documentación
│   ├── database/      # Documentación de la base de datos
│   ├── api/           # Documentación de la API
│   └── guides/        # Guías de usuario
├── prisma/            # Schema y migraciones
├── public/            # Archivos estáticos
└── src/
    ├── components/    # Componentes React
    ├── hooks/         # Hooks personalizados
    ├── lib/           # Utilidades
    ├── services/      # Servicios
    └── store/         # Estado global
```

## Modelos de Datos

El sistema utiliza varios modelos para organizar la información:

- **Images**: Gestión de imágenes y metadatos
- **Collections**: Agrupación temática de imágenes
- **Tags**: Etiquetado flexible
- **Albums**: Organización por álbumes
- **Characters**: Personajes y sus atributos
- **Places**: Lugares y ubicaciones
- **Objects**: Objetos y propiedades

Para más detalles, consulta la [documentación del schema](docs/database/schema.md).

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/image-manager.git
cd image-manager
```

2. Instala las dependencias:

```bash
pnpm install
```

3. Configura la base de datos:

```bash
pnpm prisma generate
pnpm prisma db push
```

4. Ejecuta el seed:

```bash
pnpm prisma db seed
```

5. Inicia el servidor de desarrollo:

```bash
pnpm dev
```

## Configuración

El sistema utiliza variables de entorno para su configuración. Copia el archivo `.env.example` a `.env` y ajusta los valores según tu entorno.

## Desarrollo

### Comandos Útiles

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Construye la aplicación
- `pnpm start`: Inicia la aplicación en producción
- `pnpm lint`: Ejecuta el linter
- `pnpm test`: Ejecuta las pruebas
- `pnpm prisma studio`: Abre el explorador de base de datos

### Convenciones

- Utiliza TypeScript para todo el código
- Sigue las guías de estilo de ESLint
- Documenta los componentes y funciones principales
- Usa commits semánticos

## Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.
