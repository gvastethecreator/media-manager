#!/usr/bin/env node

/**
 * 📚 Component Documentation Helper
 *
 * Script para ayudar a documentar componentes durante el desarrollo
 * Ejecutar: node scripts/document-component.js [componentPath]
 */

const fs = require('fs');
const path = require('path');

const DOCS_PATH = 'docs/components-documentation.md';

/**
 * Generar template de documentación para un componente
 */
function generateComponentTemplate(componentPath, componentName) {
	const date = new Date().toLocaleDateString('es-ES');

	return `
### \`${componentName}\` - [Descripción Breve]
**Ubicación**: \`${componentPath}\`
**Última Modificación**: ${date} - [Descripción del cambio]

**Responsabilidades**:

- ⚠️ [Responsabilidad 1]
- ⚠️ [Responsabilidad 2]

**Funcionalidades**:

- **Feature 1**: [Descripción técnica]
- **Feature 2**: [Descripción técnica]

**Props Interface**:

\`\`\`typescript
interface ${componentName}Props {
  // TODO: Definir props
}
\`\`\`

**Integración**:

- Usa \`useAppStore\` para [describir estados]
- Comunica con [otros componentes] através de [método]

**Estado**: ⚠️ En desarrollo

**Notas de Desarrollo**:

- [Decisión técnica importante]
- [Problema conocido o mejora futura]

---
`;
}

/**
 * Extraer información básica de un archivo de componente
 */
function analyzeComponent(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');

		// Extraer nombre del componente
		const componentMatch = content.match(/export function (\w+)/);
		const componentName = componentMatch ? componentMatch[1] : 'UnknownComponent';

		// Extraer props interface
		const propsMatch = content.match(/interface (\w+Props)[^}]+}/);
		const propsInterface = propsMatch ? propsMatch[0] : null;

		// Detectar hooks utilizados
		const useAppStoreMatch = content.includes('useAppStore');
		const useStateMatch = content.includes('useState');
		const useEffectMatch = content.includes('useEffect');

		// Detectar imports importantes
		const imports = [];
		if (content.includes('lucide-react')) imports.push('lucide-react');
		if (content.includes('sonner')) imports.push('sonner (toasts)');
		if (content.includes('zustand')) imports.push('zustand (estado)');

		return {
			componentName,
			propsInterface,
			hooks: { useAppStore: useAppStoreMatch, useState: useStateMatch, useEffect: useEffectMatch },
			imports,
			hasToasts: content.includes('toast.'),
			hasJSDoc: content.includes('/**'),
		};
	} catch (error) {
		console.error('Error analizando componente:', error);
		return null;
	}
}

/**
 * Agregar documentación a la documentación principal
 */
function appendToDocumentation(template) {
	try {
		const currentDocs = fs.readFileSync(DOCS_PATH, 'utf8');
		const insertPoint = currentDocs.indexOf('## 🎯 Próximos Componentes a Documentar');

		if (insertPoint === -1) {
			// Si no encuentra el punto de inserción, agregar al final
			fs.appendFileSync(DOCS_PATH, template);
		} else {
			// Insertar antes de la sección de próximos componentes
			const beforeSection = currentDocs.substring(0, insertPoint);
			const afterSection = currentDocs.substring(insertPoint);
			fs.writeFileSync(DOCS_PATH, beforeSection + template + '\n' + afterSection);
		}

		console.log('✅ Documentación agregada exitosamente');
	} catch (error) {
		console.error('❌ Error agregando documentación:', error);
	}
}

/**
 * Función principal
 */
function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log('📚 Component Documentation Helper');
		console.log('');
		console.log('Uso: node scripts/document-component.js <componentPath>');
		console.log('');
		console.log('Ejemplo:');
		console.log('  bun scripts/document-component.js src/components/MyComponent.tsx');
		console.log('');
		return;
	}

	const componentPath = args[0];
	const fullPath = path.resolve(componentPath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ Archivo no encontrado: ${fullPath}`);
		return;
	}

	console.log(`📝 Analizando componente: ${componentPath}`);

	const analysis = analyzeComponent(fullPath);
	if (!analysis) {
		console.error('❌ No se pudo analizar el componente');
		return;
	}

	console.log(`🔍 Componente detectado: ${analysis.componentName}`);
	console.log('📦 Hooks detectados:', analysis.hooks);
	console.log('📚 Imports:', analysis.imports);

	const template = generateComponentTemplate(componentPath, analysis.componentName);
	console.log('');
	console.log('📄 Template generado:');
	console.log('────────────────────────────────');
	console.log(template);
	console.log('────────────────────────────────');

	// Preguntar si agregar a la documentación
	const readline = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	readline.question('¿Agregar a la documentación principal? (y/N): ', (answer) => {
		if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
			appendToDocumentation(template);
		} else {
			console.log('📋 Template generado. Puedes copiarlo manualmente a la documentación.');
		}
		readline.close();
	});
}

if (require.main === module) {
	main();
}

module.exports = { generateComponentTemplate, analyzeComponent };
