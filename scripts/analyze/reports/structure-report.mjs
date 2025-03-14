/**
 * Generador de reportes para el análisis de estructura del proyecto
 * @module structure-report
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { generateDirectoryTree } from '../utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera un reporte de análisis de estructura del proyecto
 * @param {Object} structure - Resultados del análisis de estructura
 * @returns {Promise<string>} Contenido del reporte en formato Markdown
 */
export async function generateStructureReport(structure) {
	// Generar árbol de directorios para src
	const projectRoot = path.resolve(__dirname, '../../../');
	const srcPath = path.join(projectRoot, 'src');
	const tree = await generateDirectoryTree(srcPath);

	return `# 📁 Estructura del Proyecto

> Documentación de la estructura de archivos y directorios del proyecto

## 🌳 Árbol de Directorios

\`\`\`
${tree}
\`\`\`

## 📂 Descripción de Directorios Principales

### 📱 \`src/\`
- Contiene el código fuente principal de la aplicación
- Organizado por funcionalidad y tipo de componente

### 🧩 \`src/app/\`
- Implementación del App Router de Next.js 15
- Contiene layouts, páginas y componentes de ruta

### 🧩 \`src/components/\`
- Componentes React reutilizables
- Cada componente en su propio directorio con estilos y tests

### 📚 \`src/lib/\`
- Utilidades y funciones compartidas
- Configuración de bibliotecas externas

### 🎨 \`src/styles/\`
- Estilos globales y temas
- Configuración de Tailwind CSS

### 🔧 \`src/utils/\`
- Funciones utilitarias y helpers
- Lógica compartida entre componentes

### 📡 \`src/api/\`
- Configuración y llamadas a APIs
- Servicios y endpoints

### 🏗️ \`src/hooks/\`
- Custom hooks de React
- Lógica reutilizable de estado y efectos

### 📦 \`src/store/\`
- Estado global de la aplicación
- Configuración de Zustand

### 🔄 \`src/providers/\`
- Proveedores de contexto de React
- Configuración de temas, autenticación, etc.

## 🔍 Convenciones de Nombrado

- 📄 Archivos de componentes: \`PascalCase.tsx\`
- 📄 Archivos de utilidades: \`camelCase.ts\`
- 📄 Archivos de estilos: \`styles.css\` o \`ComponentName.module.css\`
- 📄 Archivos de test: \`ComponentName.test.tsx\`

## 🎯 Organización de Imports

1. Imports de React y Next.js
2. Imports de bibliotecas externas
3. Imports de componentes
4. Imports de hooks y utilidades
5. Imports de estilos y assets

## 📝 Notas Adicionales

- Cada componente tiene su propio directorio con archivos relacionados
- Los tests están junto a los componentes que prueban
- Los estilos están modularizados por componente
- Se utiliza lazy loading para optimizar la carga

## 🔍 Patrones de Arquitectura

- **App Router**: Estructura basada en el sistema de archivos de Next.js 15
- **Server Components**: Componentes renderizados en el servidor para mejor rendimiento
- **Client Components**: Componentes interactivos con estado y efectos
- **Server Actions**: Funciones del servidor para manejar formularios y mutaciones
- **Composición de Componentes**: Componentes pequeños y reutilizables
- **Hooks Personalizados**: Abstracción de lógica compleja en hooks reutilizables

> _Última actualización: ${new Date().toLocaleString()}_
`;
}

export default {
	generateStructureReport,
};
