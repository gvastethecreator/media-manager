#!/usr/bin/env node

/**
 * Helper script para trabajar con Playwright MCP
 * Proporciona utilidades para generar tests y ejecutar pruebas automatizadas
 */

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CONFIG_FILE = 'playwright-mcp.config.json';
const TEST_DIR = 'tests/e2e';

/**
 * Cargar configuración de Playwright MCP
 */
function loadConfig() {
	if (!existsSync(CONFIG_FILE)) {
		console.error(chalk.red(`❌ No se encontró el archivo de configuración: ${CONFIG_FILE}`));
		process.exit(1);
	}

	try {
		const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
		return config;
	} catch (error) {
		console.error(chalk.red(`❌ Error al leer la configuración: ${error.message}`));
		process.exit(1);
	}
}

/**
 * Generar test a partir de un escenario
 */
function generateTestFromScenario(scenario, config) {
	const testName = scenario.name.toLowerCase().replace(/\s+/g, '-');
	const testContent = `import { test, expect } from '@playwright/test';

test.describe('${scenario.name}', () => {
  test('${scenario.description}', async ({ page }) => {
    // Configurar viewport si es necesario
    await page.setViewportSize({
      width: ${config.settings.viewport.width},
      height: ${config.settings.viewport.height}
    });

    // Pasos del test generados automáticamente
${scenario.steps
	.map(
		(step, index) => `    // Paso ${index + 1}: ${step}
    ${generateStepCode(step, config)}`
	)
	.join('\n\n')}
  });
});
`;

	const testFile = join(TEST_DIR, `generated-${testName}.spec.ts`);
	writeFileSync(testFile, testContent);
	console.log(chalk.green(`✅ Test generado: ${testFile}`));
}

/**
 * Generar código para un paso específico
 */
function generateStepCode(step, config) {
	const stepLower = step.toLowerCase();

	if (stepLower.includes('navigate')) {
		return `await page.goto('${config.settings.baseURL}');`;
	}

	if (stepLower.includes('wait for apps')) {
		return `await page.waitForSelector('${config.selectors.apps}', { timeout: ${config.settings.timeout} });`;
	}

	if (stepLower.includes('verify main content')) {
		return `await expect(page.locator('${config.selectors.dashboard}')).toBeVisible();`;
	}

	if (stepLower.includes('take screenshot')) {
		return `await page.screenshot({ path: 'test-results/screenshot-${Date.now()}.png' });`;
	}

	if (stepLower.includes('click on first app')) {
		return `await page.locator('${config.selectors.apps}').first().click();`;
	}

	if (stepLower.includes('change viewport to mobile')) {
		return 'await page.setViewportSize({ width: 375, height: 667 });';
	}

	if (stepLower.includes('enable edit mode')) {
		return `await page.locator('${config.selectors.editToggle}').click();`;
	}

	if (stepLower.includes('verify drag handles')) {
		return `await expect(page.locator('${config.selectors.dragHandle}')).toBeVisible();`;
	}

	// Paso genérico
	return `// TODO: Implementar paso: ${step}`;
}

/**
 * Mostrar ayuda
 */
function showHelp() {
	console.log(
		chalk.blue(`
🎭 Playwright MCP Helper

Comandos disponibles:
  generate-tests    Generar tests automáticamente desde la configuración
  list-scenarios    Listar escenarios disponibles
  validate-config   Validar archivo de configuración
  help             Mostrar esta ayuda

Ejemplos:
  node scripts/playwright-mcp-helper.js generate-tests
  node scripts/playwright-mcp-helper.js list-scenarios
`)
	);
}

/**
 * Listar escenarios disponibles
 */
function listScenarios(config) {
	console.log(chalk.blue('\n📋 Escenarios disponibles:\n'));

	config.testScenarios.forEach((scenario, index) => {
		console.log(chalk.yellow(`${index + 1}. ${scenario.name}`));
		console.log(chalk.gray(`   ${scenario.description}`));
		console.log(chalk.gray(`   Pasos: ${scenario.steps.length}`));
		console.log('');
	});
}

/**
 * Validar configuración
 */
function validateConfig(config) {
	console.log(chalk.blue('🔍 Validando configuración...\n'));

	const required = ['name', 'settings', 'testScenarios', 'selectors'];
	const missing = required.filter((key) => !config[key]);

	if (missing.length > 0) {
		console.error(chalk.red(`❌ Faltan propiedades requeridas: ${missing.join(', ')}`));
		return false;
	}

	if (!Array.isArray(config.testScenarios) || config.testScenarios.length === 0) {
		console.error(chalk.red('❌ No hay escenarios de test definidos'));
		return false;
	}

	console.log(chalk.green('✅ Configuración válida'));
	console.log(chalk.gray(`   Escenarios: ${config.testScenarios.length}`));
	console.log(chalk.gray(`   Selectores: ${Object.keys(config.selectors).length}`));

	return true;
}

/**
 * Generar todos los tests
 */
function generateAllTests(config) {
	console.log(chalk.blue('🚀 Generando tests automáticamente...\n'));

	if (!validateConfig(config)) {
		process.exit(1);
	}

	config.testScenarios.forEach((scenario) => {
		generateTestFromScenario(scenario, config);
	});

	console.log(chalk.green(`\n✅ Se generaron ${config.testScenarios.length} archivos de test`));
	console.log(chalk.gray('💡 Ejecuta los tests con: pnpm test:e2e'));
}

// Procesar argumentos de línea de comandos
const command = process.argv[2];

if (!command || command === 'help') {
	showHelp();
	process.exit(0);
}

const config = loadConfig();

switch (command) {
	case 'generate-tests':
		generateAllTests(config);
		break;

	case 'list-scenarios':
		listScenarios(config);
		break;

	case 'validate-config':
		validateConfig(config);
		break;

	default:
		console.error(chalk.red(`❌ Comando desconocido: ${command}`));
		showHelp();
		process.exit(1);
}
