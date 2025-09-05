#!/usr/bin/env node

// Implementación mínima y tolerante del parser de logs utilizado por scripts de tooling
// Objetivo: evitar fallos cuando no exista un parser avanzado y proveer un resumen simple útil.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function detectToolFromFileName(filePath) {
	const name = path.basename(filePath).toLowerCase();
	if (name.includes('tsc') || name.includes('typescript')) return 'tsc';
	if (name.includes('biome')) return 'biome';
	if (name.includes('eslint')) return 'eslint';
	if (name.includes('prettier')) return 'prettier';
	if (name.includes('playwright')) return 'playwright';
	return 'unknown';
}

// Heurísticas simples para clasificar líneas
function isErrorLine(line) {
	const s = line.toLowerCase();
	return /\berror\b|✘|failed/.test(s);
}
function isWarningLine(line) {
	const s = line.toLowerCase();
	return /\bwarning\b|\bwarn\b/.test(s);
}

export function parseLogFile(logFile, toolHint = 'unknown') {
	if (!(logFile && existsSync(logFile))) return null;
	const content = readFileSync(logFile, 'utf8');
	const lines = content.split(/\r?\n/);

	const errors = [];
	const warnings = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (isErrorLine(trimmed)) errors.push(trimmed);
		else if (isWarningLine(trimmed)) warnings.push(trimmed);
	}

	const stats = {
		tool: toolHint,
		totalLines: lines.length,
		totalErrors: errors.length,
		totalWarnings: warnings.length,
		firstErrors: errors.slice(0, 5),
		firstWarnings: warnings.slice(0, 5),
	};

	return { stats, errors, warnings };
}

export function displaySimpleErrorSummary(summary) {
	if (!summary?.stats) return;
	const { tool, totalErrors, totalWarnings, firstErrors, firstWarnings } = summary.stats;
	console.log('');
	console.log('══════════════════════════════════════════════════════════');
	console.log(`📊 Resumen (${tool}) -> errores: ${totalErrors}, warnings: ${totalWarnings}`);
	if (totalErrors > 0) {
		console.log('❌ Primeros errores:');
		for (const line of firstErrors) console.log(`  • ${line}`);
	}
	if (totalWarnings > 0) {
		console.log('⚠️  Primeros warnings:');
		for (const line of firstWarnings) console.log(`  • ${line}`);
	}
	console.log('══════════════════════════════════════════════════════════');
}

export function generateLogSummary(summary) {
	if (!summary?.stats) return 'No se pudo generar resumen.';
	const { tool, totalErrors, totalWarnings, firstErrors, firstWarnings } = summary.stats;
	const parts = [];
	parts.push('📊 RESUMEN DE ERRORES/WARNINGS');
	parts.push(`Herramienta: ${tool}`);
	parts.push(`Errores: ${totalErrors}`);
	parts.push(`Warnings: ${totalWarnings}`);
	parts.push('');
	if (firstErrors?.length) {
		parts.push('❌ Errores (primeros):');
		for (const e of firstErrors) parts.push(`  • ${e}`);
		parts.push('');
	}
	if (firstWarnings?.length) {
		parts.push('⚠️  Warnings (primeros):');
		for (const w of firstWarnings) parts.push(`  • ${w}`);
		parts.push('');
	}
	return parts.join('\n');
}
